import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, Input, Separator, Text, useSlate, type IconName } from '@ajinkyabhagwat/slateos-native';

export type SignInScreenProps = {
  appName?: string;
  /** Resolve to sign in; throw (or reject) with a message to show it under the form. */
  onSubmit?: (credentials: { email: string; password: string }) => Promise<void> | void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  /** Leave empty to hide the social buttons. */
  providers?: { id: string; label: string; icon: IconName }[];
  onProvider?: (id: string) => void;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email and password sign-in, with social providers and links to sign up or reset the password. */
export function SignInScreen({
  appName = 'Acme',
  onSubmit,
  onForgotPassword,
  onSignUp,
  providers = [{ id: 'github', label: 'Continue with GitHub', icon: 'github' }],
  onProvider,
}: SignInScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();

  const emailError = tried && !EMAIL.test(email.trim()) ? 'Enter an email address like name@example.com.' : undefined;
  const passwordError = tried && !password ? 'Enter your password.' : undefined;

  const submit = async () => {
    setTried(true);
    setFailure(undefined);
    if (!EMAIL.test(email.trim()) || !password) return t.haptic('error');
    setBusy(true);
    try {
      await onSubmit?.({ email: email.trim(), password });
      t.haptic('success');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not sign in. Try again.');
      t.haptic('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1, justifyContent: 'center', gap: t.space[6],
          paddingHorizontal: t.component.screenPadding, paddingTop: insets.top + t.space[8], paddingBottom: insets.bottom + t.space[6],
        }}
      >
        <View style={{ gap: t.space[3] }}>
          <View style={{ width: t.size.tile, height: t.size.tile, borderRadius: t.radius.lg, backgroundColor: t.c.accentSolid, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layers" size={24} color={t.c.onAccent} />
          </View>
          <Text variant="title1" accessibilityRole="header">Welcome back</Text>
          <Text tone="muted">Sign in to {appName} to pick up where you left off.</Text>
        </View>

        <View style={{ gap: t.space[4] }}>
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            error={emailError}
          />
          <View style={{ gap: t.space[1] }}>
            <Input
              label="Password"
              secure
              placeholder="Your password"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />
            <Button variant="link" size="sm" onPress={onForgotPassword} style={{ alignSelf: 'flex-end' }}>
              Forgot password?
            </Button>
          </View>
          {failure && <Text variant="footnote" tone="danger" accessibilityLiveRegion="polite">{failure}</Text>}
          <Button block size="lg" loading={busy} onPress={submit}>Sign in</Button>
        </View>

        {providers.length > 0 && (
          <View style={{ gap: t.space[4] }}>
            <Separator label="or" />
            {providers.map((p) => (
              <Button key={p.id} block variant="outline" icon={p.icon} onPress={() => onProvider?.(p.id)}>{p.label}</Button>
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: t.space[1] }}>
          <Text tone="muted">New to {appName}?</Text>
          <Button variant="link" onPress={onSignUp}>Create an account</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
