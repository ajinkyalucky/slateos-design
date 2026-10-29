import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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

/** Switch between 2–5 views or modes of the same content. The selected pill slides between segments. */
export function SegmentedControl<T extends string = string>({
  options, value, onValueChange, size = 'md', disabled, style,
}: SegmentedControlProps<T>) {
  const t = useSlate();
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o) as SegmentOption<T>);
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  const h = t.control[size];
  const pad = t.space['0_5'];
  const [seg, setSeg] = useState<{ x: number; width: number }[]>([]);
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const shown = useSharedValue(0);
  const target = seg[index];

  useEffect(() => {
    if (!target) return;
    // The first measure places the pill; after that it springs.
    const animate = shown.value === 1;
    x.value = animate ? withSpring(target.x, t.spring.standard) : target.x;
    w.value = target.width;
    shown.value = 1;
  }, [target?.x, target?.width, x, w, shown, t.spring.standard]);

  // Segments share the width equally, so only the pill's position animates; its width follows layout.
  const pillAnim = useAnimatedStyle(() => ({ opacity: shown.value, width: w.value, transform: [{ translateX: x.value }] }));
  const pillBg = t.scheme === 'dark' ? t.c.surfaceActive : t.c.surfaceRaised;
  const slop = Math.max(0, (t.size.touch - h) / 2);

  return (
    <View
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
        style={[
          { position: 'absolute', top: pad, bottom: pad, left: 0, borderRadius: t.component.inputRadius - pad, backgroundColor: pillBg, boxShadow: t.c.shadowSm },
          pillAnim,
        ]}
      />
      {items.map((it, i) => {
        const on = i === index;
        const fg = on ? t.c.text : t.c.textMuted;
        return (
          <Touchable
            key={it.value}
            disabled={disabled || it.disabled}
            pressScale={1}
            pressOpacity={0.6}
            haptic={on ? false : 'selection'}
            hitSlop={{ top: slop, bottom: slop }}
            onPress={() => !on && onValueChange?.(it.value)}
            onLayout={(e) => {
              const { x: lx, width } = e.nativeEvent.layout;
              setSeg((s) => {
                if (s[i]?.x === lx && s[i]?.width === width) return s;
                const next = s.slice();
                next[i] = { x: lx, width };
                return next;
              });
            }}
            accessibilityLabel={it.accessibilityLabel ?? it.label}
            accessibilityState={{ selected: on, disabled: !!(disabled || it.disabled) }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.space['1_5'], paddingHorizontal: t.space[2] }}
          >
            {it.icon && <Icon name={it.icon} size={size === 'sm' ? 16 : 20} color={fg} strokeWidth={1.75} />}
            {it.label ? (
              <Text variant={size === 'sm' ? 'footnote' : 'label'} weight={on ? '600' : '500'} numberOfLines={1} style={{ color: fg }}>
                {it.label}
              </Text>
            ) : null}
          </Touchable>
        );
      })}
    </View>
  );
}
