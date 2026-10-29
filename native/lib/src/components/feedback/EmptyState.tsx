import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  /** Buttons, stacked and centred. */
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A centred placeholder for a screen or list with nothing in it yet: says why, and what to do next. */
export function EmptyState({ icon, title, description, actions, style }: EmptyStateProps) {
  const t = useSlate();
  const tile = t.size.controlXl;
  return (
    <View style={[{ alignItems: 'center', paddingVertical: t.space[6], paddingHorizontal: t.space[4], gap: t.space[4] }, style]}>
      {icon && (
        <View
          style={{
            width: tile, height: tile, borderRadius: t.radius.xl, alignItems: 'center', justifyContent: 'center',
            backgroundColor: t.c.accentSoft, borderWidth: 1, borderColor: t.c.borderSubtle,
          }}
        >
          <Icon name={icon} size={24} color={t.c.textMuted} />
        </View>
      )}
      <View style={{ alignItems: 'center', gap: t.space[1], maxWidth: t.size.widthMd }}>
        <Text variant="headline" align="center" accessibilityRole="header">{title}</Text>
        {description ? <Text variant="callout" tone="muted" align="center">{description}</Text> : null}
      </View>
      {actions ? <View style={{ alignItems: 'center', gap: t.space[2], paddingTop: t.space[1] }}>{actions}</View> : null}
    </View>
  );
}
