import { useState, type ReactNode, type Ref } from 'react';
import { Pressable, type HostInstance, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { HapticKind } from '../haptics';
import { useSlate } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type TouchableProps = Omit<PressableProps, 'style' | 'children' | 'ref'> & {
  ref?: Ref<HostInstance>;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
  /** How far the element sinks on press. 0 turns it off. Default 0.97. */
  pressScale?: number;
  /** Dim on press instead of (or as well as) scaling. Default 1 (no dim). */
  pressOpacity?: number;
  /** Extra style while the finger is down, e.g. a row highlight. */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Haptic on press. Default none. */
  haptic?: HapticKind | false;
};

/**
 * The press behaviour every SlateOS control shares: a short spring scale on touch-down,
 * an optional haptic, disabled opacity and a hit area of at least 44pt.
 */
export function Touchable({
  ref, style, pressedStyle, children, pressScale = 0.97, pressOpacity = 1, haptic, disabled, onPressIn, onPressOut, onPress, hitSlop = 6, ...rest
}: TouchableProps) {
  const t = useSlate();
  const p = useSharedValue(0);
  const [pressed, setPressed] = useState(false);
  // Worklets copy what they capture, so pass plain numbers, never the theme object.
  const rest0 = disabled ? t.opacity.disabled : 1;
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - pressScale) * p.value }],
    opacity: rest0 * (1 - (1 - pressOpacity) * p.value),
  }));
  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={(e) => {
        p.value = withSpring(1, { duration: 140, dampingRatio: 1 });
        if (pressedStyle) setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        p.value = withSpring(0, t.spring.press);
        if (pressedStyle) setPressed(false);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) t.haptic(haptic);
        onPress?.(e);
      }}
      style={[style, pressed && pressedStyle, anim]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
