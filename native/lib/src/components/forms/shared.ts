import type { Ref } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { alpha } from '../../color';
import type { Theme } from '../../theme';

// Internal helpers for the forms group. Not exported from the package.

/** Point several refs (callback or object) at one instance. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };
}

/** The soft focus ring: a 3pt spread of the colour at 20%. */
export const focusRing = (color: string) => `0 0 0 3px ${alpha(color, 0.2)}`;

/** Fill, border and ring of a text-entry box for its state. */
export function boxStyle(t: Theme, s: { focused?: boolean; error?: boolean; disabled?: boolean; filled?: boolean }) {
  const { c } = t;
  return {
    backgroundColor: s.disabled ? c.surface : s.filled ? c.surfaceHover : c.surfaceRaised,
    borderWidth: 1,
    borderColor: s.error ? c.danger : s.focused ? c.accent : s.filled ? 'transparent' : c.border,
    boxShadow: s.focused ? focusRing(s.error ? c.danger : c.accent) : s.filled ? undefined : c.shadowXs,
  } as const;
}

/** Decimal places in a step, so 0.1 + 0.2 lands on 0.3. */
export const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

/** A 0..1 value that sinks on touch-down and springs back on release, for indicators inside a row. */
export function usePressSink(t: Theme) {
  const p = useSharedValue(0);
  const back = t.spring.press;
  return {
    p,
    onPressIn: () => { p.value = withSpring(1, { duration: 140, dampingRatio: 1 }); },
    onPressOut: () => { p.value = withSpring(0, back); },
  };
}
