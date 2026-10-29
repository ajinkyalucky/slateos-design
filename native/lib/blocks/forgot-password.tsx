import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, Input, Text, useSlate } from '@ajinkyabhagwat/slateos-native';

export type ForgotPasswordScreenProps = {
  /** Send the reset link. Throw with a message to show it. */
  onSubmit?: (email: string) => Promise<void> | void;
  onBack?: () => void;
  onOpenMail?: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ask for an email, send a reset link, then confirm where it went. */
export function ForgotPasswordScreen({ onSubmit, onBack, onOpenMail }: ForgotPasswordScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<string>();

  const submit = async () => {
    setTried(true);
    setFailure(undefined);
    if (!EMAIL.test(email.trim())) return t.haptic('error');
    setBusy(true);
    try {
      await onSubmit?.(email.trim());
      setSent(true);
      t.haptic('success');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not send the link. Try again.');
      t.haptic('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, gap: t.space[6], paddingHorizontal: t.component.screenPadding, paddingTop: insets.top + t.space[2], paddingBottom: insets.bottom + t.space[6] }}>
        {onBack ? <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={onBack} style={{ marginLeft: -t.space[2] }} /> : <View style={{ height: t.space[6] }} />}

        <View style={{ gap: t.space[3] }}>
          <View style={{ width: t.size.tile, height: t.size.tile, borderRadius: t.radius.lg, backgroundColor: sent ? t.c.successSoft : t.c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={sent ? 'check-circle' : 'key'} size={24} color={sent ? t.c.success : t.c.accent} />
          </View>
          <Text variant="title1" accessibilityRole="header">{sent ? 'Check your email' : 'Reset your password'}</Text>
          <Text tone="muted">
            {sent
              ? `If ${email.trim()} has an account, a reset link is on its way. It works for one hour.`
              : 'Enter the email you signed up with and we’ll send you a link to choose a new password.'}
          </Text>
        </View>

        {!sent && (
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus
            returnKeyType="send"
            onSubmitEditing={submit}
            value={email}
            onChangeText={setEmail}
            error={tried && !EMAIL.test(email.trim()) ? 'Enter an email address like name@example.com.' : undefined}
          />
        )}
        {failure && <Text variant="footnote" tone="danger" accessibilityLiveRegion="polite">{failure}</Text>}

        <View style={{ flex: 1 }} />
        {sent ? (
          <View style={{ gap: t.space[3] }}>
            {onOpenMail && <Button block size="lg" icon="mail" onPress={onOpenMail}>Open email app</Button>}
            <Button block size="lg" variant={onOpenMail ? 'ghost' : 'solid'} onPress={onBack}>Back to sign in</Button>
            <Button variant="link" onPress={() => setSent(false)} style={{ alignSelf: 'center' }}>Use a different email</Button>
          </View>
        ) : (
          <Button block size="lg" loading={busy} onPress={submit}>Send reset link</Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
