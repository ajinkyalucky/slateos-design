// Shared geometry for the data components.

export type Point = [number, number];

/** A smooth monotone (Fritsch–Carlson) path through points: no overshoot above peaks or below dips. */
export function linePath(pts: Point[]) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [], m: number[] = [], tan: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = dx[i] ? (pts[i + 1][1] - pts[i][1]) / dx[i] : 0;
  }
  tan[0] = m[0];
  tan[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) tan[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${pts[i][0] + h},${pts[i][1] + h * tan[i]} ${pts[i + 1][0] - h},${pts[i + 1][1] - h * tan[i + 1]} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

/** The same path closed down to a baseline, for an area fill. */
export const areaPath = (pts: Point[], baseline: number) =>
  pts.length < 2 ? '' : `${linePath(pts)} L${pts[pts.length - 1][0]},${baseline} L${pts[0][0]},${baseline} Z`;

/** Min and max with a little headroom so lines never touch the edges. */
export function extent(values: number[], pad = 0.08): [number, number] {
  let lo = Math.min(...values), hi = Math.max(...values);
  if (!isFinite(lo)) return [0, 1];
  if (lo === hi) { lo -= 1; hi += 1; }
  const p = (hi - lo) * pad;
  return [lo - p, hi + p];
}

export const defaultFormat = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** An SVG-safe id from React's useId. */
export const svgId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');
