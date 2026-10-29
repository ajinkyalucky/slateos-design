import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Icon, IconButton, Radio, RadioGroup, Text, useSlate, type IconName } from '@ajinkyabhagwat/slateos-native';

export type PaywallPlan = { value: string; label: string; price: string; detail: string; badge?: string; footnote: string };

export type PaywallScreenProps = {
  title?: string;
  features?: { icon: IconName; title: string; body: string }[];
  plans?: PaywallPlan[];
  /** Start the purchase for the chosen plan. Throw to stay on the screen. */
  onSubscribe?: (plan: string) => Promise<void> | void;
  onRestore?: () => void;
  onClose?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
};

const DEFAULT_FEATURES: PaywallScreenProps['features'] = [
  { icon: 'zap', title: 'Unlimited projects', body: 'No caps on boards, files or collaborators.' },
  { icon: 'bar-chart', title: 'Insights', body: 'Weekly trends and goals, with exports.' },
  { icon: 'cloud', title: 'Sync everywhere', body: 'Phone, tablet and web, always up to date.' },
  { icon: 'shield', title: 'Priority support', body: 'A real person replies within a day.' },
];
const DEFAULT_PLANS: PaywallPlan[] = [
  { value: 'yearly', label: 'Yearly', price: '$59.99', detail: '$5.00 a month', badge: 'Save 37%', footnote: '7 days free, then $59.99 a year.' },
  { value: 'monthly', label: 'Monthly', price: '$7.99', detail: 'Billed monthly', footnote: '7 days free, then $7.99 a month.' },
];

/** An upgrade screen: what you get, a plan picker, one clear call to action, and the required links. */
export function PaywallScreen({
  title = 'Unlock Pro',
  features = DEFAULT_FEATURES,
  plans = DEFAULT_PLANS,
  onSubscribe,
  onRestore,
  onClose,
  onOpenTerms,
  onOpenPrivacy,
}: PaywallScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState(plans[0]?.value ?? '');
  const [busy, setBusy] = useState(false);
  const chosen = plans.find((p) => p.value === plan);

  const subscribe = async () => {
    setBusy(true);
    try {
      await onSubscribe?.(plan);
      t.haptic('success');
    } catch {
      t.haptic('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingTop: insets.top + t.space[2], paddingBottom: t.space[6], gap: t.space[6] }}>
        <IconButton icon="x" accessibilityLabel="Close" onPress={onClose} style={{ alignSelf: 'flex-end', marginRight: -t.space[2] }} />

        <View style={{ gap: t.space[3] }}>
          <View style={{ width: t.size.tile, height: t.size.tile, borderRadius: t.radius.lg, backgroundColor: t.c.accentSolid, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={24} color={t.c.onAccent} />
          </View>
          <Text variant="title1" accessibilityRole="header">{title}</Text>
          <Text tone="muted">Everything you need to do your best work, on every device.</Text>
        </View>

        <View style={{ gap: t.space[4] }}>
          {features?.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: t.space[3] }}>
              <View style={{ paddingTop: t.space['0_5'] }}>
                <Icon name={f.icon} size={20} color={t.c.accent} />
              </View>
              <View style={{ flex: 1, gap: t.space['0_5'] }}>
                <Text variant="label">{f.title}</Text>
                <Text variant="footnote" tone="muted">{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <RadioGroup variant="card" value={plan} onValueChange={setPlan} accessibilityLabel="Plan">
          {plans.map((p) => (
            <Radio
              key={p.value}
              value={p.value}
              label={p.label}
              description={p.detail}
              aside={
                <View style={{ alignItems: 'flex-end', gap: t.space[1] }}>
                  {p.badge && <Badge tone="success" size="sm">{p.badge}</Badge>}
                  <Text variant="headline" tabular>{p.price}</Text>
                </View>
              }
            />
          ))}
        </RadioGroup>
      </ScrollView>

      <View style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], gap: t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle }}>
        <Button block size="lg" loading={busy} onPress={subscribe}>Start free trial</Button>
        <Text variant="footnote" tone="muted" style={{ textAlign: 'center' }}>{chosen?.footnote} Cancel any time.</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: t.space[5] }}>
          <Button variant="link" size="sm" onPress={onRestore}>Restore</Button>
          <Button variant="link" size="sm" onPress={onOpenTerms}>Terms</Button>
          <Button variant="link" size="sm" onPress={onOpenPrivacy}>Privacy</Button>
        </View>
      </View>
    </View>
  );
}
