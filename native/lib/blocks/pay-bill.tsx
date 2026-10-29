import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, View, type TextInputInstance } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert, AlertDialog, Button, Card, Chip, DatePicker, DescriptionList, Header, Icon, IconButton, Input, Select, Separator, Text,
  useSlate, type IconName,
} from '@ajinkyabhagwat/slateos-native';

export type PayBillBiller = {
  name: string;
  /** Shown masked, with only the last four digits. */
  accountNumber: string;
  icon: IconName;
  statementBalance: number;
  minimumDue: number;
  due: Date;
};

export type PayBillAccount = { value: string; label: string; last4: string; balance: number };

export type PayBillDetails = { amount: number; from: string; payOn: Date };

export type PayBillScreenProps = {
  biller?: PayBillBiller;
  accounts?: PayBillAccount[];
  onBack?: () => void;
  /** Make the payment. Resolve (optionally with a confirmation number) to show the receipt; throw to stay on review. */
  onPay?: (details: PayBillDetails) => Promise<{ confirmation?: string } | void> | void;
  /** Share the receipt. Default: the system share sheet. */
  onShare?: (receipt: string) => void;
  onDone?: () => void;
};

type Step = 'form' | 'review' | 'done';
type QuickPick = 'minimum' | 'statement' | 'other';

const usd = (n: number) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const inDays = (n: number) => { const d = startOfDay(new Date()); d.setDate(d.getDate() + n); return d; };
const isToday = (d: Date) => startOfDay(d).getTime() === startOfDay(new Date()).getTime();
const longDate = (d: Date) => (isToday(d) ? 'Today, ' : '') + d.toLocaleDateString('en-US', { weekday: isToday(d) ? undefined : 'short', month: 'short', day: 'numeric' });
const parse = (s: string) => {
  const n = Number(s.replace(/[^0-9.]/g, ''));
  return s.trim() && Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

const DEFAULT_BILLER: PayBillBiller = {
  name: 'Sapphire Visa',
  accountNumber: '4147 0920 1188 4417',
  icon: 'credit-card',
  statementBalance: 482.16,
  minimumDue: 35,
  due: inDays(6),
};
const DEFAULT_ACCOUNTS: PayBillAccount[] = [
  { value: 'checking', label: 'Everyday Checking', last4: '4821', balance: 3240.18 },
  { value: 'savings', label: 'High-Yield Savings', last4: '0937', balance: 12880.42 },
];

/** Pay one bill: amount with quick picks, account and date, a review step, then a receipt to share. */
export function PayBillScreen({ biller = DEFAULT_BILLER, accounts = DEFAULT_ACCOUNTS, onBack, onPay, onShare, onDone }: PayBillScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const amountRef = useRef<TextInputInstance>(null);
  const [step, setStep] = useState<Step>('form');
  const [amountText, setAmountText] = useState(biller.statementBalance.toFixed(2));
  const [from, setFrom] = useState<string | null>(accounts[0]?.value ?? null);
  const [payOn, setPayOn] = useState<Date | null>(inDays(0));
  const [warnLow, setWarnLow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const amount = parse(amountText);
  const account = accounts.find((a) => a.value === from);
  const pick: QuickPick = amount === biller.minimumDue ? 'minimum' : amount === biller.statementBalance ? 'statement' : 'other';
  const masked = `•••• ${biller.accountNumber.replace(/\D/g, '').slice(-4)}`;
  const date = payOn ?? inDays(0);

  const amountError = !amountText.trim()
    ? undefined
    : Number.isNaN(amount) || amount <= 0
      ? 'Enter an amount, like 120.00.'
      : amount > biller.statementBalance
        ? `That’s more than the ${usd(biller.statementBalance)} balance.`
        : account && amount > account.balance
          ? `${account.label} has ${usd(account.balance)} available.`
          : undefined;
  const ready = !Number.isNaN(amount) && amount > 0 && !amountError && !!account;

  const choose = (p: QuickPick) => {
    if (p === 'minimum') setAmountText(biller.minimumDue.toFixed(2));
    else if (p === 'statement') setAmountText(biller.statementBalance.toFixed(2));
    else { setAmountText(''); amountRef.current?.focus(); }
  };

  const review = () => {
    if (!ready) { t.haptic('error'); return; }
    if (amount < biller.minimumDue) { setWarnLow(true); return; }
    setFailed(null);
    setStep('review');
  };

  const pay = async () => {
    if (!account) return;
    setBusy(true);
    setFailed(null);
    try {
      const res = await onPay?.({ amount, from: account.value, payOn: date });
      setConfirmation(res?.confirmation ?? `PMT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
      t.haptic('success');
      setStep('done');
    } catch (e) {
      t.haptic('error');
      setFailed(e instanceof Error && e.message ? e.message : 'Nothing was taken from your account. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const receipt = [
    `Paid ${usd(amount)} to ${biller.name} (${masked})`,
    `From ${account?.label} ••${account?.last4}`,
    `${isToday(date) ? 'Paid' : 'Scheduled for'} ${date.toLocaleDateString('en-US', { dateStyle: 'medium' })}`,
    `Confirmation ${confirmation}`,
  ].join('\n');
  const share = () => (onShare ? onShare(receipt) : Share.share({ message: receipt }).catch(() => {}));

  const back = step === 'review' ? () => setStep('form') : onBack;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={step === 'review' ? 'Review payment' : step === 'done' ? 'Receipt' : 'Pay bill'}
        leading={step !== 'done' ? <IconButton icon="chevron-left" accessibilityLabel={step === 'review' ? 'Back to details' : 'Back'} onPress={back} /> : undefined}
      />

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={{ padding: t.component.screenPadding, paddingBottom: t.space[6] }}>
        <Animated.View key={step} entering={FadeIn.duration(t.motion.duration.base)} style={{ gap: t.space[5] }}>
          {step === 'form' && (
            <>
              <Card>
                <View style={{ gap: t.space[4] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
                    <View style={{ width: t.size.tile, height: t.size.tile, borderRadius: t.radius.lg, backgroundColor: t.c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={biller.icon} size={20} color={t.c.accent} strokeWidth={1.75} />
                    </View>
                    <View style={{ flex: 1, gap: t.space['0_5'] }}>
                      <Text variant="headline" accessibilityRole="header">{biller.name}</Text>
                      <Text variant="footnote" tone="muted" mono accessibilityLabel={`Account ending ${masked.slice(-4)}`}>{masked}</Text>
                    </View>
                  </View>
                  <Separator />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View style={{ gap: t.space['0_5'] }}>
                      <Text variant="footnote" tone="muted">Statement balance</Text>
                      <Text variant="title2" tabular>{usd(biller.statementBalance)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: t.space['0_5'] }}>
                      <Text variant="footnote" tone="muted" tabular>Minimum {usd(biller.minimumDue)}</Text>
                      <Text variant="footnote" tone="muted">Due {biller.due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                  </View>
                </View>
              </Card>

              <View style={{ gap: t.space[3] }}>
                <Input
                  ref={amountRef}
                  label="Amount"
                  icon="dollar"
                  size="lg"
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  value={amountText}
                  onChangeText={setAmountText}
                  error={amountError}
                  inputStyle={{ fontVariant: ['tabular-nums'] }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
                  <Chip label={`Minimum ${usd(biller.minimumDue)}`} value={pick === 'minimum'} onValueChange={() => choose('minimum')} />
                  <Chip label={`Statement ${usd(biller.statementBalance)}`} value={pick === 'statement'} onValueChange={() => choose('statement')} />
                  <Chip label="Other" value={pick === 'other'} onValueChange={() => pick !== 'other' && choose('other')} />
                </View>
              </View>

              <Select
                label="Pay from"
                value={from}
                onValueChange={setFrom}
                options={accounts.map((a) => ({ value: a.value, label: `${a.label} ••${a.last4}`, description: `${usd(a.balance)} available`, icon: 'wallet' as IconName }))}
              />

              <View style={{ gap: t.space['1_5'] }}>
                <DatePicker label="Pay on" value={payOn} onValueChange={setPayOn} min={inDays(0)} max={biller.due} format={{ weekday: 'short', month: 'short', day: 'numeric' }} />
                <Text variant="footnote" tone="muted">
                  {isToday(date) ? 'Sent today, arrives in 1–2 business days.' : `Sent on ${longDate(date)}. You can cancel until then.`}
                </Text>
              </View>
            </>
          )}

          {step === 'review' && account && (
            <>
              <View style={{ alignItems: 'center', gap: t.space[1], paddingVertical: t.space[3] }}>
                <Text variant="footnote" tone="muted">You’re paying</Text>
                <Text variant="display" tabular accessibilityRole="header">{usd(amount)}</Text>
                <Text tone="muted">to {biller.name}</Text>
              </View>
              {failed && <Alert tone="danger" title="Payment didn’t go through" description={failed} />}
              <Card>
                <DescriptionList
                  items={[
                    { label: 'Pay to', value: biller.name },
                    { label: 'Account', value: masked, mono: true },
                    { label: 'Amount', value: usd(amount) },
                    { label: 'From', value: `${account.label} ••${account.last4}` },
                    { label: 'Pay on', value: longDate(date) },
                    { label: 'Balance after', value: usd(account.balance - amount) },
                  ]}
                />
              </Card>
              <Text variant="footnote" tone="muted" style={{ textAlign: 'center' }}>
                By paying you authorise a one-time transfer from your {account.label.toLowerCase()} account.
              </Text>
            </>
          )}

          {step === 'done' && account && (
            <>
              <View style={{ alignItems: 'center', gap: t.space[3], paddingTop: t.space[6], paddingBottom: t.space[2] }}>
                <View style={{ width: t.size.avatarXl, height: t.size.avatarXl, borderRadius: t.radius.full, backgroundColor: t.c.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={24} color={t.c.success} strokeWidth={2} />
                </View>
                <View style={{ alignItems: 'center', gap: t.space[1] }}>
                  <Text variant="title2" accessibilityRole="header">{isToday(date) ? 'Payment sent' : 'Payment scheduled'}</Text>
                  <Text tone="muted" style={{ textAlign: 'center' }}>
                    {usd(amount)} to {biller.name}{isToday(date) ? ', arriving in 1–2 business days.' : ` on ${longDate(date)}.`}
                  </Text>
                </View>
              </View>
              <Card>
                <DescriptionList
                  items={[
                    { label: 'Confirmation', value: confirmation, mono: true },
                    { label: 'Paid to', value: `${biller.name} ${masked}` },
                    { label: 'Amount', value: usd(amount) },
                    { label: 'From', value: `${account.label} ••${account.last4}` },
                    { label: isToday(date) ? 'Sent' : 'Sends', value: longDate(date) },
                  ]}
                />
              </Card>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], gap: t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle }}>
        {step === 'form' && (
          <Button block size="lg" disabled={!ready} onPress={review}>Review payment</Button>
        )}
        {step === 'review' && (
          <>
            <Button block size="lg" loading={busy} onPress={pay}>{`Pay ${usd(amount)}`}</Button>
            <Button block variant="ghost" disabled={busy} onPress={() => setStep('form')}>Edit details</Button>
          </>
        )}
        {step === 'done' && (
          <View style={{ flexDirection: 'row', gap: t.space[3] }}>
            <Button variant="outline" size="lg" icon="share" style={{ flex: 1 }} onPress={share}>Share</Button>
            <Button size="lg" style={{ flex: 1 }} onPress={onDone}>Done</Button>
          </View>
        )}
      </View>

      <AlertDialog
        open={warnLow}
        onOpenChange={setWarnLow}
        title="Pay less than the minimum?"
        description={`The minimum due is ${usd(biller.minimumDue)}. Paying less may add a late fee and interest to your next statement.`}
        actions={[
          { label: `Pay ${usd(biller.minimumDue)}`, onPress: () => { setAmountText(biller.minimumDue.toFixed(2)); setStep('review'); } },
          { label: 'Continue anyway', onPress: () => setStep('review') },
          { label: 'Cancel', style: 'cancel' },
        ]}
      />
    </KeyboardAvoidingView>
  );
}
