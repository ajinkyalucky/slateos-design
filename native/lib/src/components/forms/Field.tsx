import { useEffect, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';

export type FieldProps = {
  label?: string;
  hint?: string;
  /** A message replaces the hint in the danger tone and is announced. `true` marks the control without a message. */
  error?: string | boolean;
  /** Adds a red asterisk; screen readers say "required". */
  required?: boolean;
  /** Shows "Optional" at the end of the label row. */
  optional?: boolean;
  /** Shown at the right of the hint row, e.g. a character count. */
  counter?: ReactNode;
  disabled?: boolean;
  /** The control already speaks the label and hint, so hide them from screen readers. */
  labelledControl?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

/** Label, hint and error around any form control. Input, Textarea and the other text fields use it for you. */
export function Field({ label, hint, error, required, optional, counter, disabled, labelledControl, children, style }: FieldProps) {
  const t = useSlate();
  const message = typeof error === 'string' && error ? error : undefined;
  useEffect(() => {
    // Android announces through the live region; iOS needs an explicit announcement.
    if (message && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  const hide = labelledControl ? hidden : null;
  const footer = message || hint || counter;

  return (
    <View style={[{ gap: t.space[2] }, style]}>
      {(label || optional) && (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: t.space[2] }} {...hide}>
          <Text variant="label" tone={disabled ? 'disabled' : 'default'} accessibilityLabel={required ? `${label}, required` : label}>
            {label}
            {required && <Text variant="label" tone="danger">{' *'}</Text>}
          </Text>
          {optional && <Text variant="footnote" tone="subtle">Optional</Text>}
        </View>
      )}
      {children}
      {footer ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] }}>
          <View style={{ flex: 1, flexDirection: 'row', gap: t.space['1_5'] }}>
            {message ? (
              <>
                <View style={{ height: t.type.footnote.lineHeight, justifyContent: 'center' }}>
                  <Icon name="alert-circle" size={16} color={t.c.danger} />
                </View>
                <Text variant="footnote" tone="danger" accessibilityLiveRegion="polite" style={{ flex: 1 }}>{message}</Text>
              </>
            ) : hint ? (
              <Text variant="footnote" tone={disabled ? 'disabled' : 'subtle'} style={{ flex: 1 }} {...hide}>{hint}</Text>
            ) : null}
          </View>
          {counter}
        </View>
      ) : null}
    </View>
  );
}
