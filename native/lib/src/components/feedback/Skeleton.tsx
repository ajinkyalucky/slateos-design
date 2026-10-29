import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, makeMutable, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import type { TypeVariant } from '../../tokens';
import { useSlate } from '../../theme';

// One shared pulse so every skeleton on screen breathes in step, started by the first and stopped by the last.
const pulse = makeMutable(1);
let users = 0;
function usePulse(on: boolean, duration: number) {
  useEffect(() => {
    if (!on) return;
    if (users++ === 0) pulse.value = withRepeat(withTiming(0.5, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => {
      if (--users === 0) { cancelAnimation(pulse); pulse.value = 1; }
    };
  }, [on, duration]);
}

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Corner radius. Default the theme's md radius. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

function SkeletonBlock({ width = '100%', height, radius, style }: SkeletonProps) {
  const t = useSlate();
  const still = t.reducedMotion;
  usePulse(!still, t.motion.duration.slow * 3);
  const anim = useAnimatedStyle(() => ({ opacity: still ? 1 : pulse.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height: height ?? t.space[4], borderRadius: radius ?? t.radius.md, backgroundColor: t.c.surfaceHover }, anim, style]}
    />
  );
}

export type SkeletonTextProps = {
  lines?: number;
  /** Matches the line height of this text style. Default body. */
  variant?: TypeVariant;
  /** Width of the last line. Default 60%. */
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
};

function SkeletonText({ lines = 3, variant = 'body', lastLineWidth = '60%', style }: SkeletonTextProps) {
  const t = useSlate();
  const ty = t.type[variant];
  return (
    <View style={[{ gap: ty.lineHeight - ty.fontSize }, style]}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBlock key={i} height={ty.fontSize} radius={t.radius.sm} width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'} />
      ))}
    </View>
  );
}

export type SkeletonCircleProps = { size?: number; style?: StyleProp<ViewStyle> };

function SkeletonCircle({ size, style }: SkeletonCircleProps) {
  const t = useSlate();
  const d = size ?? t.size.avatarLg;
  return <SkeletonBlock width={d} height={d} radius={d / 2} style={style} />;
}

/**
 * A placeholder block that pulses softly while content loads (still under reduced motion).
 * Compose with `Skeleton.Text` for lines and `Skeleton.Circle` for avatars.
 */
export const Skeleton = Object.assign(SkeletonBlock, { Text: SkeletonText, Circle: SkeletonCircle });
