import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSlate } from '../theme';

/** A 0..1 shared value that springs to `on`, or eases quickly when Reduce Motion is on. */
export function useToggleProgress(on: boolean, spring?: { duration: number; dampingRatio: number }) {
  const t = useSlate();
  const p = useSharedValue(on ? 1 : 0);
  const cfg = spring ?? t.spring.standard;
  const reduced = t.reducedMotion;
  const fast = t.motion.duration.fast;
  useEffect(() => {
    p.value = reduced ? withTiming(on ? 1 : 0, { duration: fast }) : withSpring(on ? 1 : 0, cfg);
  }, [on, reduced, fast, cfg, p]);
  return p;
}

export type CrossfadeProps = {
  /** 0 shows `off`, 1 shows `on`. */
  progress: SharedValue<number>;
  /** Selected look, e.g. a semibold accent label. It sets the size, so make it the wider of the two. */
  on: ReactNode;
  /** Resting look, laid over the same box. */
  off: ReactNode;
  /** Index this item sits at when `progress` is a position (a sliding pill), not 0..1. */
  index?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Blends two renderings of the same content (colour, weight, stroke) so a selection change reads as one
 * continuous move instead of a snap. Both stay mounted; the selected one holds the layout, so nothing reflows.
 */
export function Crossfade({ progress, on, off, index, style }: CrossfadeProps) {
  const at = index;
  const onAnim = useAnimatedStyle(() => {
    const v = at === undefined ? progress.value : 1 - Math.min(1, Math.abs(progress.value - at));
    return { opacity: interpolate(v, [0, 1], [0, 1], Extrapolation.CLAMP) };
  });
  const offAnim = useAnimatedStyle(() => {
    const v = at === undefined ? progress.value : 1 - Math.min(1, Math.abs(progress.value - at));
    return { opacity: interpolate(v, [0, 1], [1, 0], Extrapolation.CLAMP) };
  });
  return (
    <View style={style}>
      <Animated.View style={onAnim}>{on}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, offAnim]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {off}
      </Animated.View>
    </View>
  );
}
