import { alpha, contrast } from '../../color';
import type { Theme } from '../../theme';
import * as tk from '../../tokens';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/** Soft, solid and outline colours for a status tone. */
export function toneColors(t: Theme, tone: Tone) {
  const { c } = t;
  switch (tone) {
    case 'neutral': return { soft: c.surfaceHover, fg: c.textMuted, solid: c.inverse, onSolid: c.onInverse, border: c.border };
    case 'accent': return { soft: c.accentSoft, fg: c.accent, solid: c.accentSolid, onSolid: c.onAccent, border: c.accentBorder };
    default: {
      const solid = c[`${tone}Solid`];
      return { soft: c[`${tone}Soft`], fg: c[tone], solid, onSolid: readableOn(solid), border: alpha(c[tone], 0.4) };
    }
  }
}

/** The near-black or near-white text token with more contrast on a colour (hex). */
export function readableOn(bg: string) {
  const dark = tk.colors.light.text, light = tk.colors.dark.text;
  return contrast(bg, light) >= Math.min(4.5, contrast(bg, dark)) ? light : dark;
}

/** The chart colour at an index, wrapping after six. */
export const chartColor = (t: Theme, i: number) => t.c[`chart${(((i % 6) + 6) % 6) + 1}` as 'chart1'];
