import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../../primitives/Text';
import { useSlate, type Theme } from '../../theme';

export type ProgressTone = 'accent' | 'success' | 'warning' | 'danger';

const fillColor = (t: Theme, tone: ProgressTone) =>
  tone === 'accent' ? t.c.accentSolid : t.c[`${tone}Solid`];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type ProgressProps = {
  /** 0 to max. Ignored when indeterminate. */
  value?: number;
  max?: number;
  /** Unknown duration: a segment slides along the track. */
  indeterminate?: boolean;
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A linear progress bar. The fill springs to each new value; indeterminate slides a segment while the length is unknown. */
export function Progress({ value = 0, max = 100, indeterminate, tone = 'accent', size = 'sm', accessibilityLabel, style }: ProgressProps) {
  const t = useSlate();
  const h = size === 'sm' ? t.space[1] : t.space[2];
  const w = useSharedValue(0);
  const p = useSharedValue(clamp01(value / max));
  const slide = useSharedValue(0);
  const reduced = t.reducedMotion;
  const spring = t.spring.gentle;
  const loop = t.motion.duration.slow * 4;

  useEffect(() => {
    p.value = reduced ? clamp01(value / max) : withSpring(clamp01(value / max), spring);
  }, [p, value, max, reduced, spring]);

  useEffect(() => {
    if (!indeterminate || reduced) return;
    slide.value = 0;
    slide.value = withRepeat(withTiming(1, { duration: loop, easing: Easing.inOut(Easing.cubic) }), -1, false);
    return () => cancelAnimation(slide);
  }, [indeterminate, reduced, slide, loop]);

  const fill = useAnimatedStyle(() =>
    indeterminate
      ? { opacity: reduced ? 0.5 : 1, transform: [{ translateX: reduced ? 0 : (slide.value * 1.4 - 0.4) * w.value }] }
      : { opacity: 1, transform: [{ translateX: (p.value - 1) * w.value }] },
  );

  const pct = Math.round(clamp01(value / max) * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: !!indeterminate }}
      accessibilityValue={indeterminate ? undefined : { min: 0, max: 100, now: pct, text: `${pct}%` }}
      onLayout={(e) => { w.value = e.nativeEvent.layout.width; }}
      style={[{ height: h, borderRadius: h / 2, backgroundColor: t.c.accentSoft, overflow: 'hidden' }, style]}
    >
      <Animated.View
        style={[{ height: h, width: indeterminate && !reduced ? '40%' : '100%', borderRadius: h / 2, backgroundColor: fillColor(t, tone) }, fill]}
      />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingSize = 'sm' | 'md' | 'lg';

export type ProgressRingProps = {
  value: number;
  max?: number;
  size?: ProgressRingSize;
  tone?: ProgressTone;
  /** Centre content. `true` shows the percentage. */
  label?: ReactNode | true;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A circular progress ring for compact spaces: uploads, goals, storage. Optional centre label. */
export function ProgressRing({ value, max = 100, size = 'md', tone = 'accent', label, accessibilityLabel, style }: ProgressRingProps) {
  const t = useSlate();
  const d = { sm: t.size.controlMd, md: t.size.controlXl, lg: t.space[10] }[size];
  const stroke = Math.max(3, Math.round(d / 12));
  const r = (d - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const frac = clamp01(value / max);
  const p = useSharedValue(frac);
  const reduced = t.reducedMotion;
  const spring = t.spring.gentle;
  useEffect(() => {
    p.value = reduced ? frac : withSpring(frac, spring);
  }, [p, frac, reduced, spring]);
  // Hide the round cap's dot at zero.
  const arc = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value), strokeOpacity: p.value > 0.002 ? 1 : 0 }));
  const pct = Math.round(frac * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: pct, text: `${pct}%` }}
      style={[{ width: d, height: d, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Svg width={d} height={d} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={d / 2} cy={d / 2} r={r} stroke={t.c.accentSoft} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={d / 2}
          cy={d / 2}
          r={r}
          stroke={fillColor(t, tone)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={arc}
          fill="none"
        />
      </Svg>
      {label === true ? (
        <Text variant={size === 'lg' ? 'label' : 'caption'} weight="600" tabular>{pct}%</Text>
      ) : typeof label === 'string' ? (
        <Text variant="caption" weight="600">{label}</Text>
      ) : (
        label
      )}
    </View>
  );
}
