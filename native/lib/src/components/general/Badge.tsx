import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { toneColors, type Tone } from './tone';

export type BadgeTone = Tone;
export type BadgeVariant = 'soft' | 'solid' | 'outline';

export type BadgeProps = {
  children?: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  /** A small status dot before the label. */
  dot?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A short status or category label: "Paid", "Beta", "3 left". Not interactive. */
export function Badge({ children, tone = 'neutral', variant = 'soft', size = 'md', dot, icon, accessibilityLabel, style }: BadgeProps) {
  const t = useSlate();
  const col = toneColors(t, tone);
  const fg = variant === 'solid' ? col.onSolid : col.fg;
  const sm = size === 'sm';
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: t.space[1],
          paddingHorizontal: sm ? t.space['1_5'] : t.space[2],
          paddingVertical: t.space['0_5'] - (variant === 'outline' ? 1 : 0),
          borderRadius: t.radius.full,
          backgroundColor: variant === 'solid' ? col.solid : variant === 'soft' ? col.soft : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: col.border,
        },
        style,
      ]}
    >
      {dot && <View style={{ width: t.space['1_5'], height: t.space['1_5'], borderRadius: t.radius.full, backgroundColor: variant === 'solid' ? fg : tone === 'neutral' ? t.c.textSubtle : col.solid }} />}
      {icon && <Icon name={icon} size={t.size.iconSm} color={fg} strokeWidth={1.75} />}
      {children != null && (
        <Text variant={sm ? 'caption' : 'footnote'} weight="500" numberOfLines={1} maxFontSizeMultiplier={1.4} style={{ color: fg }}>
          {children}
        </Text>
      )}
    </View>
  );
}

export type CountBadgeProps = {
  count: number;
  /** Above this, show "max+". Default 99. */
  max?: number;
  tone?: BadgeTone;
  /** Hide when the count is 0. Default true. */
  hideZero?: boolean;
  /** Spoken name, e.g. "3 unread messages". Default: the number. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A round, solid number badge for unread counts on icons, tabs and avatars. */
export function CountBadge({ count, max = 99, tone = 'danger', hideZero = true, accessibilityLabel, style }: CountBadgeProps) {
  const t = useSlate();
  if (hideZero && count <= 0) return null;
  const col = toneColors(t, tone);
  const h = t.type.caption.lineHeight + t.space['0_5'] * 2;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? String(count)}
      style={[
        {
          minWidth: h,
          height: h,
          paddingHorizontal: t.space['1_5'],
          borderRadius: t.radius.full,
          backgroundColor: col.solid,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant="caption" weight="600" tabular allowFontScaling={false} style={{ color: col.onSolid }}>
        {count > max ? `${max}+` : count}
      </Text>
    </View>
  );
}
