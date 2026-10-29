import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Crossfade } from '../../primitives/Crossfade';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

export type SegmentOption<T extends string = string> = {
  value: T;
  label?: string;
  icon?: IconName;
  /** Required for icon-only segments. */
  accessibilityLabel?: string;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = {
  /** 2 to 5 segments: plain strings, or objects with a label and/or icon. */
  options: readonly (T | SegmentOption<T>)[];
  value: T;
  onValueChange?: (value: T) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Switch between 2–5 views or modes of the same content. The selected pill slides between segments,
 * and can be dragged: it follows the finger segment by segment and picks where you let go.
 */
export function SegmentedControl<T extends string = string>({
  options, value, onValueChange, size = 'md', disabled, style,
}: SegmentedControlProps<T>) {
  const t = useSlate();
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o) as SegmentOption<T>);
  const n = items.length;
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  const h = t.control[size];
  const pad = t.space['0_5'];
  const [seg, setSeg] = useState<{ x: number; width: number }[]>([]);
  const ready = seg.length === n && seg.every(Boolean);
  const xs = useSharedValue<number[]>([]);
  const ws = useSharedValue<number[]>([]);
  // The pill's position in segments (1.5 = halfway between the second and third), shared with the labels.
  const pos = useSharedValue(index);
  const held = useSharedValue(0);
  const over = useSharedValue(index);
  const dragged = useRef(false);
  const spring = t.spring.standard;
  const reduced = t.reducedMotion;
  const fast = t.motion.duration.fast;
  const down = { duration: 140, dampingRatio: 1 };
  const up = t.spring.press;
  const off = items.map((i) => !!(disabled || i.disabled));

  useEffect(() => {
    if (!ready) return;
    xs.value = seg.map((s) => s.x);
    ws.value = seg.map((s) => s.width);
  }, [seg, ready, xs, ws]);
  useEffect(() => {
    pos.value = reduced ? withTiming(index, { duration: fast }) : withSpring(index, spring);
    over.value = index;
  }, [index, reduced, fast, spring, pos, over]);

  const tick = () => t.haptic('selection');
  const pick = (i: number) => {
    const it = items[i];
    if (it && !off[i] && it.value !== value) onValueChange?.(it.value);
    else pos.value = withSpring(index, spring);
  };
  const setDragged = (v: boolean) => {
    if (v) dragged.current = true;
    // Let the segment's own press (fired on the same touch end) see the drag first.
    else setTimeout(() => { dragged.current = false; }, 80);
  };

  const pan = usePanGesture({
    enabled: !disabled && ready,
    activeOffsetX: [-6, 6],
    failOffsetY: [-16, 16],
    onBegin: (e) => {
      // Holding the selected segment sinks the pill a touch, like picking it up.
      const X = xs.value, W = ws.value;
      const i = Math.round(pos.value);
      if (X[i] !== undefined && e.x >= X[i] && e.x <= X[i] + W[i]) held.value = withSpring(1, down);
    },
    onActivate: () => {
      held.value = withSpring(1, down);
      scheduleOnRN(setDragged, true);
    },
    onUpdate: (e) => {
      const X = xs.value, W = ws.value;
      let i = 0;
      while (i < n - 1 && e.x > X[i] + W[i]) i++;
      if (i === over.value || off[i]) return;
      over.value = i;
      pos.value = withSpring(i, spring);
      scheduleOnRN(tick);
    },
    onDeactivate: (e) => {
      if (e.canceled) { pos.value = withSpring(Math.round(pos.value), spring); return; }
      scheduleOnRN(pick, over.value);
    },
    onFinalize: () => {
      held.value = withSpring(0, up);
      scheduleOnRN(setDragged, false);
    },
  });

  // Width follows too, so unequal segments (icons beside labels) still fit the pill.
  const pillAnim = useAnimatedStyle(() => {
    const X = xs.value, W = ws.value;
    if (X.length < n) return { opacity: 0, width: 0, transform: [{ translateX: 0 }, { scale: 1 }] };
    const p = Math.min(Math.max(pos.value, 0), n - 1);
    const a = Math.floor(p), b = Math.min(a + 1, n - 1), f = p - a;
    return {
      opacity: 1,
      width: W[a] + (W[b] - W[a]) * f,
      transform: [{ translateX: X[a] + (X[b] - X[a]) * f }, { scale: 1 - 0.04 * held.value }],
    };
  });
  const pillBg = t.scheme === 'dark' ? t.c.surfaceActive : t.c.surfaceRaised;
  const slop = Math.max(0, (t.size.touch - h) / 2);

  const label = (it: SegmentOption<T>, on: boolean) => {
    const fg = on ? t.c.text : t.c.textMuted;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space['1_5'] }}>
        {it.icon && <Icon name={it.icon} size={size === 'sm' ? 16 : 20} color={fg} strokeWidth={on ? 2 : 1.75} />}
        {it.label ? (
          <Text variant={size === 'sm' ? 'footnote' : 'label'} weight={on ? '600' : '500'} numberOfLines={1} style={{ color: fg }}>
            {it.label}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityRole="tablist"
        style={[
          {
            flexDirection: 'row',
            height: h,
            padding: pad,
            borderRadius: t.component.inputRadius,
            backgroundColor: t.c.surfaceHover,
            opacity: disabled ? t.opacity.disabled : 1,
          },
          style,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', top: pad, bottom: pad, left: 0, borderRadius: t.component.inputRadius - pad, backgroundColor: pillBg, boxShadow: t.c.shadowSm },
            pillAnim,
          ]}
        />
        {items.map((it, i) => {
          const on = i === index;
          return (
            <Touchable
              key={it.value}
              disabled={off[i]}
              pressScale={on ? 1 : 0.96}
              haptic={on ? false : 'selection'}
              hitSlop={{ top: slop, bottom: slop }}
              onPress={() => !on && !dragged.current && onValueChange?.(it.value)}
              onLayout={(e) => {
                const { x: lx, width } = e.nativeEvent.layout;
                setSeg((s) => {
                  if (s[i]?.x === lx && s[i]?.width === width) return s;
                  const next = s.slice();
                  next[i] = { x: lx, width };
                  return next;
                });
              }}
              accessibilityRole="tab"
              accessibilityLabel={it.accessibilityLabel ?? it.label}
              accessibilityState={{ selected: on, disabled: off[i] }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space[2] }}
            >
              <Crossfade progress={pos} index={i} on={label(it, true)} off={label(it, false)} />
            </Touchable>
          );
        })}
      </View>
    </GestureDetector>
  );
}
