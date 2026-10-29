import { Children, createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Switch } from '../forms/Switch';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

export type ListProps = { children: ReactNode; style?: StyleProp<ViewStyle> };

/** A settings-style screen body: a column of ListSections with consistent spacing. */
export function List({ children, style }: ListProps) {
  const t = useSlate();
  return <View style={[{ gap: t.space[6] }, style]}>{children}</View>;
}

const RowIndex = createContext(0);

export type ListSectionProps = {
  /** Overline above the card. */
  header?: string;
  /** Explanatory text under the card. */
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** An inset, rounded group of ListRows with an optional header and footer. */
export function ListSection({ header, footer, children, style }: ListSectionProps) {
  const t = useSlate();
  const rows = Children.toArray(children);
  return (
    <View style={[{ gap: t.space[2] }, style]}>
      {header ? (
        <Text variant="overline" tone="subtle" accessibilityRole="header" style={{ paddingHorizontal: t.space[4] }}>{header}</Text>
      ) : null}
      <View
        style={{
          backgroundColor: t.c.surfaceRaised, borderRadius: t.component.listRadius,
          borderWidth: StyleSheet.hairlineWidth, borderColor: t.c.border, overflow: 'hidden',
        }}
      >
        {rows.map((row, i) => (
          <RowIndex.Provider key={i} value={i}>{row}</RowIndex.Provider>
        ))}
      </View>
      {footer ? <Text variant="footnote" tone="subtle" style={{ paddingHorizontal: t.space[4] }}>{footer}</Text> : null}
    </View>
  );
}

export type ListAccessory = 'chevron' | 'check' | 'switch' | 'none';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Leading icon in a tinted tile. */
  icon?: IconName;
  /** Tile colour. Default the accent. */
  iconTint?: string;
  /** Any leading element instead of an icon tile, e.g. an Avatar. */
  leading?: ReactNode;
  /** Trailing value text, e.g. "English". */
  detail?: string;
  /** Trailing control. Default 'chevron' when pressable. Pass an element for anything custom. */
  accessory?: ListAccessory | ReactNode;
  /** For 'switch' and 'check'. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** One row of a ListSection: icon, title, subtitle, a trailing value and an accessory. 48pt minimum. */
export function ListRow({
  title, subtitle, icon, iconTint, leading, detail, accessory, checked, onCheckedChange, destructive, disabled, onPress, accessibilityLabel, style,
}: ListRowProps) {
  const t = useSlate();
  const index = useContext(RowIndex);
  const tile = t.size.controlSm;
  const hasLead = !!(icon || leading);
  const kind = accessory === undefined ? (onPress && !destructive ? 'chevron' : 'none') : accessory;
  const toggle = kind === 'switch' || kind === 'check';
  const press = toggle && onCheckedChange ? () => onCheckedChange(kind === 'check' ? true : !checked) : onPress;
  const inset = t.space[4] + (hasLead ? tile + t.space[3] : 0);

  const trailing =
    kind === 'chevron' ? <Icon name="chevron-right" size={16} color={t.c.textSubtle} strokeWidth={2} />
    : kind === 'check' ? (checked ? <Icon name="check" size={20} color={t.c.accent} strokeWidth={2} /> : null)
    : kind === 'switch' ? (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Switch value={!!checked} onValueChange={(v) => onCheckedChange?.(v)} disabled={disabled} accessibilityLabel={title} />
      </View>
    )
    : kind === 'none' ? null : (accessory as ReactNode);

  const body = (
    <View style={{ minHeight: t.component.rowHeight, flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingHorizontal: t.space[4], paddingVertical: t.space[2] }}>
      {index > 0 && (
        <View style={{ position: 'absolute', top: 0, left: inset, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.c.border }} />
      )}
      {icon ? (
        <View style={{ width: tile, height: tile, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: iconTint ?? t.c.accentSolid }}>
          <Icon name={icon} size={20} color={iconTint ? t.c.onSolid : t.c.onAccent} strokeWidth={1.75} />
        </View>
      ) : leading}
      <View style={{ flex: 1, gap: t.space['0_5'] }}>
        <Text style={destructive ? { color: t.c.danger } : undefined} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text variant="footnote" tone="subtle" numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {detail ? <Text variant="callout" tone="subtle" numberOfLines={1} style={{ maxWidth: '45%' }}>{detail}</Text> : null}
      {trailing}
    </View>
  );

  const a11yLabel = accessibilityLabel ?? [title, subtitle, detail].filter(Boolean).join(', ');
  if (!press) {
    return (
      <View accessible accessibilityLabel={a11yLabel} style={[disabled && { opacity: t.opacity.disabled }, style]}>
        {body}
      </View>
    );
  }
  return (
    <Touchable
      onPress={press}
      disabled={disabled}
      haptic={toggle ? 'selection' : undefined}
      pressScale={1}
      pressedStyle={{ backgroundColor: t.c.surfaceHover }}
      accessibilityRole={kind === 'switch' ? 'switch' : 'button'}
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: !!disabled, ...(kind === 'switch' ? { checked: !!checked } : kind === 'check' ? { selected: !!checked } : {}) }}
      style={style}
    >
      {body}
    </Touchable>
  );
}
