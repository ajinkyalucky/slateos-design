import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Card, Chip, DescriptionList, EmptyState, Header, Icon, IconButton, Input, Stepper, SwipeableRow, Text, Toaster,
  chartColor, mix, toast, useSlate, type IconName, type Theme,
} from '@ajinkyabhagwat/slateos-native';

export type CartItem = { id: string; name: string; variant: string; price: number; qty: number; icon: IconName; /** Chart colour index for the thumbnail tint. */ tint?: number };
export type PromoCode = { label: string; percentOff?: number; freeShipping?: boolean };

export type CartScreenProps = {
  items?: CartItem[];
  /** Codes the promo field accepts, keyed in upper case. */
  promoCodes?: Record<string, PromoCode>;
  /** Orders at or above this subtotal ship free. */
  freeShippingOver?: number;
  shippingCost?: number;
  taxRate?: number;
  onBack?: () => void;
  onContinueShopping?: () => void;
  onCheckout?: (total: number) => void;
};

const DEFAULT_ITEMS: CartItem[] = [
  { id: '1', name: 'Merino Crew Sweater', variant: 'Sage · M', price: 128, qty: 1, icon: 'layers', tint: 1 },
  { id: '3', name: 'Slim Card Wallet', variant: 'Charcoal', price: 48, qty: 2, icon: 'wallet', tint: 0 },
  { id: '4', name: 'Arc Desk Lamp', variant: 'Ochre', price: 89, qty: 1, icon: 'sun', tint: 2 },
];
const DEFAULT_CODES: Record<string, PromoCode> = {
  SAVE10: { label: '10% off', percentOff: 10 },
  FREESHIP: { label: 'Free shipping', freeShipping: true },
};

const usd = (n: number) => `$${n.toFixed(2)}`;
const tileColor = (t: Theme, i: number) => mix(t.c.bg, chartColor(t, i), t.scheme === 'dark' ? 0.24 : 0.14);

/** A shopping cart: line items with quantities, swipe to remove with undo, a promo code, the order summary and Checkout. */
export function CartScreen({
  items = DEFAULT_ITEMS,
  promoCodes = DEFAULT_CODES,
  freeShippingOver = 75,
  shippingCost = 6.95,
  taxRate = 0.08875,
  onBack,
  onContinueShopping,
  onCheckout,
}: CartScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState(items);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [applied, setApplied] = useState<{ code: string; promo: PromoCode } | null>(null);
  const pad = t.component.screenPadding;

  const setQty = (id: string, qty: number) => setList((l) => l.map((i) => (i.id === id ? { ...i, qty } : i)));
  const remove = (id: string) => {
    const index = list.findIndex((i) => i.id === id);
    const item = list[index];
    if (!item) return;
    setList((l) => l.filter((i) => i.id !== id));
    toast(`Removed ${item.name}`, {
      action: {
        label: 'Undo',
        onPress: () => setList((l) => (l.some((i) => i.id === id) ? l : [...l.slice(0, index), item, ...l.slice(index)])),
      },
    });
  };

  const apply = () => {
    const key = code.trim().toUpperCase();
    const promo = promoCodes[key];
    if (!key) return setCodeError('Enter a code first.');
    if (!promo) {
      t.haptic('error');
      return setCodeError(`“${key}” isn’t a valid code.`);
    }
    t.haptic('success');
    setApplied({ code: key, promo });
    setCode('');
    setCodeError(undefined);
    toast.success(`${key} applied`, { description: promo.label });
  };

  const count = list.reduce((n, i) => n + i.qty, 0);
  const subtotal = list.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = applied?.promo.percentOff ? Math.round(subtotal * applied.promo.percentOff) / 100 : 0;
  const shipping = subtotal >= freeShippingOver || applied?.promo.freeShipping ? 0 : shippingCost;
  const tax = Math.round((subtotal - discount) * taxRate * 100) / 100;
  const total = subtotal - discount + shipping + tax;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header title={count ? `Cart (${count})` : 'Cart'} leading={<IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />} />

      {list.length === 0 ? (
        <EmptyState
          icon="package"
          title="Your cart is empty"
          description="Things you add will show up here, ready for checkout."
          actions={<Button onPress={onContinueShopping ?? onBack}>Continue shopping</Button>}
          style={{ flex: 1 }}
        />
      ) : (
        <>
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: t.space[6], gap: t.space[5] }}>
            <View>
              {list.map((item, i) => (
                <SwipeableRow key={item.id} rightActions={[{ label: 'Remove', icon: 'trash', tone: 'danger', onPress: () => remove(item.id) }]}>
                  <View style={{ flexDirection: 'row', gap: t.space[3], paddingHorizontal: pad, paddingVertical: t.space[3], backgroundColor: t.c.bg }}>
                    <View
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={{ width: t.space[10], height: t.space[10], borderRadius: t.radius.lg, backgroundColor: tileColor(t, item.tint ?? i), alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name={item.icon} size={24} color={chartColor(t, item.tint ?? i)} />
                    </View>
                    <View style={{ flex: 1, gap: t.space[2] }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
                        <View style={{ flex: 1, gap: t.space['0_5'] }}>
                          <Text weight="500" numberOfLines={1}>{item.name}</Text>
                          <Text variant="footnote" tone="muted" numberOfLines={1}>{item.variant}</Text>
                        </View>
                        <Text variant="headline" tabular>{usd(item.price * item.qty)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stepper size="sm" value={item.qty} min={1} max={10} onValueChange={(q) => setQty(item.id, q)} accessibilityLabel={`Quantity of ${item.name}`} />
                        {item.qty > 1 && <Text variant="footnote" tone="subtle" tabular>{usd(item.price)} each</Text>}
                      </View>
                    </View>
                  </View>
                  {i < list.length - 1 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: pad + t.space[10] + t.space[3] }} />}
                </SwipeableRow>
              ))}
            </View>

            <View style={{ paddingHorizontal: pad, gap: t.space[5] }}>
              {applied ? (
                <View style={{ gap: t.space[2] }}>
                  <Text variant="label">Promo code</Text>
                  <Chip label={`${applied.code} · ${applied.promo.label}`} icon="tag" onRemove={() => setApplied(null)} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[2] }}>
                  <Input
                    placeholder="Promo code"
                    accessibilityLabel="Promo code"
                    icon="tag"
                    value={code}
                    onChangeText={(s) => { setCode(s); setCodeError(undefined); }}
                    error={codeError}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={apply}
                    style={{ flex: 1 }}
                  />
                  <Button variant="outline" disabled={!code.trim()} onPress={apply}>Apply</Button>
                </View>
              )}

              <Card>
                <Text variant="headline" accessibilityRole="header">Order summary</Text>
                <DescriptionList
                  items={[
                    { label: `Subtotal (${count} ${count === 1 ? 'item' : 'items'})`, value: usd(subtotal) },
                    { label: 'Shipping', value: shipping ? usd(shipping) : 'Free' },
                    ...(discount ? [{ label: `Discount (${applied?.code})`, value: <Text variant="callout" weight="500" tone="success" tabular>{`−${usd(discount)}`}</Text> }] : []),
                    { label: 'Estimated tax', value: usd(tax) },
                    { label: 'Total', value: <Text variant="headline" tabular>{usd(total)}</Text> },
                  ]}
                />
                {shipping > 0 && (
                  <Text variant="footnote" tone="muted">Add {usd(freeShippingOver - subtotal)} more for free shipping.</Text>
                )}
              </Card>
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: pad, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle, backgroundColor: t.c.bg }}>
            <Button block size="lg" iconRight="arrow-right" onPress={() => onCheckout?.(Math.round(total * 100) / 100)}>{`Checkout · ${usd(total)}`}</Button>
          </View>
        </>
      )}

      <Toaster />
    </View>
  );
}
