import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { usePressSink } from './shared';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type CheckboxProps = {
  /** `'indeterminate'` shows a dash, for a parent whose children are partly checked. */
  checked: boolean | 'indeterminate';
  /** Called with the next state; an indeterminate box becomes checked. */
  onValueChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: boolean;
  /** Required when there is no label. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// The box is 22pt (on a 24-unit grid for the strokes); path lengths are for the dash animation.
const BOX = 22;
const CHECK = 'M6.5 12.5l3.5 3.5 7.5-8';
const CHECK_LEN = 16;
const DASH = 'M7 12h10';
const DASH_LEN = 10;

/** A box for on/off choices in a list or form. The check draws in; the whole row is the touch target. */
export function Checkbox({ checked, onValueChange, label, description, disabled, error, accessibilityLabel, style }: CheckboxProps) {
  const t = useSlate();
  const on = checked !== false;
  const fill = useSharedValue(on ? 1 : 0);
  const tick = useSharedValue(checked === true ? 1 : 0);
  const dash = useSharedValue(checked === 'indeterminate' ? 1 : 0);
  const sink = usePressSink(t);

  useEffect(() => {
    const draw = { duration: t.motion.duration.slow, dampingRatio: 1 };
    fill.value = withSpring(on ? 1 : 0, t.spring.press);
    tick.value = withSpring(checked === true ? 1 : 0, draw);
    dash.value = withSpring(checked === 'indeterminate' ? 1 : 0, draw);
  }, [checked, on, fill, tick, dash, t.spring.press, t.motion.duration.slow]);

  const sinkP = sink.p;
  const boxAnim = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.1 * sinkP.value }] }));
  const fillAnim = useAnimatedStyle(() => ({ opacity: fill.value, transform: [{ scale: 0.6 + 0.4 * fill.value }] }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - tick.value) }));
  const dashProps = useAnimatedProps(() => ({ strokeDashoffset: DASH_LEN * (1 - dash.value) }));
  const lineH = t.type.body.lineHeight;

  return (
    <Touchable
      disabled={disabled}
      pressScale={1}
      haptic="selection"
      onPressIn={sink.onPressIn}
      onPressOut={sink.onPressOut}
      onPress={() => onValueChange?.(checked !== true)}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={description}
      accessibilityState={{ checked: checked === 'indeterminate' ? 'mixed' : checked, disabled: !!disabled }}
      hitSlop={0}
      style={[
        label
          ? { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3], minHeight: t.size.touch, paddingVertical: (t.size.touch - lineH) / 2 }
          : { width: t.size.touch, height: t.size.touch, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <View style={{ height: lineH, justifyContent: 'center' }}>
        <Animated.View style={[{ width: BOX, height: BOX }, boxAnim]}>
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: t.radius.md, borderWidth: 1, borderColor: error ? t.c.danger : t.c.borderStrong, backgroundColor: t.c.surfaceRaised },
            ]}
          />
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: t.radius.md, backgroundColor: t.c.accentSolid }, fillAnim]} />
          <Svg width={BOX} height={BOX} viewBox="0 0 24 24" fill="none" stroke={t.c.onAccent} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
            <AnimatedPath d={CHECK} strokeDasharray={CHECK_LEN} animatedProps={tickProps} />
            <AnimatedPath d={DASH} strokeDasharray={DASH_LEN} animatedProps={dashProps} />
          </Svg>
        </Animated.View>
      </View>
      {label ? (
        <View style={{ flex: 1, gap: t.space['0_5'] }}>
          <Text>{label}</Text>
          {description ? <Text variant="footnote" tone="muted">{description}</Text> : null}
        </View>
      ) : null}
    </Touchable>
  );
}
