import { useEffect, useLayoutEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { decimals } from './shared';

export type StepperSize = 'sm' | 'md';

export type StepperProps = {
  value: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: StepperSize;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  /** Names the value for screen readers, e.g. "Guests". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const HOLD_DELAY = 350;
const FIRST_REPEAT = 160;
const FASTEST = 40;

/** A − value + control for small counts like quantity or guests. Hold a button to repeat, faster the longer you hold. */
export function Stepper({
  value, onValueChange, min = 0, max = Infinity, step = 1, size = 'md', disabled, formatValue = String, accessibilityLabel, style,
}: StepperProps) {
  const t = useSlate();
  const h = t.control[size];
  const slop = Math.max(0, (t.size.touch - h) / 2);
  const dec = decimals(step);
  const cur = useRef(value);
  cur.current = value;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const stop = () => clearTimeout(timer.current);
  useEffect(() => stop, []);

  const bump = (dir: 1 | -1, buzz: boolean) => {
    const next = Math.min(max, Math.max(min, Number((cur.current + dir * step).toFixed(dec))));
    if (next === cur.current) {
      stop();
      return false;
    }
    cur.current = next;
    // Tap = one tick; while repeating, only the stop at a limit buzzes.
    if (buzz || next === min || next === max) t.haptic('selection');
    onValueChange?.(next);
    return true;
  };
  const repeat = (dir: 1 | -1, delay: number) => {
    timer.current = setTimeout(() => {
      if (bump(dir, false)) repeat(dir, Math.max(FASTEST, delay * 0.82));
    }, delay);
  };

  // The number slides up when it grows and down when it shrinks.
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  const prev = useRef(value);
  useLayoutEffect(() => {
    if (value === prev.current) return;
    const dir = value > prev.current ? 1 : -1;
    prev.current = value;
    const from = dir * t.space[2];
    y.value = withSequence(withTiming(from, { duration: 0 }), withSpring(0, t.spring.press));
    o.value = withSequence(withTiming(0.2, { duration: 0 }), withSpring(1, t.spring.press));
  }, [value, y, o, t.space, t.spring.press]);
  const valueAnim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));

  const button = (dir: 1 | -1, icon: IconName) => {
    const off = disabled || (dir < 0 ? value <= min : value >= max);
    return (
      <Touchable
        disabled={off}
        pressScale={0.9}
        onPress={() => bump(dir, true)}
        onLongPress={() => repeat(dir, FIRST_REPEAT)}
        delayLongPress={HOLD_DELAY}
        onPressOut={stop}
        hitSlop={{ top: slop, bottom: slop }}
        style={{ width: h, height: h, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={icon} size={size === 'sm' ? 16 : 20} color={off ? t.c.textDisabled : t.c.text} strokeWidth={1.75} />
      </Touchable>
    );
  };
  const divider = <View style={{ width: 1, height: h / 2, backgroundColor: t.c.border }} />;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      accessibilityValue={{ min, max: Number.isFinite(max) ? max : undefined, now: value, text: formatValue(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (disabled) return;
        if (e.nativeEvent.actionName === 'increment') bump(1, true);
        if (e.nativeEvent.actionName === 'decrement') bump(-1, true);
      }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          height: h,
          borderRadius: t.component.inputRadius,
          borderWidth: 1,
          borderColor: t.c.border,
          backgroundColor: t.c.surfaceRaised,
          boxShadow: t.c.shadowXs,
          opacity: disabled ? t.opacity.disabled : 1,
        },
        style,
      ]}
    >
      {button(-1, 'minus')}
      {divider}
      <Animated.View style={[{ minWidth: h * 1.25, paddingHorizontal: t.space[2], alignItems: 'center' }, valueAnim]}>
        <Text variant={size === 'sm' ? 'label' : 'headline'} tabular>{formatValue(value)}</Text>
      </Animated.View>
      {divider}
      {button(1, 'plus')}
    </View>
  );
}
