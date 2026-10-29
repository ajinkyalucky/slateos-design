import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Crossfade, useToggleProgress } from '../../primitives/Crossfade';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

export type ToggleItem = {
  value: string;
  label?: string;
  icon?: IconName;
  /** Required for icon-only items. */
  accessibilityLabel?: string;
  disabled?: boolean;
};

type Base = {
  items: ToggleItem[];
  /** 'default': a compact toolbar row (bold, italic). 'pill': wrapping rounded chips (filters). */
  variant?: 'default' | 'pill';
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Names the group for screen readers, e.g. "Text style". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export type ToggleGroupProps = Base &
  (
    | { type?: 'single'; value: string | null; onValueChange?: (value: string | null) => void }
    | { type: 'multiple'; value: string[]; onValueChange?: (value: string[]) => void }
  );

/** A row of toggle buttons, single or multiple choice: text styles, view options or filter pills. */
export function ToggleGroup(props: ToggleGroupProps) {
  const { items, variant = 'default', size = 'md', disabled, accessibilityLabel, style } = props;
  const t = useSlate();
  const h = t.control[size];
  const pill = variant === 'pill';
  const slop = Math.max(0, (t.size.touch - h) / 2);

  const isOn = (v: string) => (props.type === 'multiple' ? props.value.includes(v) : props.value === v);
  const toggle = (v: string) => {
    if (props.type === 'multiple') {
      const set = isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v];
      props.onValueChange?.(items.map((i) => i.value).filter((x) => set.includes(x)));
    } else {
      props.onValueChange?.(props.value === v ? null : v);
    }
  };

  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', flexWrap: pill ? 'wrap' : 'nowrap', gap: pill ? t.space[2] : t.space[1] }, style]}
    >
      {items.map((it) => (
        <ToggleButton
          key={it.value}
          item={it}
          on={isOn(it.value)}
          pill={pill}
          size={size}
          disabled={!!(disabled || it.disabled)}
          hitSlop={pill ? { top: slop, bottom: slop } : slop}
          onPress={() => toggle(it.value)}
        />
      ))}
    </View>
  );
}

function ToggleButton({ item: it, on, pill, size, disabled, hitSlop, onPress }: {
  item: ToggleItem; on: boolean; pill: boolean; size: 'sm' | 'md'; disabled: boolean;
  hitSlop: number | { top: number; bottom: number }; onPress: () => void;
}) {
  const t = useSlate();
  const h = t.control[size];
  const p = useToggleProgress(on, t.spring.press);
  const fill = useAnimatedStyle(() => ({ opacity: p.value }));
  const radius = pill ? h / 2 : t.component.buttonRadius;
  const content = (sel: boolean) => {
    const fg = pill ? (sel ? t.c.onAccent : t.c.text) : sel ? t.c.text : t.c.textMuted;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space['1_5'] }}>
        {it.icon && <Icon name={it.icon} size={size === 'sm' ? 16 : 20} color={fg} strokeWidth={sel ? 2 : 1.75} />}
        {it.label ? (
          <Text variant={size === 'sm' ? 'footnote' : 'label'} weight={sel ? '600' : '500'} numberOfLines={1} style={{ color: fg }}>
            {it.label}
          </Text>
        ) : null}
      </View>
    );
  };
  return (
    <Touchable
      disabled={disabled}
      haptic="selection"
      pressScale={0.95}
      hitSlop={hitSlop}
      onPress={onPress}
      accessibilityRole="togglebutton"
      accessibilityLabel={it.accessibilityLabel ?? it.label}
      accessibilityState={{ checked: on, disabled }}
      style={[
        {
          height: h,
          minWidth: h,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: it.label ? (size === 'sm' ? t.space[3] : t.space[4]) : 0,
          borderRadius: radius,
        },
        pill && { borderWidth: 1, borderColor: t.c.border, backgroundColor: t.c.surfaceRaised },
      ]}
    >
      {/* The selected fill fades over the resting one (covering the pill's border), so picks never snap. */}
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', top: pill ? -1 : 0, left: pill ? -1 : 0, right: pill ? -1 : 0, bottom: pill ? -1 : 0, borderRadius: radius },
          { backgroundColor: pill ? t.c.accentSolid : t.c.surfaceActive },
          fill,
        ]}
      />
      <Crossfade progress={p} on={content(true)} off={content(false)} />
    </Touchable>
  );
}
