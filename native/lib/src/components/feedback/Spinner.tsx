import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSlate } from '../../theme';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  size?: SpinnerSize;
  /** Any colour; defaults to the muted text colour. */
  color?: string;
  /** Spoken name. Default "Loading". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const px: Record<SpinnerSize, number> = { sm: 16, md: 20, lg: 24 };

/** A crisp rotating arc for work in progress. Use it instead of ActivityIndicator so loading matches the brand. */
export function Spinner({ size = 'md', color, accessibilityLabel = 'Loading', style }: SpinnerProps) {
  const t = useSlate();
  const d = px[size];
  const stroke = size === 'lg' ? 2.5 : 2;
  const r = (d - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const col = color ?? t.c.textMuted;
  const turn = t.motion.duration.slow * 2.5;
  const a = useSharedValue(0);
  useEffect(() => {
    a.value = withRepeat(withTiming(1, { duration: turn, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(a);
  }, [a, turn]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${a.value * 360}deg` }] }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      style={[{ width: d, height: d }, style]}
    >
      <Animated.View style={[{ width: d, height: d }, spin]}>
        <Svg width={d} height={d}>
          <Circle cx={d / 2} cy={d / 2} r={r} stroke={col} strokeOpacity={0.2} strokeWidth={stroke} fill="none" />
          <Circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            stroke={col}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.28} ${circ}`}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
