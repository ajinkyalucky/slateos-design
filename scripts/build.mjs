// Builds SlateOS: tokens.json -> CSS custom properties, bundles base + components + fonts,
// checks WCAG contrast, and assembles the static docs site into public/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execFileSync } from 'node:child_process';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);
const PREFIX = 'slate';

// Components must be built from tokens (scripts/lint.mjs); fail the build early if not.
try { execFileSync('node', [p('scripts/lint.mjs')], { stdio: 'inherit' }); } catch { process.exit(1); }

const tokens = JSON.parse(readFileSync(p('tokens/tokens.json'), 'utf8'));

function flatten(obj, path = [], out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) out[[...path, k].join('.')] = v.$value;
    else flatten(v, [...path, k], out);
  }
  return out;
}

const primitive = flatten(tokens.primitive);
const component = flatten(tokens.component);
const density = Object.fromEntries(Object.entries(tokens.density).map(([k, v]) => [k, flatten(Object.fromEntries(Object.entries(v).map(([n, val]) => [n, { $value: val }])))]));
const semantic = { light: flatten(tokens.semantic.light), dark: flatten(tokens.semantic.dark) };

const varName = (path) => `--${PREFIX}-${path.replace(/\./g, '-')}`;
const REF = /^\{(.+)\}$/;

// CSS output keeps references as var() so the layers stay visible in DevTools.
function toCss(value) {
  const m = REF.exec(value);
  if (!m) return value;
  if (!(m[1] in primitive)) throw new Error(`Unknown token reference ${value}`);
  return `var(${varName(m[1])})`;
}

// Resolved output (and contrast checks) need literal values.
function resolve(value) {
  const m = REF.exec(value);
  if (!m) return value;
  if (!(m[1] in primitive)) throw new Error(`Unknown token reference ${value}`);
  return resolve(primitive[m[1]]);
}

const decls = (map, resolver) =>
  Object.entries(map).map(([k, v]) => `    ${varName(k)}: ${resolver(v)};`).join('\n');

// --- contrast check -------------------------------------------------------
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const failures = [];
for (const theme of ['light', 'dark']) {
  for (const [fg, bg] of tokens.contrast.pairs) {
    const r = ratio(resolve(semantic[theme][fg]), resolve(semantic[theme][bg]));
    if (r < 4.5) failures.push(`${theme}: ${fg} on ${bg} = ${r.toFixed(2)}:1`);
  }
}
if (failures.length) {
  console.error('Contrast check failed (need 4.5:1):\n  ' + failures.join('\n  '));
  process.exit(1);
}

// --- tokens.css -----------------------------------------------------------
const tokensCss = `@layer ${PREFIX}.tokens, ${PREFIX}.base, ${PREFIX}.components;

@layer ${PREFIX}.tokens {
  :root {
${decls(primitive, toCss)}
${decls(component, toCss)}
${decls(semantic.light, toCss)}
    color-scheme: light;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${decls(semantic.dark, toCss)}
      color-scheme: dark;
    }
  }

  :root[data-theme="dark"] {
${decls(semantic.dark, toCss)}
    color-scheme: dark;
  }

${Object.entries(density).map(([name, map]) => `  [data-density="${name}"] {\n${decls(map, toCss)}\n  }`).join('\n\n')}
}
`;

// --- dist -----------------------------------------------------------------
const dist = p('dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

const fonts = [
  ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter.woff2'],
  ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', 'jetbrains-mono.woff2'],
];
for (const [from, to] of fonts) {
  const src = p('node_modules', from);
  if (!existsSync(src)) throw new Error(`Missing font ${from}. Run npm install first.`);
  cpSync(src, join(dist, 'fonts', to));
}

const read = (f) => readFileSync(p('src', f), 'utf8');
const COMPONENT_ORDER = ['general', 'typography', 'layout', 'forms', 'data', 'feedback', 'navigation', 'overlays', 'patterns', 'utilities'];
const componentsCss = COMPONENT_ORDER.map((f) => read(`components/${f}.css`)).join('\n');
const minify = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n');

writeFileSync(join(dist, 'tokens.css'), tokensCss);
const bundle = [read('fonts.css'), tokensCss, read('base.css'), componentsCss].join('\n');
writeFileSync(join(dist, 'slateos.css'), bundle);
writeFileSync(join(dist, 'slateos.min.css'), minify(bundle));
cpSync(p('src/slateos.js'), join(dist, 'slateos.js'));

// icons: src/icons.json -> sprite injector (dist/icons.js) + standalone sprite (dist/icons.svg)
const icons = JSON.parse(readFileSync(p('src/icons.json'), 'utf8'));
const symbols = Object.entries(icons)
  .map(([k, v]) => `<symbol id="slate-icon-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`)
  .join('');
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${symbols}</svg>`;
writeFileSync(join(dist, 'icons.svg'), sprite);
writeFileSync(
  join(dist, 'icons.js'),
  `/* SlateOS icons: inline sprite. Use <svg class="slate-icon"><use href="#slate-icon-NAME"/></svg> */\n(function(){var s=${JSON.stringify(sprite)};function a(){document.body.insertAdjacentHTML('afterbegin',s)}document.body?a():document.addEventListener('DOMContentLoaded',a)})();\n`,
);
writeFileSync(
  join(dist, 'tokens.json'),
  JSON.stringify(
    {
      primitive: Object.fromEntries(Object.entries(primitive).map(([k, v]) => [k, resolve(v)])),
      semantic: Object.fromEntries(
        Object.entries(semantic).map(([t, m]) => [t, Object.fromEntries(Object.entries(m).map(([k, v]) => [k, resolve(v)]))]),
      ),
    },
    null,
    2,
  ) + '\n',
);

// --- docs: docs/components/*.html snippets -> rendered specimens ---------------
// Marker syntax:  <!-- @group Name -->   starts a group
//                 <!-- @c Name | description | opts -->   starts a component (opts: bare, col, tall, wide)
// {{i:name}} or {{i:name|sm}} expands to a full inline icon reference
const expandIcons = (t) => t.replace(/\{\{i:([a-z-]+)(?:\|([a-z]+))?\}\}/g, (_, n, size) => `<svg class="slate-icon${size ? ` slate-icon--${size}` : ''}" aria-hidden="true"><use href="#slate-icon-${n}"/></svg>`);
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const groups = [];
for (const file of readdirSync(p('docs')).filter((f) => f.endsWith('.html')).sort()) {
  const text = readFileSync(p('docs', file), 'utf8');
  let group = null, comp = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = /^<!--\s*@group\s+(.+?)\s*(?:\|\s*(.*?))?\s*-->\s*$/.exec(line))) {
      group = { name: m[1], blurb: m[2] || '', items: [] };
      groups.push(group);
      comp = null;
    } else if ((m = /^<!--\s*@c\s+(.+?)\s*\|\s*(.*?)\s*(?:\|\s*(.*?))?\s*-->\s*$/.exec(line))) {
      comp = { name: m[1], desc: m[2], opts: (m[3] || '').split(/\s+/).filter(Boolean), html: [] };
      group.items.push(comp);
    } else if (comp) comp.html.push(line);
  }
}
// Every component documents when to use it and when not to (docs/usage.json).
const usage = JSON.parse(readFileSync(p('docs/usage.json'), 'utf8'));
const missing = groups.flatMap((g) => g.items).filter((c) => !usage[c.name]).map((c) => c.name);
if (missing.length) { console.error(`docs/usage.json is missing guidance for: ${missing.join(', ')}`); process.exit(1); }
const total = groups.reduce((n, g) => n + g.items.length, 0);

const nav = groups
  .map(
    (g) => `<div class="doc-nav__group"><div class="doc-nav__label">${g.name}</div>${g.items
      .map((c) => `<a href="#${slug(c.name)}" data-name="${c.name.toLowerCase()}">${c.name}</a>`)
      .join('')}</div>`,
  )
  .join('\n');

const content = groups
  .map(
    (g) => `<section class="doc-group" id="group-${slug(g.name)}">
  <header class="doc-group__head"><span class="doc-eyebrow">${g.items.length} components</span><h2>${g.name}</h2>${g.blurb ? `<p>${g.blurb}</p>` : ''}</header>
${g.items
  .map((c) => {
    const html = expandIcons(c.html.join('\n').replace(/^\n+|\n+$/g, ''));
    const cls = ['doc-preview', ...c.opts.map((o) => `doc-preview--${o}`)].join(' ');
    return `<article class="doc-c" id="${slug(c.name)}" data-name="${c.name.toLowerCase()}">
  <header><h3>${c.name}</h3><p>${c.desc}</p>
    <dl class="doc-usage"><div class="doc-usage__use"><dt>Use for</dt><dd>${usage[c.name][0]}</dd></div><div class="doc-usage__avoid"><dt>Avoid for</dt><dd>${usage[c.name][1]}</dd></div></dl></header>
  <div class="${cls}">
${html}
  </div>
  <details class="doc-code"><summary>View code</summary><pre><code>${esc(html.replace(/^\s{0,2}/gm, ''))}</code></pre></details>
</article>`;
  })
  .join('\n')}
</section>`,
  )
  .join('\n');

// --- public site ------------------------------------------------------------
const pub = p('public');
rmSync(pub, { recursive: true, force: true });
cpSync(p('site'), pub, { recursive: true });
rmSync(join(pub, 'template.html'));
cpSync(dist, join(pub, 'dist'), { recursive: true });
writeFileSync(
  join(pub, 'index.html'),
  readFileSync(p('site/template.html'), 'utf8')
    .replace('<!--NAV-->', nav)
    .replace('<!--CONTENT-->', content)
    .replace('{{INDEX}}', JSON.stringify(groups.flatMap((g) => g.items.map((c) => ({ n: c.name, g: g.name, d: c.desc, id: slug(c.name) })))))
    .replaceAll('{{VERSION}}', JSON.parse(readFileSync(p('package.json'), 'utf8')).version)
    .replaceAll('{{TOTAL}}', String(total))
    .replaceAll('{{ICONS}}', String(Object.keys(icons).length)),
);

console.log(`SlateOS built: ${total} components in ${groups.length} groups, ${Object.keys(icons).length} icons, ${Object.keys(primitive).length} primitive / ${Object.keys(semantic.light).length} semantic x2 / ${Object.keys(component).length} component tokens. Contrast OK.`);
