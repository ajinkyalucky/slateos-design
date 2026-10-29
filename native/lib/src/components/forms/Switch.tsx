import { useEffect } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';

export type SwitchProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  /** Shown to the left; tapping it toggles too. */
  label?: string;
  description?: string;
  disabled?: boolean;
  /** Required when there is no label. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

// iOS switch metrics: a 51x31 track and a thumb inset by 2, which stretches while held.
const W = 51;
const H = 31;
const PAD = 2;
const THUMB = H - PAD * 2;
const TRAVEL = W - THUMB - PAD * 2;
const STRETCH = 7;

/** An on/off toggle for settings that apply at once. Tap it or drag the thumb. */
export function Switch({ value, onValueChange, label, description, disabled, accessibilityLabel, style }: SwitchProps) {
  const t = useSlate();
  const p = useSharedValue(value ? 1 : 0);
  const held = useSharedValue(0);
  const dragging = useSharedValue(false);
  const from = useSharedValue(0);

  // Plain values for the worklets; never the theme object.
  const spring = t.spring.standard;
  const down = { duration: 140, dampingRatio: 1 };
  const up = t.spring.press;
  const trackOff = t.c.borderStrong;
  const trackOn = t.c.accentSolid;
  const thumbOff = t.c.onSolid;
  const thumbOn = t.c.onAccent;

  useEffect(() => {
    if (!dragging.value) p.value = withSpring(value ? 1 : 0, spring);
  }, [value, p, dragging, spring]);

  const commit = (next: boolean) => {
    if (next === value) return;
    t.haptic('light');
    onValueChange?.(next);
  };
  const toggle = () => {
    p.value = withSpring(value ? 0 : 1, spring);
    commit(!value);
  };

  const tap = useTapGesture({
    enabled: !disabled,
    hitSlop: (t.size.touch - H) / 2,
    onBegin: () => { held.value = withSpring(1, down); },
    onActivate: () => {
      p.value = withSpring(value ? 0 : 1, spring);
      scheduleOnRN(commit, !value);
    },
    onFinalize: () => { if (!dragging.value) held.value = withSpring(0, up); },
  });
  const pan = usePanGesture({
    enabled: !disabled,
    hitSlop: (t.size.touch - H) / 2,
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onBegin: () => { held.value = withSpring(1, down); },
    onActivate: () => {
      dragging.value = true;
      held.value = withSpring(1, down);
      from.value = p.value;
    },
    onUpdate: (e) => {
      p.value = Math.min(1, Math.max(0, from.value + e.translationX / TRAVEL));
    },
    onDeactivate: (e) => {
      const next = e.canceled ? value : e.velocityX > 400 ? true : e.velocityX < -400 ? false : p.value > 0.5;
      p.value = withSpring(next ? 1 : 0, spring);
      scheduleOnRN(commit, next);
    },
    onFinalize: () => {
      dragging.value = false;
      held.value = withSpring(0, up);
    },
  });
  const gesture = useCompetingGestures(pan, tap);

  const trackAnim = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [trackOff, trackOn]) }));
  const thumbAnim = useAnimatedStyle(() => {
    const extra = STRETCH * held.value;
    return {
      width: THUMB + extra,
      backgroundColor: interpolateColor(p.value, [0, 1], [thumbOff, thumbOn]),
      transform: [{ translateX: p.value * (TRAVEL - extra) }],
    };
  });

  const control = (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width: W, height: H, borderRadius: H / 2 }, trackAnim]}>
        <Animated.View
          style={[
            { position: 'absolute', top: PAD, left: PAD, height: THUMB, borderRadius: THUMB / 2, boxShadow: `${t.c.shadowSm}, ${t.c.shadowXs}` },
            thumbAnim,
          ]}
        />
      </Animated.View>
    </GestureDetector>
  );

  return (
    <View
      accessible
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => { if (!disabled && e.nativeEvent.actionName === 'activate') toggle(); }}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: t.size.touch, opacity: disabled ? t.opacity.disabled : 1 },
        !label && { alignSelf: 'flex-start' },
        style,
      ]}
    >
      {label ? (
        <Pressable onPress={toggle} disabled={disabled} style={{ flex: 1, gap: t.space['0_5'], paddingVertical: t.space[2] }}>
          <Text>{label}</Text>
          {description ? <Text variant="footnote" tone="muted">{description}</Text> : null}
        </Pressable>
      ) : null}
      {control}
    </View>
  );
}
