import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, type SharedValue,
} from 'react-native-reanimated';
import { useSlate } from '../../theme';

export type PageDotsProps = {
  count: number;
  /** The current page. */
  index: number;
  /** Continuous page position (e.g. scrollX / pageWidth). When given, the dots follow the finger. */
  progress?: SharedValue<number>;
  /** Lets VoiceOver users swipe up and down to change page. */
  onIndexChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
};

/** A carousel page indicator: the current dot stretches into a pill. */
export function PageDots({ count, index, progress, onIndexChange, style }: PageDotsProps) {
  const t = useSlate();
  const own = useSharedValue(index);
  const reduced = t.reducedMotion;
  const spring = t.spring.standard;
  useEffect(() => {
    own.value = reduced ? index : withSpring(index, spring);
  }, [index, reduced, spring, own]);
  const pos = progress ?? own;
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Page ${index + 1} of ${count}`}
      accessibilityActions={onIndexChange ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
      onAccessibilityAction={(e) => {
        const next = index + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
        if (next >= 0 && next < count) onIndexChange?.(next);
      }}
      style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.space['1_5'] }, style]}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} i={i} pos={pos} dot={t.space[2]} pill={t.space[5]} on={t.c.text} off={t.c.borderStrong} />
      ))}
    </View>
  );
}

function Dot({ i, pos, dot, pill, on, off }: { i: number; pos: SharedValue<number>; dot: number; pill: number; on: string; off: string }) {
  const s = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs(pos.value - i));
    return {
      width: interpolate(d, [0, 1], [pill, dot], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(d, [0, 1], [on, off]),
    };
  });
  return <Animated.View style={[{ height: dot, borderRadius: dot / 2 }, s]} />;
}
