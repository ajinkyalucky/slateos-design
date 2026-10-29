// Builds SlateOS: tokens.json -> CSS custom properties, bundles base + components + fonts,
// checks WCAG contrast, and assembles the static docs site into public/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVibes } from './vibes.mjs';

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
// A named style (dist/themes.css) sits above the token defaults; an explicit density, font or corner choice sits above the style.
const densityKeys = [...new Set(Object.values(density).flatMap((m) => Object.keys(m)))];
density.default = Object.fromEntries(densityKeys.map((k) => [k, component[k]]));
const tokensCss = `@layer ${PREFIX}.tokens, ${PREFIX}.styles, ${PREFIX}.density, ${PREFIX}.base, ${PREFIX}.components;

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

}

@layer ${PREFIX}.density {
${Object.entries(density).map(([name, map]) => `  [data-density="${name}"] {\n${decls(map, toCss)}\n  }`).join('\n\n')}
}
`;

// --- named styles (tokens/styles.json) -> [data-style] rules ------------------
// A style sets corners, size, surfaces and shadows, and borrows a font vibe's families from src/font-themes.css.
const styles = JSON.parse(readFileSync(p('tokens/styles.json'), 'utf8'));
const fontThemes = readFileSync(p('src/font-themes.css'), 'utf8');
const vibeVars = {}, vibeExtras = {};
for (const m of fontThemes.matchAll(/\[data-font='(\w+)'\]([^{]*)\{([^}]*)\}/g)) {
  if (m[2].trim()) (vibeExtras[m[1]] ??= []).push([m[2].trim(), m[3].trim()]);
  else vibeVars[m[1]] = m[3].trim().split('\n').map((l) => l.trim()).filter(Boolean);
}
const NONE = '0 0 #0000';
const CARD = {
  outline: ['var(--slate-surface-raised)', 'var(--slate-border)', 'var(--slate-shadow-xs)'],
  flat: ['var(--slate-surface-raised)', 'var(--slate-border)', NONE],
  filled: ['var(--slate-surface)', 'transparent', NONE],
  elevated: ['var(--slate-surface-raised)', 'var(--slate-border-subtle)', 'var(--slate-shadow-md)'],
};
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const styleRules = Object.entries(styles).filter(([k]) => !k.startsWith('$')).map(([name, st]) => {
  if (!CARD[st.card] || !vibeVars[st.font] || (st.density !== 'default' && !density[st.density])) throw new Error(`tokens/styles.json: bad value in "${name}"`);
  const d = [
    // Read by slateos.js so the density and font dials show what the style picked.
    `--slate-style-density: ${st.density};`, `--slate-style-font: ${st.font};`,
    ...st.radius.map((r, i) => `--slate-radius-${RADII[i]}: ${r}px;`),
    // Re-declared so a style scoped to one element re-resolves them against its own radii.
    ...Object.entries(component).filter(([, v]) => /^\{radius\./.test(v)).map(([k, v]) => `${varName(k)}: ${toCss(v)};`),
    ...(st.density === 'default' ? [] : Object.entries(density[st.density]).map(([k, v]) => `${varName(k)}: ${toCss(v)};`)),
    `--slate-card-bg: ${CARD[st.card][0]};`, `--slate-card-border-color: ${CARD[st.card][1]};`, `--slate-card-shadow: ${CARD[st.card][2]};`,
    ...(st.controls === 'pill' ? ['--slate-button-radius: var(--slate-radius-full);', '--slate-input-radius: var(--slate-radius-xl);'] : []),
    ...(st.controls === 'square' ? ['--slate-badge-radius: var(--slate-radius-sm);'] : []),
    ...(st.shadows === 'none' ? [`--slate-shadow-xs: ${NONE};`, `--slate-shadow-sm: ${NONE};`, `--slate-button-highlight: ${NONE};`] : []),
    ...(st.font === 'neutral' ? [] : vibeVars[st.font]),
  ];
  const sel = `[data-style="${name}"]`;
  return `  /* ${st.label}: ${st.tagline} */\n  ${sel} {\n${d.map((x) => `    ${x}`).join('\n')}\n  }` +
    (vibeExtras[st.font] || []).map(([rest, body]) => `\n  ${sel} ${rest} { ${body} }`).join('');
});
const stylesCss = `
/* Named styles (generated from tokens/styles.json). Set data-style on <html>, or on any element to scope it:
   ${Object.keys(styles).filter((k) => !k.startsWith('$')).join(' | ')}
   Styles other than slate and mica use a font vibe, so load dist/font-themes.css too. */
@layer ${PREFIX}.styles {
${styleRules.join('\n\n')}

  /* A scoped style re-applies the family, because font-family inherits as a resolved value. */
  [data-style]:not(html) { font-family: var(--slate-font-family-sans); }
}
`;

// --- dist -----------------------------------------------------------------
const dist = p('dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

const fonts = [
  ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter.woff2'],
  ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', 'jetbrains-mono.woff2'],
  // optional font vibes (dist/font-themes.css)
  ['@fontsource-variable/geist/files/geist-latin-wght-normal.woff2', 'geist.woff2'],
  ['@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2', 'geist-mono.woff2'],
  ['@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2', 'nunito.woff2'],
  ['@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2', 'newsreader.woff2'],
  ['@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2', 'space-grotesk.woff2'],
];
for (const [from, to] of fonts) {
  const src = p('node_modules', from);
  if (!existsSync(src)) throw new Error(`Missing font ${from}. Run npm install first.`);
  cpSync(src, join(dist, 'fonts', to));
}

const read = (f) => readFileSync(p('src', f), 'utf8');
const COMPONENT_ORDER = ['general', 'typography', 'layout', 'forms', 'data', 'feedback', 'navigation', 'overlays', 'patterns', 'utilities', 'motion', 'blocks'];
const componentsCss = COMPONENT_ORDER.map((f) => read(`components/${f}.css`)).join('\n');
const minify = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n');

writeFileSync(join(dist, 'tokens.css'), tokensCss);
const bundle = [read('fonts.css'), tokensCss, read('base.css'), componentsCss].join('\n');
writeFileSync(join(dist, 'slateos.css'), bundle);
writeFileSync(join(dist, 'slateos.min.css'), minify(bundle));
writeFileSync(join(dist, 'font-themes.css'), read('font-themes.css'));
// --- app vibes (tokens/vibes.json) -> [data-vibe] colours + the definitions slate.setVibe() applies ----
// A vibe's style, scheme and dials are attributes slate.setVibe() sets; its colours live here, per scheme.
const vibes = resolveVibes();
const vibeVarsFor = (v, scheme) => {
  const k = scheme === 'dark' ? 'white' : 'black';
  return `--slate-accent: ${v.text}; --slate-accent-hover: color-mix(in srgb, ${v.text} 85%, ${k});
    --slate-accent-solid: ${v.solid}; --slate-accent-solid-hover: color-mix(in srgb, ${v.solid} 88%, ${k}); --slate-on-accent: ${v.onSolid};
    --slate-accent-soft: color-mix(in srgb, ${v.solid} ${scheme === 'dark' ? 18 : 10}%, var(--slate-bg)); --slate-accent-soft-hover: color-mix(in srgb, ${v.solid} ${scheme === 'dark' ? 26 : 16}%, var(--slate-bg));
    --slate-accent-border: color-mix(in srgb, ${v.solid} 45%, var(--slate-bg)); --slate-focus-ring: ${v.text};`;
};
const vibesCss = `
/* App vibes (generated from tokens/vibes.json): the brand colours of a vibe. slate.setVibe('coral') also sets its
   style, scheme and dials; set data-vibe yourself for the colours alone. ${Object.keys(vibes).join(' | ')} */
` + Object.entries(vibes).filter(([, v]) => v.light).map(([name, v]) => `:root[data-vibe="${name}"] { ${vibeVarsFor(v.light, 'light')} }
@media (prefers-color-scheme: dark) { :root[data-vibe="${name}"]:not([data-theme="light"]) { ${vibeVarsFor(v.dark, 'dark')} } }
:root[data-vibe="${name}"][data-theme="dark"] { ${vibeVarsFor(v.dark, 'dark')} }`).join('\n') + '\n';
const vibeDefs = Object.fromEntries(Object.entries(vibes).map(([name, v]) => [name, Object.fromEntries(
  Object.entries({ style: v.style, scheme: v.scheme, corners: v.corners, density: v.density, font: v.font, brand: v.brand === 'custom' ? undefined : v.brand }).filter(([, x]) => x !== undefined))]));

writeFileSync(join(dist, 'themes.css'), read('themes.css') + stylesCss + vibesCss);
writeFileSync(join(dist, 'slateos.js'), read('slateos.js').replace('/*VIBES*/{}', JSON.stringify(vibeDefs)));

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

// Specimen controls without a visible label get an accessible name from the nearest label, placeholder, value or type.
const nameControls = (html) => html.replace(/<(input|select|textarea)\b([^>]*)>/g, (tag, el, attrs, off) => {
  if (/aria-label=|aria-labelledby=|\bid=/.test(attrs)) return tag;
  if (/type="(hidden|radio|submit|button)"/.test(attrs) || (/type="checkbox"/.test(attrs) && !/role="switch"/.test(attrs))) return tag;
  const before = html.slice(0, off);
  if (/role="switch"/.test(attrs)) { const t = [...before.matchAll(/slate-setting__title">([^<]+)</g)].pop(); if (t) return `<${el}${attrs} aria-label="${t[1].trim()}">`; }
  if ((before.match(/<label\b/g) || []).length > (before.match(/<\/label>/g) || []).length) return tag;
  const prev = /<label[^>]*>([^<]*)(?:<[^>]+>[^<]*)*<\/label>\s*$/.exec(before);
  const val = /value="([^"]*)"/.exec(attrs), ph = /placeholder="([^"]*)"/.exec(attrs);
  let name = (prev && prev[1].trim()) || (ph && ph[1]) || (el === 'select' ? 'Choose an option' : /type="range"/.test(attrs) ? 'Value' : /role="switch"/.test(attrs) ? 'Toggle' : val && !/type="password"/.test(attrs) ? val[1] : /type="password"/.test(attrs) ? 'Password' : 'Text field');
  return `<${el}${attrs} aria-label="${name.replace(/"/g, '&quot;')}">`;
});
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
    const html = nameControls(expandIcons(c.html.join('\n').replace(/^\n+|\n+$/g, '')));
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
// Cache-bust: version every asset URL with a content hash so a new page can never pair with old CSS/JS.
const assetHash = (f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8);
// Only real <link>/<script> tags are versioned, so code samples in the docs (&lt;link ...) stay clean.
const versioned = (html) => html.replace(/(<(?:link|script)\b[^>]*?\s)(href|src)="((?:dist\/)?(?:slateos\.css|font-themes\.css|themes\.css|slateos\.js|icons\.js|site\.css|site\.js))"/g, (_, pre, attr, path) => `${pre}${attr}="${path}?v=${assetHash(join(pub, path))}"`);
// starter templates: templates/*.html -> public/templates (icons expanded, shared theme bar inserted)
const STYLE_BUTTONS = Object.entries(styles).filter(([k]) => !k.startsWith('$')).map(([k, st]) => `<button class="slate-button slate-button--ghost slate-button--xs" data-slate-style="${k}">${st.label}</button>`).join('');
const themeBar = `<aside class="slate-themebar" aria-label="Try a theme"><span class="slate-themebar__label">Theme</span><button class="slate-themebar__dot" data-slate-brand="default" style="--c:#111" aria-label="Black"></button><button class="slate-themebar__dot" data-slate-brand="blue" style="--c:#2563eb" aria-label="Blue"></button><button class="slate-themebar__dot" data-slate-brand="violet" style="--c:#6d28d9" aria-label="Violet"></button><button class="slate-themebar__dot" data-slate-brand="green" style="--c:#15803d" aria-label="Green"></button><button class="slate-themebar__dot" data-slate-brand="orange" style="--c:#c2410c" aria-label="Orange"></button><button class="slate-themebar__dot" data-slate-brand="rose" style="--c:#be123c" aria-label="Rose"></button><span class="slate-themebar__sep"></span>${STYLE_BUTTONS}<button class="slate-button slate-button--ghost slate-button--icon slate-button--xs" data-slate-theme-toggle aria-label="Light or dark">{{i:moon|sm}}</button></aside>`;
mkdirSync(join(pub, 'templates'), { recursive: true });
for (const f of readdirSync(p('templates')).filter((x) => x.endsWith('.html'))) {
  writeFileSync(join(pub, 'templates', f), expandIcons(readFileSync(p('templates', f), 'utf8').replace('<!--THEMEBAR-->', themeBar)));
}
// Named styles: the header menu and the live preview tiles come from tokens/styles.json.
const styleList = Object.entries(styles).filter(([k]) => !k.startsWith('$'));
const vibeMenu = Object.entries(vibes).map(([k, v]) => `<button class="slate-menu__item" role="menuitemradio" aria-checked="false" data-slate-vibe="${k}"><span class="site-vibe__dot" style="--c:${v.light?.solid ?? 'var(--slate-text)'}" aria-hidden="true"></span>${v.label}<span class="slate-spacer"></span><span class="slate-text-xs slate-subtle">${v.like}-style</span></button>`).join('\n        ');
const styleMenu = styleList.map(([k, st], i) => `<button class="slate-menu__item" role="menuitemradio" aria-checked="${i === 0}" data-slate-style="${k}"><span class="site-style__mname" data-style="${k}">${st.label}</span><span class="slate-spacer"></span><span class="slate-text-xs slate-subtle">${st.tagline.split(/[.,]/)[0]}</span></button>`).join('\n        ');
const styleCards = styleList.map(([k, st], i) => `<div class="site-style" data-style="${k}">
          <div class="site-style__stage">
            <div class="slate-card"><div class="slate-card__body site-style__demo">
              <div class="slate-row"><h4 class="slate-h4">Weekly report</h4><span class="slate-spacer"></span><span class="slate-badge slate-badge--success">+12%</span></div>
              <p class="slate-text-sm slate-muted">Contributions are up on last week. Next payout on May 25.</p>
              <input class="slate-input" placeholder="Search reports" aria-label="Search reports (${st.label} preview)">
              <div class="slate-row"><button class="slate-button">View report</button><button class="slate-button slate-button--secondary">Share</button></div>
            </div></div>
          </div>
          <div class="site-style__meta"><div><div class="site-style__name">${st.label}</div><div class="slate-text-xs slate-subtle">${st.tagline}</div></div><button class="slate-button slate-button--secondary slate-button--sm" data-slate-style="${k}" aria-pressed="${i === 0}">Use ${st.label}</button></div>
        </div>`).join('\n        ');
writeFileSync(
  join(pub, 'index.html'),
  versioned(readFileSync(p('site/template.html'), 'utf8'))
    .replace('<!--NAV-->', nav)
    .replace('<!--STYLE_MENU-->', styleMenu + '\n        <div class="slate-menu__sep" role="separator"></div><div class="slate-menu__label">App vibe</div>\n        ' + vibeMenu)
    .replace('<!--STYLE_CARDS-->', styleCards)
    .replaceAll('{{STYLES}}', styleList.map(([k]) => k).join(' | '))
    .replace('<!--CONTENT-->', content)
    .replace('{{INDEX}}', JSON.stringify(groups.flatMap((g) => g.items.map((c) => ({ n: c.name, g: g.name, d: c.desc, id: slug(c.name) })))))
    .replaceAll('{{VERSION}}', JSON.parse(readFileSync(p('package.json'), 'utf8')).version)
    .replaceAll('{{TOTAL}}', String(total))
    .replaceAll('{{ICONS}}', String(Object.keys(icons).length)),
);

console.log(`SlateOS built: ${total} components in ${groups.length} groups, ${Object.keys(icons).length} icons, ${Object.keys(primitive).length} primitive / ${Object.keys(semantic.light).length} semantic x2 / ${Object.keys(component).length} component tokens. Contrast OK.`);
