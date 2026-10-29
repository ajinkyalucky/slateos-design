import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, OTPInput, Text, useSlate } from '@ajinkyabhagwat/slateos-native';

export type VerifyCodeScreenProps = {
  /** Where the code went, shown as is: "maya@example.com" or "•••• 0142". */
  destination?: string;
  length?: number;
  /** Return (or resolve to) true when the code is right. */
  onVerify?: (code: string) => Promise<boolean> | boolean;
  onResend?: () => void;
  onBack?: () => void;
  /** Seconds before the code can be sent again. */
  resendAfter?: number;
};

/** A one-time code screen: autofill-ready boxes, a checked state, and a resend timer. */
export function VerifyCodeScreen({
  destination = 'maya@example.com',
  length = 6,
  onVerify = (code) => code === '123456',
  onResend,
  onBack,
  resendAfter = 30,
}: VerifyCodeScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'wrong' | 'ok'>('idle');
  const [wait, setWait] = useState(resendAfter);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const check = async (c: string) => {
    setState('checking');
    const ok = await onVerify(c);
    setState(ok ? 'ok' : 'wrong');
    t.haptic(ok ? 'success' : 'error');
  };

  const resend = () => {
    setCode('');
    setState('idle');
    setWait(resendAfter);
    onResend?.();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, gap: t.space[6], paddingHorizontal: t.component.screenPadding, paddingTop: insets.top + t.space[2], paddingBottom: insets.bottom + t.space[6] }}>
        {onBack ? <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={onBack} style={{ marginLeft: -t.space[2] }} /> : <View style={{ height: t.space[6] }} />}

        <View style={{ gap: t.space[3] }}>
          <View style={{ width: t.size.tile, height: t.size.tile, borderRadius: t.radius.lg, backgroundColor: state === 'ok' ? t.c.successSoft : t.c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={state === 'ok' ? 'check-circle' : 'mail'} size={24} color={state === 'ok' ? t.c.success : t.c.accent} />
          </View>
          <Text variant="title1" accessibilityRole="header">{state === 'ok' ? 'You are verified' : 'Check your inbox'}</Text>
          <Text tone="muted">
            {state === 'ok' ? 'Thanks. You can continue now.' : `We sent a ${length}-digit code to ${destination}. It expires in 10 minutes.`}
          </Text>
        </View>

        <OTPInput
          length={length}
          value={code}
          autoFocus
          disabled={state === 'checking' || state === 'ok'}
          onChangeText={(c) => {
            setCode(c);
            if (state === 'wrong') setState('idle');
          }}
          onComplete={check}
          error={state === 'wrong' ? 'That code didn’t match. Check the message and try again.' : undefined}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
          <Text tone="muted">Didn’t get it?</Text>
          {wait > 0 ? (
            <Text tone="subtle" tabular accessibilityLiveRegion="polite">Resend in 0:{String(wait).padStart(2, '0')}</Text>
          ) : (
            <Button variant="link" onPress={resend}>Send a new code</Button>
          )}
        </View>

        <View style={{ flex: 1 }} />
        <Button block size="lg" loading={state === 'checking'} disabled={code.length < length && state !== 'ok'} onPress={() => (state === 'ok' ? onBack?.() : check(code))}>
          {state === 'ok' ? 'Continue' : 'Verify'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
