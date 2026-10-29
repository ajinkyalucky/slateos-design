import { useEffect, type ReactNode } from 'react';
import { Keyboard, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { Button, type ButtonVariant } from '../general/Button';
import { Backdrop, useBackHandler, useKeyboardHeight, usePresence } from './shared';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Actions, laid out in a row at the end of the card. */
  footer?: ReactNode;
  /** Tap the backdrop or press back to close. Default true. */
  dismissible?: boolean;
  accessibilityLabel?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A centred card over a dimmed screen, for short tasks that need the user's full attention. */
export function Dialog(props: DialogProps) {
  const { mounted, onExited } = usePresence(props.open);
  if (!mounted) return null;
  return (
    <Portal modal>
      <DialogLayer {...props} onExited={onExited} />
    </Portal>
  );
}

function DialogLayer({
  open, onOpenChange, title, description, footer, dismissible = true, accessibilityLabel, children, style, onExited, alert, onBack,
}: DialogProps & { onExited: () => void; alert?: boolean; onBack?: () => void }) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const p = useSharedValue(0);
  const kb = useKeyboardHeight();
  const spring = t.spring.standard;
  const exit = { duration: t.motion.duration.base, easing: Easing.out(Easing.quad) };
  const close = () => onOpenChange(false);
  const back = onBack ?? (dismissible ? close : undefined);

  useEffect(() => {
    if (open) p.value = withSpring(1, spring);
    else {
      Keyboard.dismiss();
      p.value = withTiming(0, exit, (done) => { if (done) scheduleOnRN(onExited); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useBackHandler(open, () => back?.());

  // Rises a few points as it scales in and sinks back on the way out, so open and close read as one gesture.
  const rise = t.space[3];
  const card = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: -kb.value / 2 + rise * (1 - p.value) }, { scale: 0.96 + 0.04 * p.value }],
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, {
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: t.space[5], paddingTop: insets.top, paddingBottom: insets.bottom,
      }]}
    >
      <Backdrop progress={p} onPress={dismissible ? close : undefined} label="Close dialog" />
      <Animated.View
        accessibilityViewIsModal
        accessibilityRole={alert ? 'alert' : undefined}
        accessibilityLabel={accessibilityLabel}
        onAccessibilityEscape={back}
        style={[
          {
            width: '100%', maxWidth: alert ? t.size.widthMd : t.size.widthLg, padding: t.space[5], gap: t.space[4],
            borderRadius: t.component.dialogRadius, borderCurve: 'continuous', backgroundColor: t.c.surfaceRaised, boxShadow: t.c.shadowXl,
          },
          style,
          card,
        ]}
      >
        {(title || description) && (
          <View style={{ gap: t.space['1_5'] }}>
            {title && <Text variant="title3" accessibilityRole="header">{title}</Text>}
            {description && <Text tone="muted">{description}</Text>}
          </View>
        )}
        {children}
        {footer}
      </Animated.View>
    </View>
  );
}

export type AlertAction = {
  label: string;
  /** 'cancel' closes quietly, 'destructive' is red. Default 'default'. */
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Up to three: cancel, confirm and destructive. */
  actions: AlertAction[];
  style?: StyleProp<ViewStyle>;
};

const variantFor: Record<NonNullable<AlertAction['style']>, ButtonVariant> = { default: 'solid', cancel: 'secondary', destructive: 'destructive' };

/**
 * A blocking confirmation. Only an action closes it (never the backdrop); long labels stack vertically.
 * Use it before something destructive or irreversible.
 */
export function AlertDialog({ open, onOpenChange, title, description, actions, style }: AlertDialogProps) {
  const t = useSlate();
  const { mounted, onExited } = usePresence(open);
  if (!mounted) return null;
  const list = actions.slice(0, 3);
  const cancel = list.filter((a) => a.style === 'cancel');
  const rest = list.filter((a) => a.style !== 'cancel');
  const stacked = list.length > 2 || list.some((a) => a.label.length > 14);
  // Row: cancel first, the action last (nearest the thumb). Stack: the action on top, cancel last.
  const ordered = stacked ? [...rest, ...cancel] : [...cancel, ...rest];
  const press = (a: AlertAction) => { onOpenChange(false); a.onPress?.(); };
  const onCancel = () => { onOpenChange(false); cancel[0]?.onPress?.(); };
  return (
    <Portal modal>
      <DialogLayer
        alert
        open={open}
        onOpenChange={onOpenChange}
        onBack={cancel.length ? onCancel : undefined}
        dismissible={false}
        title={title}
        description={description}
        accessibilityLabel={title}
        style={style}
        onExited={onExited}
        footer={
          <View style={{ flexDirection: stacked ? 'column' : 'row', gap: t.space[2], marginTop: t.space[1] }}>
            {ordered.map((a) => (
              <Button key={a.label} variant={variantFor[a.style ?? 'default']} block={stacked} style={!stacked && { flex: 1 }} onPress={() => press(a)}>
                {a.label}
              </Button>
            ))}
          </View>
        }
      />
    </Portal>
  );
}
