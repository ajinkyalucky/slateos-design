import { useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { decimals } from './shared';

export type SliderProps = {
  value: number;
  onValueChange?: (value: number) => void;
  /** Called once when the finger lifts. */
  onSlidingComplete?: (value: number) => void;
  min?: number;
  max?: number;
  /** Snap to multiples of this. With fewer than 25 steps, each step ticks a haptic. */
  step?: number;
  disabled?: boolean;
  /** Shown above the track, on the left. */
  label?: string;
  /** Show the current value above the track, on the right. */
  showValue?: boolean;
  formatValue?: (value: number) => string;
  /** Required when there is no label. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Pick a number from a range by dragging or tapping the track. */
export function Slider({
  value, onValueChange, onSlidingComplete, min = 0, max = 100, step, disabled, label, showValue, formatValue = String,
  accessibilityLabel, style,
}: SliderProps) {
  const t = useSlate();
  const range = max - min;
  const frac = (v: number) => (range > 0 ? (Math.min(max, Math.max(min, v)) - min) / range : 0);
  const pos = useSharedValue(frac(value));
  const width = useSharedValue(0);
  const grab = useSharedValue(0);
  const dragging = useSharedValue(false);
  const last = useSharedValue(value);
  const latest = useRef(value);

  // Plain values for the worklets.
  const R = t.size.controlSm / 2;
  const snap = { duration: 180, dampingRatio: 1 };
  const spring = t.spring.standard;
  const down = { duration: 140, dampingRatio: 1 };
  const up = t.spring.press;
  const dec = step ? decimals(step) : 0;
  const ticks = !!step && step > 0 && range / step < 25;

  useEffect(() => {
    last.value = value;
    if (!dragging.value) pos.value = withSpring(frac(value), spring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max]);

  const emit = (v: number, tick: boolean) => {
    latest.current = v;
    if (tick) t.haptic('selection');
    onValueChange?.(v);
  };
  const done = () => onSlidingComplete?.(latest.current);

  const moveTo = (x: number, animate: boolean) => {
    'worklet';
    const usable = Math.max(1, width.value - 2 * R);
    let f = Math.min(1, Math.max(0, (x - R) / usable));
    let v = min + f * range;
    if (step) {
      v = Math.min(max, Number((Math.round((v - min) / step) * step + min).toFixed(dec)));
      f = range > 0 ? (v - min) / range : 0;
    }
    pos.value = animate ? withSpring(f, snap) : f;
    if (v !== last.value) {
      last.value = v;
      scheduleOnRN(emit, v, ticks);
    }
  };

  const pan = usePanGesture({
    enabled: !disabled,
    activeOffsetX: [-2, 2],
    failOffsetY: [-10, 10],
    onBegin: () => { grab.value = withSpring(1, down); },
    onActivate: (e) => {
      dragging.value = true;
      moveTo(e.x, true);
    },
    onUpdate: (e) => moveTo(e.x, !!step),
    onDeactivate: () => scheduleOnRN(done),
    onFinalize: () => {
      dragging.value = false;
      grab.value = withSpring(0, up);
    },
  });
  const tap = useTapGesture({
    enabled: !disabled,
    onBegin: () => { grab.value = withSpring(1, down); },
    onActivate: (e) => {
      moveTo(e.x, true);
      scheduleOnRN(done);
    },
    onFinalize: () => { if (!dragging.value) grab.value = withSpring(0, up); },
  });
  const gesture = useCompetingGestures(pan, tap);

  const fillAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: R + pos.value * (width.value - 2 * R) - width.value }],
  }));
  const thumbAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * (width.value - 2 * R) }, { scale: 1 + 0.08 * grab.value }],
  }));

  const nudge = (dir: 1 | -1) => {
    const d = step ?? range / 10;
    const next = Math.min(max, Math.max(min, Number((value + dir * d).toFixed(step ? dec : 4))));
    if (next === value) return;
    onValueChange?.(next);
    onSlidingComplete?.(next);
  };

  return (
    <View style={[{ gap: t.space[1], opacity: disabled ? t.opacity.disabled : 1 }, style]}>
      {(label || showValue) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.space[3] }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text variant="label">{label}</Text>
          {showValue && <Text variant="label" tone="muted" tabular>{formatValue(value)}</Text>}
        </View>
      )}
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e) => { width.value = e.nativeEvent.layout.width; }}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: !!disabled }}
          accessibilityValue={{ min, max, now: value, text: formatValue(value) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            if (disabled) return;
            if (e.nativeEvent.actionName === 'increment') nudge(1);
            if (e.nativeEvent.actionName === 'decrement') nudge(-1);
          }}
          style={{ height: t.size.touch, justifyContent: 'center' }}
        >
          <View style={{ height: t.space[1], borderRadius: t.space['0_5'], backgroundColor: t.c.surfaceActive, overflow: 'hidden' }}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.c.accentSolid }, fillAnim]} />
          </View>
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                width: 2 * R,
                height: 2 * R,
                borderRadius: R,
                backgroundColor: t.c.onSolid,
                borderWidth: 1,
                borderColor: t.c.border,
                boxShadow: t.c.shadowMd,
              },
              thumbAnim,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
