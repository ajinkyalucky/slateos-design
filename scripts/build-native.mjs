// Builds the SlateOS Native tokens: tokens.json + mobile.json + the brand presets in themes.css
// -> native/lib/src/tokens.ts (resolved values in points), and the icon set -> native/lib/src/icons.ts.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveVibes } from './vibes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(root, ...s);
const tokens = JSON.parse(readFileSync(p('tokens/tokens.json'), 'utf8'));
const mobile = JSON.parse(readFileSync(p('tokens/mobile.json'), 'utf8'));
const themesCss = readFileSync(p('src/themes.css'), 'utf8');
const icons = JSON.parse(readFileSync(p('src/icons.json'), 'utf8'));
const styleDefs = JSON.parse(readFileSync(p('tokens/styles.json'), 'utf8'));

function flatten(obj, path = [], out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) out[[...path, k].join('.')] = v.$value;
    else if (v && typeof v === 'object') flatten(v, [...path, k], out);
  }
  return out;
}
const primitive = flatten(tokens.primitive);
const REF = /^\{(.+)\}$/;
const resolve = (v) => {
  const m = typeof v === 'string' && REF.exec(v);
  if (!m) return v;
  if (!(m[1] in primitive)) throw new Error(`Unknown token reference ${v}`);
  return resolve(primitive[m[1]]);
};
// rem and px become points (1rem = 16pt); em stays a ratio for letter spacing.
const pt = (v) => {
  v = resolve(v);
  if (typeof v === 'number') return v;
  if (v.endsWith('rem')) return parseFloat(v) * 16;
  if (v.endsWith('px')) return parseFloat(v);
  if (v.endsWith('ms')) return parseFloat(v);
  return parseFloat(v);
};
const camel = (s) => s.replace(/[-.](\w)/g, (_, c) => c.toUpperCase());
const group = (prefix, map = primitive) =>
  Object.fromEntries(Object.entries(map).filter(([k]) => k.startsWith(prefix + '.')).map(([k, v]) => [k.slice(prefix.length + 1), v]));

const palette = {};
for (const [k, v] of Object.entries(group('color'))) {
  const [hue, step] = k.split('.');
  (palette[hue] ??= {})[step] = v;
}
const ptMap = (prefix) => Object.fromEntries(Object.entries(group(prefix)).map(([k, v]) => [k, pt(v)]));
const space = ptMap('space');
const radius = ptMap('radius');
const size = Object.fromEntries(Object.entries(ptMap('size')).map(([k, v]) => [camel(k), v]));

// Semantic colours per theme. Web-only values (color-mix halos) are left out.
const colors = {};
for (const theme of ['light', 'dark']) {
  colors[theme] = {};
  for (const [k, v] of Object.entries(flatten(tokens.semantic[theme]))) {
    const val = resolve(v);
    if (val.includes('color-mix') || val.includes('var(')) continue;
    colors[theme][camel(k)] = val;
  }
}

// Brand presets and corner sets come from themes.css so web and native never drift.
const brands = {};
for (const m of themesCss.matchAll(/:root\[data-brand="(\w+)"\](\[data-theme="dark"\])?\s*\{([^}]*)\}/g)) {
  const [, name, dark, body] = m;
  if (name === 'custom') continue;
  const accent = /--slate-accent:\s*(#[0-9a-f]{6})/i.exec(body)?.[1];
  const onAccent = /--slate-on-accent:\s*(#[0-9a-f]{6})/i.exec(body)?.[1];
  if (!accent) continue;
  (brands[name] ??= {})[dark ? 'dark' : 'light'] = { accent, onAccent };
}
const corners = {};
for (const m of themesCss.matchAll(/:root\[data-corners="(\w+)"\]\s*\{([^}]*)\}/g)) {
  corners[m[1]] = Object.fromEntries([...m[2].matchAll(/--slate-radius-(\w+):\s*([\d.]+)px/g)].map(([, k, v]) => [k, +v]));
}

// Named styles share tokens/styles.json with the web, font vibe included.
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const NATIVE_CARD = { outline: 'outline', flat: 'outline', filled: 'filled', elevated: 'elevated' };
const styles = Object.fromEntries(Object.entries(styleDefs).filter(([k]) => !k.startsWith('$')).map(([name, st]) => [name, {
  label: st.label, tagline: st.tagline,
  radius: Object.fromEntries(st.radius.map((r, i) => [RADII[i], r])),
  density: st.density, card: NATIVE_CARD[st.card], controls: st.controls, shadows: st.shadows, font: st.font,
}]));

// Font vibes: the same families as the web (src/font-themes.css), as Expo Google Fonts face prefixes.
// A face is `${prefix}_${400Regular|500Medium|600SemiBold|700Bold}`, e.g. PlayfairDisplay_600SemiBold.
const fontMeta = JSON.parse(readFileSync(p('tokens/fonts.json'), 'utf8'));
const fontCss = readFileSync(p('src/font-themes.css'), 'utf8');
const prefix = (family) => family.replace(/\s+/g, '');
const fonts = {};
for (const m of fontCss.matchAll(/\[data-font='(\w+)'\]\s*\{([^}]*)\}/g)) {
  const [, name, body] = m;
  const fam = (v) => new RegExp(`--slate-font-family-${v}:\\s*'([^']+)'`).exec(body)?.[1];
  const sans = fam('sans'), mono = fam('mono');
  const display = fam('display') ?? sans; // var(--slate-font-family-sans) means "same as the body"
  const weight = /--slate-font-weight-display:\s*var\(--slate-font-weight-(\w+)\)/.exec(body)?.[1] ?? 'semibold';
  if (!fontMeta[name] || !sans || !mono) throw new Error(`font vibe "${name}": missing in tokens/fonts.json or without sans/mono families`);
  const families = [...new Set([sans, display, mono])];
  fonts[name] = {
    label: fontMeta[name].label, group: fontMeta[name].group,
    sans: prefix(sans), display: prefix(display), mono: prefix(mono),
    displayWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' }[weight],
    packages: families.map((f) => `@expo-google-fonts/${f.toLowerCase().replace(/\s+/g, '-')}`),
  };
}

// App vibes (tokens/vibes.json): a style plus an app's brand colour, scheme and dials.
const vibes = Object.fromEntries(Object.entries(resolveVibes()).map(([name, { source: _source, ...v }]) => [name, v]));

const type = Object.fromEntries(Object.entries(mobile.type).map(([name, t]) => {
  const fontSize = pt(t.size);
  const leading = typeof t.leading === 'number' ? t.leading : parseFloat(resolve(t.leading));
  const tracking = typeof t.tracking === 'number' ? t.tracking : parseFloat(resolve(t.tracking));
  return [name, {
    fontSize,
    lineHeight: Math.round(fontSize * leading),
    letterSpacing: +(fontSize * tracking).toFixed(2),
    fontWeight: String(resolve(t.weight)),
  }];
}));

const resolvePt = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [camel(k), pt(v)]));
const motion = {
  duration: Object.fromEntries(Object.entries(group('motion')).filter(([k]) => k.startsWith('duration') || k.startsWith('delay')).map(([k, v]) => [camel(k.replace(/^duration-/, '')), pt(v)])),
  easing: Object.fromEntries(Object.entries(group('motion')).filter(([k]) => k.startsWith('easing')).map(([k, v]) => [camel(k.replace(/^easing-/, '')), v.match(/[-\d.]+/g).map(Number)])),
};

const out = {
  palette, space, radius, corners, size,
  font: {
    size: Object.fromEntries(Object.entries(group('font')).filter(([k]) => k.startsWith('size-')).map(([k, v]) => [k.slice(5), pt(v)])),
    weight: Object.fromEntries(Object.entries(group('font')).filter(([k]) => k.startsWith('weight-') && !k.endsWith('display')).map(([k, v]) => [k.slice(7), String(v)])),
  },
  type,
  control: resolvePt(mobile.control),
  component: resolvePt(mobile.component),
  density: Object.fromEntries(Object.entries(mobile.density).map(([k, v]) => [k, resolvePt(v)])),
  motion,
  opacity: { disabled: +resolve(primitive['opacity.disabled']) },
  colors,
  brands,
  styles,
  vibes,
  fonts,
};

const header = '// Generated by scripts/build-native.mjs from tokens/tokens.json, tokens/mobile.json, tokens/styles.json, tokens/vibes.json and src/themes.css.\n// Do not edit: change the tokens and run `npm run tokens` in native/.\n\n';
const body = Object.entries(out).map(([k, v]) => `export const ${k} = ${JSON.stringify(v, null, 2)} as const;`).join('\n\n');
writeFileSync(p('native/lib/src/tokens.ts'), header + body + `\n\nexport type ColorToken = keyof typeof colors.light;\nexport type TypeVariant = keyof typeof type;\nexport type BrandName = keyof typeof brands;\nexport type CornerName = keyof typeof corners;\nexport type StyleName = keyof typeof styles;\nexport type VibeName = keyof typeof vibes;\nexport type FontName = keyof typeof fonts;\n`);

// Icons are parsed once here into [element, attributes] pairs so the app never parses SVG at runtime.
const parseIcon = (svg) => [...svg.matchAll(/<(path|circle|rect|ellipse)\s([^>]*?)\/?>/g)].map(([, tag, attrs]) =>
  [tag, Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, k === 'd' ? v : +v]))]);
const iconBody = Object.entries(icons).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(parseIcon(v))},`).join('\n');
writeFileSync(p('native/lib/src/icons.ts'), `// Generated by scripts/build-native.mjs from src/icons.json (24x24 grid, drawn with a 1.5 stroke). Do not edit.\n\ntype Shape = readonly ['path' | 'circle' | 'rect' | 'ellipse', Readonly<Record<string, string | number>>];\n\nexport const iconShapes = {\n${iconBody}\n} as const satisfies Record<string, readonly Shape[]>;\n\nexport type IconName = keyof typeof iconShapes;\n`);

console.log(`SlateOS Native tokens: ${Object.keys(colors.light).length} colours x2, ${Object.keys(brands).length} brands, ${Object.keys(styles).length} styles, ${Object.keys(vibes).length} app vibes, ${Object.keys(fonts).length} font vibes, ${Object.keys(type).length} type styles, ${Object.keys(icons).length} icons.`);
