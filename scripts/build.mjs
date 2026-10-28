// Builds SlateOS: tokens.json -> CSS custom properties, bundles base + components + fonts,
// checks WCAG contrast, and assembles the static docs site into public/.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);
const PREFIX = 'slate';

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
writeFileSync(join(dist, 'tokens.css'), tokensCss);
writeFileSync(join(dist, 'slateos.css'), [read('fonts.css'), tokensCss, read('base.css'), read('components.css')].join('\n'));
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

// --- public site ------------------------------------------------------------
const pub = p('public');
rmSync(pub, { recursive: true, force: true });
cpSync(p('site'), pub, { recursive: true });
cpSync(dist, join(pub, 'dist'), { recursive: true });

console.log(`SlateOS built: ${Object.keys(primitive).length} primitive, ${Object.keys(semantic.light).length} semantic x2 themes, ${Object.keys(component).length} component tokens. Contrast OK.`);
