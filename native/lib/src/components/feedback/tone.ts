import { mix } from '../../color';
import type { IconName } from '../../primitives/Icon';
import type { Theme } from '../../theme';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export const toneIcon: Record<FeedbackTone, IconName> = {
  info: 'info', success: 'check-circle', warning: 'alert-triangle', danger: 'alert-circle', neutral: 'bell',
};

/** Foreground, soft background and hairline border for a status tone. */
export function feedbackColors(t: Theme, tone: FeedbackTone) {
  const { c } = t;
  if (tone === 'neutral') return { fg: c.text, icon: c.textMuted, soft: c.surface, border: c.border };
  const fg = c[tone];
  const soft = c[`${tone}Soft`];
  return { fg, icon: fg, soft, border: mix(soft, fg, t.scheme === 'dark' ? 0.28 : 0.2) };
}
