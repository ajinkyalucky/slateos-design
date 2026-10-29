import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Card, CardHeader, DescriptionList, Header, Icon, IconButton, Radio, RadioGroup, Select, Sheet, Text, Toaster,
  chartColor, mix, toast, useSlate, type IconName, type Theme,
} from '@ajinkyabhagwat/slateos-native';

export type CheckoutItem = { id: string; name: string; variant: string; price: number; qty: number; icon: IconName; tint?: number };
export type CheckoutAddress = { id: string; label: string; name: string; lines: string[]; phone: string };
export type DeliveryOption = { value: string; label: string; detail: string; price: number; arrives: string };
export type PaymentOption = { value: string; label: string; description?: string; icon: IconName };

export type CheckoutScreenProps = {
  items?: CheckoutItem[];
  addresses?: CheckoutAddress[];
  delivery?: DeliveryOption[];
  payments?: PaymentOption[];
  discount?: number;
  taxRate?: number;
  onBack?: () => void;
  /** Place the order. Resolve with an order number to show it; throw to stay on the form. */
  onPlaceOrder?: (order: { address: string; delivery: string; payment: string; total: number }) => Promise<string | void> | string | void;
  onTrackOrder?: () => void;
  onDone?: () => void;
};

const DEFAULT_ITEMS: CheckoutItem[] = [
  { id: '1', name: 'Merino Crew Sweater', variant: 'Sage · M', price: 128, qty: 1, icon: 'layers', tint: 1 },
  { id: '3', name: 'Slim Card Wallet', variant: 'Charcoal', price: 48, qty: 2, icon: 'wallet', tint: 0 },
  { id: '4', name: 'Arc Desk Lamp', variant: 'Ochre', price: 89, qty: 1, icon: 'sun', tint: 2 },
];
const DEFAULT_ADDRESSES: CheckoutAddress[] = [
  { id: 'home', label: 'Home', name: 'Maya Patel', lines: ['214 Bergen Street, Apt 3F', 'Brooklyn, NY 11217'], phone: '(718) 555-0142' },
  { id: 'work', label: 'Work', name: 'Maya Patel', lines: ['Acme Co., 85 Broad Street, Floor 12', 'New York, NY 10004'], phone: '(212) 555-0187' },
];
const DEFAULT_DELIVERY: DeliveryOption[] = [
  { value: 'standard', label: 'Standard', detail: '3–5 business days', price: 0, arrives: 'Tuesday, Nov 3' },
  { value: 'express', label: 'Express', detail: '1–2 business days', price: 12, arrives: 'Friday, Oct 30' },
  { value: 'next', label: 'Next day', detail: 'Order by 2 pm', price: 24, arrives: 'tomorrow' },
];
const DEFAULT_PAYMENTS: PaymentOption[] = [
  { value: 'visa', label: 'Visa ending 4242', description: 'Expires 08/28', icon: 'credit-card' },
  { value: 'apple', label: 'Apple Pay', description: 'Pay with Face ID', icon: 'wallet' },
  { value: 'paypal', label: 'PayPal', description: 'maya@acme.co', icon: 'dollar' },
];

const usd = (n: number) => `$${n.toFixed(2)}`;
const tileColor = (t: Theme, i: number) => mix(t.c.bg, chartColor(t, i), t.scheme === 'dark' ? 0.24 : 0.14);

/** Checkout: ship-to address, delivery speed, payment and the order summary, then a confirmation with the order number. */
export function CheckoutScreen({
  items = DEFAULT_ITEMS,
  addresses = DEFAULT_ADDRESSES,
  delivery = DEFAULT_DELIVERY,
  payments = DEFAULT_PAYMENTS,
  discount = 0,
  taxRate = 0.08875,
  onBack,
  onPlaceOrder,
  onTrackOrder,
  onDone,
}: CheckoutScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? '');
  const [picking, setPicking] = useState(false);
  const [speed, setSpeed] = useState(delivery[0]?.value ?? '');
  const [payment, setPayment] = useState<string | null>(payments[0]?.value ?? null);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);
  const pad = t.component.screenPadding;

  const address = addresses.find((a) => a.id === addressId);
  const option = delivery.find((d) => d.value === speed);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = option?.price ?? 0;
  const tax = Math.round((subtotal - discount) * taxRate * 100) / 100;
  const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100;

  const place = async () => {
    if (!payment) {
      t.haptic('warning');
      toast.warning('Choose how to pay');
      return;
    }
    setBusy(true);
    try {
      const number = await onPlaceOrder?.({ address: addressId, delivery: speed, payment, total });
      t.haptic('success');
      setPlaced(typeof number === 'string' && number ? number : `SL-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch {
      t.haptic('error');
      toast.error('Couldn’t place your order', { description: 'You haven’t been charged. Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg }}>
        <View style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: pad, alignItems: 'center', justifyContent: 'center', gap: t.space[5] }}>
          <SuccessMark />
          <View style={{ alignItems: 'center', gap: t.space[2] }}>
            <Text variant="title2" accessibilityRole="header" align="center">Order placed</Text>
            <Text tone="muted" align="center">
              Thanks, {address?.name.split(' ')[0] ?? 'there'}. Your order arrives {option?.arrives ?? 'soon'}. We’ve emailed your receipt.
            </Text>
          </View>
          <Card variant="filled" style={{ alignSelf: 'stretch' }}>
            <DescriptionList
              items={[
                { label: 'Order number', value: placed, mono: true },
                { label: 'Delivery', value: option ? `${option.label}, ${option.arrives}` : '' },
                { label: 'Total paid', value: usd(total) },
              ]}
            />
          </Card>
        </View>
        <View style={{ paddingHorizontal: pad, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], gap: t.space[2] }}>
          <Button block size="lg" icon="truck" onPress={onTrackOrder}>Track order</Button>
          <Button block size="lg" variant="outline" onPress={onDone}>Continue shopping</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header title="Checkout" leading={<IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: pad, paddingTop: t.space[2], paddingBottom: t.space[6], gap: t.space[6] }}>
        <Card>
          <CardHeader title="Ship to" action={<Button variant="link" size="sm" onPress={() => setPicking(true)} accessibilityLabel="Change address">Change</Button>} />
          {address && (
            <View style={{ flexDirection: 'row', gap: t.space[3] }}>
              <Icon name="map-pin" size={20} color={t.c.textSubtle} />
              <View style={{ flex: 1, gap: t.space['0_5'] }}>
                <Text weight="500">{address.name}</Text>
                {address.lines.map((l) => <Text key={l} variant="callout" tone="muted">{l}</Text>)}
                <Text variant="callout" tone="muted" tabular>{address.phone}</Text>
              </View>
            </View>
          )}
        </Card>

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">Delivery</Text>
          <RadioGroup variant="card" value={speed} onValueChange={setSpeed} accessibilityLabel="Delivery speed">
            {delivery.map((d) => (
              <Radio
                key={d.value}
                value={d.value}
                label={d.label}
                description={`${d.detail} · arrives ${d.arrives}`}
                aside={<Text variant="headline" tabular tone={d.price ? 'default' : 'success'}>{d.price ? usd(d.price) : 'Free'}</Text>}
              />
            ))}
          </RadioGroup>
        </View>

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">Payment</Text>
          <Select title="Pay with" placeholder="Choose a payment method" options={payments} value={payment} onValueChange={setPayment} />
        </View>

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">Order summary</Text>
          <Card>
            {items.map((item, i) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{ width: t.size.controlLg, height: t.size.controlLg, borderRadius: t.radius.md, backgroundColor: tileColor(t, item.tint ?? i), alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name={item.icon} size={20} color={chartColor(t, item.tint ?? i)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="callout" weight="500" numberOfLines={1}>{item.name}</Text>
                  <Text variant="footnote" tone="muted" numberOfLines={1}>{item.variant} · Qty {item.qty}</Text>
                </View>
                <Text variant="callout" tabular>{usd(item.price * item.qty)}</Text>
              </View>
            ))}
            <DescriptionList
              items={[
                { label: `Subtotal (${count} ${count === 1 ? 'item' : 'items'})`, value: usd(subtotal) },
                ...(discount ? [{ label: 'Discount', value: <Text variant="callout" weight="500" tone="success" tabular>{`−${usd(discount)}`}</Text> }] : []),
                { label: 'Delivery', value: shipping ? usd(shipping) : 'Free' },
                { label: 'Estimated tax', value: usd(tax) },
                { label: 'Total', value: <Text variant="headline" tabular>{usd(total)}</Text> },
              ]}
            />
          </Card>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: pad, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], gap: t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle, backgroundColor: t.c.bg }}>
        <Button block size="lg" icon="lock" loading={busy} onPress={place}>{`Place order · ${usd(total)}`}</Button>
        <Text variant="footnote" tone="subtle" align="center">You won’t be charged until your order ships.</Text>
      </View>

      <Sheet open={picking} onOpenChange={setPicking} title="Ship to">
        <RadioGroup
          variant="card"
          value={addressId}
          onValueChange={(id) => { setAddressId(id); setPicking(false); }}
          accessibilityLabel="Shipping address"
        >
          {addresses.map((a) => (
            <Radio key={a.id} value={a.id} label={a.label} description={`${a.name}\n${a.lines.join('\n')}`} />
          ))}
        </RadioGroup>
      </Sheet>

      <Toaster />
    </View>
  );
}

/** The confirmation mark: a soft success disc that springs in once when the order goes through. */
function SuccessMark() {
  const t = useSlate();
  const [on, setOn] = useState(false);
  useEffect(() => setOn(true), []);
  // Springs in when shown; a short fade instead under Reduce Motion.
  const p = useSharedValue(on ? 1 : 0);
  const bouncy = t.spring.bouncy, reduced = t.reducedMotion, fast = t.motion.duration.fast;
  useEffect(() => {
    p.value = reduced ? withTiming(on ? 1 : 0, { duration: fast }) : withSpring(on ? 1 : 0, bouncy);
  }, [on, reduced, fast, bouncy, p]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.6 + 0.4 * p.value }] }));
  return (
    <Animated.View
      style={[{ width: t.space[12], height: t.space[12], borderRadius: t.radius.full, backgroundColor: t.c.successSoft, alignItems: 'center', justifyContent: 'center' }, anim]}
    >
      <Icon name="check-circle" size={t.space[8]} color={t.c.success} accessibilityLabel="Success" />
    </Animated.View>
  );
}
