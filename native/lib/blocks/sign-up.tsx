import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Checkbox, IconButton, Input, Progress, Text, useSlate } from '@ajinkyabhagwat/slateos-native';

export type SignUpScreenProps = {
  appName?: string;
  /** Resolve to create the account; throw with a message to show it. */
  onSubmit?: (account: { name: string; email: string; password: string }) => Promise<void> | void;
  onSignIn?: () => void;
  onBack?: () => void;
  onOpenTerms?: () => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 0–4: length, mixed case, a digit, a symbol.
function strength(pw: string) {
  if (!pw) return 0;
  return [pw.length >= 8, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
}
const STRENGTH = [
  { label: 'Too short', tone: 'danger' },
  { label: 'Weak', tone: 'danger' },
  { label: 'Fair', tone: 'warning' },
  { label: 'Good', tone: 'success' },
  { label: 'Strong', tone: 'success' },
] as const;

/** Name, email and password with a live strength meter and a terms checkbox. */
export function SignUpScreen({ appName = 'Acme', onSubmit, onSignIn, onBack, onOpenTerms }: SignUpScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();

  const score = password.length < 8 ? 0 : strength(password);
  const valid = name.trim() && EMAIL.test(email.trim()) && score >= 2 && terms;

  const submit = async () => {
    setTried(true);
    setFailure(undefined);
    if (!valid) return t.haptic('error');
    setBusy(true);
    try {
      await onSubmit?.({ name: name.trim(), email: email.trim(), password });
      t.haptic('success');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not create the account. Try again.');
      t.haptic('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: t.space[6], paddingHorizontal: t.component.screenPadding, paddingTop: insets.top + t.space[2], paddingBottom: insets.bottom + t.space[6] }}
      >
        {onBack ? <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={onBack} style={{ marginLeft: -t.space[2] }} /> : <View style={{ height: t.space[6] }} />}

        <View style={{ gap: t.space[2] }}>
          <Text variant="title1" accessibilityRole="header">Create your account</Text>
          <Text tone="muted">Start free. No card needed.</Text>
        </View>

        <View style={{ gap: t.space[4] }}>
          <Input
            label="Full name"
            placeholder="Maya Patel"
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={setName}
            error={tried && !name.trim() ? 'Enter your name.' : undefined}
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            error={tried && !EMAIL.test(email.trim()) ? 'Enter an email address like name@example.com.' : undefined}
          />
          <View style={{ gap: t.space[2] }}>
            <Input
              label="Password"
              secure
              placeholder="At least 8 characters"
              autoComplete="new-password"
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              error={tried && score < 2 ? 'Use 8 or more characters with a mix of letters and numbers.' : undefined}
            />
            {password.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
                <Progress value={score} max={4} tone={STRENGTH[score].tone} accessibilityLabel="Password strength" style={{ flex: 1 }} />
                <Text variant="footnote" tone={STRENGTH[score].tone}>{STRENGTH[score].label}</Text>
              </View>
            )}
          </View>
          <Checkbox
            checked={terms}
            onValueChange={setTerms}
            error={tried && !terms}
            label={`I agree to the ${appName} terms and privacy policy`}
          />
          {onOpenTerms && <Button variant="link" size="sm" onPress={onOpenTerms} style={{ alignSelf: 'flex-start' }}>Read the terms</Button>}
          {failure && <Text variant="footnote" tone="danger" accessibilityLiveRegion="polite">{failure}</Text>}
          <Button block size="lg" loading={busy} onPress={submit}>Create account</Button>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: t.space[1] }}>
          <Text tone="muted">Already have an account?</Text>
          <Button variant="link" onPress={onSignIn}>Sign in</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
