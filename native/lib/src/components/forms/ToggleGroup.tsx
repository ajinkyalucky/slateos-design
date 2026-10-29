import { View, type StyleProp, type ViewStyle } from 'react-native';
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
      {items.map((it) => {
        const on = isOn(it.value);
        const off = disabled || it.disabled;
        const fg = pill ? (on ? t.c.onAccent : t.c.text) : on ? t.c.text : t.c.textMuted;
        return (
          <Touchable
            key={it.value}
            disabled={off}
            haptic="selection"
            pressScale={0.95}
            hitSlop={pill ? { top: slop, bottom: slop } : slop}
            onPress={() => toggle(it.value)}
            accessibilityRole="togglebutton"
            accessibilityLabel={it.accessibilityLabel ?? it.label}
            accessibilityState={{ checked: on, disabled: !!off }}
            style={[
              {
                height: h,
                minWidth: h,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: t.space['1_5'],
                paddingHorizontal: it.label ? (size === 'sm' ? t.space[3] : t.space[4]) : 0,
              },
              pill
                ? {
                    borderRadius: h / 2,
                    borderWidth: 1,
                    borderColor: on ? t.c.accentSolid : t.c.border,
                    backgroundColor: on ? t.c.accentSolid : t.c.surfaceRaised,
                  }
                : { borderRadius: t.component.buttonRadius, backgroundColor: on ? t.c.surfaceActive : 'transparent' },
            ]}
          >
            {it.icon && <Icon name={it.icon} size={size === 'sm' ? 16 : 20} color={fg} strokeWidth={on ? 2 : 1.75} />}
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
