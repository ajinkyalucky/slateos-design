// Small colour helpers. Brand tuning is the same algorithm as slate.setBrandColor on the web.

type Rgb = [number, number, number];

export function parseHex(input: string): string | null {
  let h = String(input || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, '$&$&');
  return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toLowerCase() : null;
}

const toRgb = (h: string): Rgb => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: readonly number[]) => '#' + c.map((v) => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
const relLum = (c: Rgb) => {
  const a = c.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};
const ratioRgb = (a: Rgb, b: Rgb) => {
  const x = relLum(a), y = relLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => a.map((v, i) => v * (1 - t) + b[i] * t) as Rgb;

function toHsl([r, g, b]: Rgb): Rgb {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function fromHsl(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255].map(Math.round) as Rgb;
}

/** Mix two hex colours: t = 0 gives a, t = 1 gives b. */
export const mix = (a: string, b: string, t: number) => toHex(mixRgb(toRgb(a), toRgb(b), t));

/** A hex colour at an opacity, as rgba(). */
export function alpha(hex: string, a: number) {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** WCAG contrast ratio between two hex colours. */
export const contrast = (a: string, b: string) => ratioRgb(toRgb(a), toRgb(b));

/** Tune any colour for each theme so text in it keeps 4.5:1 on every surface it meets. */
export function brandFromHex(hex: string): { light: string; dark: string } {
  const base = toRgb(hex), hsl = toHsl(base), W: Rgb = [255, 255, 255], K: Rgb = [12, 12, 12];
  let light = base, dark = base, l1 = hsl[2], l2 = hsl[2];
  const lightOk = (c: Rgb) => Math.min(ratioRgb(c, W), ratioRgb(c, [240, 240, 240]), ratioRgb(c, mixRgb(W, c, 0.16))) >= 4.5;
  const darkOk = (c: Rgb) => Math.min(ratioRgb(c, K), ratioRgb(c, [36, 36, 36]), ratioRgb(c, mixRgb(K, c, 0.26)), ratioRgb(c, [10, 10, 10])) >= 4.5;
  while (!lightOk(light) && l1 > 0.02) { l1 -= 0.01; light = fromHsl(hsl[0], hsl[1], l1); }
  while (!darkOk(dark) && l2 < 0.98) { l2 += 0.01; dark = fromHsl(hsl[0], hsl[1], l2); }
  return { light: toHex(light), dark: toHex(dark) };
}
