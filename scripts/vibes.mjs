// Resolves tokens/vibes.json into per-scheme colours, for web (build.mjs) and Native (build-native.mjs).
// A vibe keeps the app's exact brand colour on filled buttons when its text colour reaches 4.5:1 on it;
// otherwise the colour moves the least it must (or the text flips to the other colour). Text and links use a
// tuned version that reaches 4.5:1 on the page and its surfaces. The build fails if any pair falls short.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const vibesJson = JSON.parse(readFileSync(join(root, 'tokens/vibes.json'), 'utf8'));

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = (c) => '#' + c.map((v) => ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2)).join('');
const lum = (c) => { const a = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
export const contrast = (a, b) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mixRgb = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);
const toHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
};
const fromHsl = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
};
const WHITE = '#ffffff', BLACK = '#0a0a0a';

// The text colour for a brand: the same tuning as slate.setBrandColor (AA on the page, hover surfaces and its tint).
function brandText(h, scheme) {
  const base = rgb(h), [hh, ss, l0] = toHsl(base);
  const W = [255, 255, 255], K = [12, 12, 12];
  const ok = scheme === 'light'
    ? (c) => Math.min(contrast(hex(c), WHITE), contrast(hex(c), '#f0f0f0'), contrast(hex(c), hex(mixRgb(W, c, 0.16)))) >= 4.5
    : (c) => Math.min(contrast(hex(c), hex(K)), contrast(hex(c), '#242424'), contrast(hex(c), hex(mixRgb(K, c, 0.26))), contrast(hex(c), '#0a0a0a')) >= 4.5;
  let c = base, l = l0;
  while (!ok(c) && l > 0.02 && l < 0.98) { l += scheme === 'light' ? -0.01 : 0.01; c = fromHsl(hh, ss, l); }
  return hex(c);
}

// A filled-button colour that keeps the app's own text colour if a small lightness move is enough.
function brandSolid(h, on) {
  const [hh, ss, l0] = toHsl(rgb(h));
  const tryOn = (text) => {
    const target = text === 'white' ? WHITE : BLACK;
    for (let l = l0, i = 0; i <= 30; i++, l += text === 'white' ? -0.005 : 0.005) {
      const c = i === 0 ? h.toLowerCase() : hex(fromHsl(hh, ss, l));
      if (contrast(c, target) >= 4.5) return { solid: c, onSolid: target, moved: Math.abs(l - l0) };
    }
    return null;
  };
  // Keep the app's own text colour only if the brand colour barely moves; past that it stops looking like the app.
  const first = tryOn(on), other = tryOn(on === 'white' ? 'black' : 'white');
  return first && first.moved <= 0.06 ? first : other ?? first;
}

/** Every vibe with colours resolved per scheme ({ solid, onSolid, text } or null for a preset/default brand). */
export function resolveVibes() {
  const out = {}, problems = [];
  for (const [name, v] of Object.entries(vibesJson)) {
    if (name.startsWith('$')) continue;
    const colors = {};
    for (const scheme of ['light', 'dark']) {
      if (!/^#[0-9a-f]{6}$/i.test(v.brand)) { colors[scheme] = null; continue; }
      const s = brandSolid(v.brand, v.on ?? 'white');
      const text = brandText(v.brand, scheme);
      colors[scheme] = { solid: s.solid, onSolid: s.onSolid, text };
      const bg = scheme === 'light' ? WHITE : '#0c0c0c';
      if (contrast(s.solid, s.onSolid) < 4.5) problems.push(`${name}/${scheme}: button text ${contrast(s.solid, s.onSolid).toFixed(2)}:1`);
      if (contrast(text, bg) < 4.5) problems.push(`${name}/${scheme}: text ${contrast(text, bg).toFixed(2)}:1`);
    }
    out[name] = {
      label: v.label, like: v.like, tagline: v.tagline, style: v.style, scheme: v.scheme ?? 'system',
      brand: /^#/.test(v.brand) ? 'custom' : v.brand, source: v.brand,
      ...(v.corners && { corners: v.corners }), ...(v.density && { density: v.density }), ...(v.font && { font: v.font }),
      light: colors.light, dark: colors.dark,
    };
  }
  if (problems.length) throw new Error('Vibe contrast check failed (need 4.5:1):\n  ' + problems.join('\n  '));
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [n, v] of Object.entries(resolveVibes())) {
    console.log(n.padEnd(11), (v.like ?? '').padEnd(9), v.source.padEnd(8), JSON.stringify(v.light), JSON.stringify(v.dark));
  }
}
