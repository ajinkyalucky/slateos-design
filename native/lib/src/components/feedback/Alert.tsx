import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { feedbackColors, toneIcon, type FeedbackTone } from './tone';

export type AlertTone = FeedbackTone;

export type AlertProps = {
  tone?: AlertTone;
  title?: string;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Override the tone's icon, or false for none. */
  icon?: IconName | false;
  /** A text action under the description. */
  action?: { label: string; onPress: () => void };
  /** Shows a close button. */
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** An inline callout for status that belongs to the content around it: a tip, a warning, a failed sync. */
export function Alert({ tone = 'neutral', title, description, icon, action, onDismiss, style }: AlertProps) {
  const t = useSlate();
  const col = feedbackColors(t, tone);
  const urgent = tone === 'danger' || tone === 'warning';
  const iconName = icon === false ? null : icon ?? toneIcon[tone];
  return (
    <View
      accessibilityRole={urgent ? 'alert' : undefined}
      style={[
        {
          flexDirection: 'row',
          gap: t.space[3],
          padding: t.space[4],
          paddingRight: onDismiss ? t.space[2] : t.space[4],
          borderRadius: t.component.cardRadius,
          borderWidth: 1,
          borderColor: col.border,
          backgroundColor: col.soft,
        },
        style,
      ]}
    >
      {iconName && (
        <View style={{ paddingTop: (t.type.headline.lineHeight - 20) / 2 }}>
          <Icon name={iconName} size={20} color={col.icon} strokeWidth={1.75} />
        </View>
      )}
      <View style={{ flex: 1, gap: t.space[1] }}>
        {title ? <Text variant="headline">{title}</Text> : null}
        {typeof description === 'string' ? <Text variant="callout" tone="muted">{description}</Text> : description}
        {action && (
          <Touchable
            onPress={action.onPress}
            haptic="selection"
            pressScale={0.96}
            hitSlop={t.space[4]}
            style={{ alignSelf: 'flex-start', marginTop: t.space[1] }}
          >
            <Text variant="label" weight="600" style={{ color: col.fg }}>{action.label}</Text>
          </Touchable>
        )}
      </View>
      {onDismiss && (
        <Touchable
          onPress={onDismiss}
          haptic="selection"
          pressScale={0.9}
          accessibilityLabel="Dismiss"
          hitSlop={t.space[3]}
          style={{ width: t.size.controlXs, height: t.size.controlXs, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={16} color={t.c.textSubtle} strokeWidth={1.75} />
        </Touchable>
      )}
    </View>
  );
}
