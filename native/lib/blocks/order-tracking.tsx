import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar, Badge, Button, Card, Header, Icon, IconButton, Progress, Separator, Text, Timeline, useSlate,
  type IconName, type TimelineItem,
} from '@ajinkyabhagwat/slateos-native';

export type OrderStage = 'ordered' | 'packed' | 'shipped' | 'out' | 'delivered';

export type OrderLine = { id: string; name: string; detail: string; quantity: number; price: number; icon: IconName };

export type OrderEvent = { stage: OrderStage; time: string; description?: string };

export type Order = {
  number: string;
  stage: OrderStage;
  /** Shown big in the hero, e.g. "2:40 – 3:10 PM". */
  eta: string;
  etaNote: string;
  address: string;
  courier: { name: string; vehicle: string; rating: string };
  events: OrderEvent[];
  lines: OrderLine[];
  delivery: number;
};

export type OrderTrackingScreenProps = {
  order?: Order;
  onBack?: () => void;
  onContact?: (method: 'call' | 'message') => void;
  onHelp?: () => void;
};

const STAGES: { stage: OrderStage; title: string; icon: IconName }[] = [
  { stage: 'ordered', title: 'Order placed', icon: 'receipt' },
  { stage: 'packed', title: 'Packed', icon: 'package' },
  { stage: 'shipped', title: 'Shipped', icon: 'truck' },
  { stage: 'out', title: 'Out for delivery', icon: 'map-pin' },
  { stage: 'delivered', title: 'Delivered', icon: 'home' },
];

const DEFAULT_ORDER: Order = {
  number: '4821',
  stage: 'out',
  eta: '2:40 – 3:10 PM',
  etaNote: 'Arriving today · 6 stops away',
  address: '214 Bergen St, Apt 3, Brooklyn',
  courier: { name: 'Marcus Bell', vehicle: 'White Ford Transit · KJ 4821', rating: '4.9' },
  events: [
    { stage: 'ordered', time: 'Mon 9:12 AM', description: 'Paid with Visa ••42' },
    { stage: 'packed', time: 'Mon 4:30 PM', description: 'Packed at the Newark warehouse' },
    { stage: 'shipped', time: 'Tue 7:05 AM', description: 'Handed to Kestrel Logistics' },
    { stage: 'out', time: '11:48 AM', description: 'On the van with Marcus' },
    { stage: 'delivered', time: 'By 3:10 PM' },
  ],
  lines: [
    { id: '1', name: 'Linen duvet cover', detail: 'Queen · Oat', quantity: 1, price: 129, icon: 'layers' },
    { id: '2', name: 'Pillowcases', detail: 'Set of 2 · Oat', quantity: 2, price: 38, icon: 'layers' },
    { id: '3', name: 'Ceramic mug', detail: 'Speckled white', quantity: 4, price: 16, icon: 'package' },
  ],
  delivery: 0,
};

const usd = (n: number) => (n === 0 ? 'Free' : `$${n.toFixed(2)}`);

/** Where an order is: arrival time and progress, the courier, every step so far, and what is in the box. */
export function OrderTrackingScreen({ order = DEFAULT_ORDER, onBack, onContact, onHelp }: OrderTrackingScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const at = STAGES.findIndex((s) => s.stage === order.stage);
  const delivered = order.stage === 'delivered';
  const subtotal = order.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const timeline: TimelineItem[] = STAGES.map((s, i) => {
    const e = order.events.find((ev) => ev.stage === s.stage);
    return {
      title: s.title,
      icon: s.icon,
      time: e?.time,
      description: e?.description,
      status: i < at || (delivered && i === at) ? 'done' : i === at ? 'current' : 'upcoming',
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header
        title={`Order #${order.number}`}
        leading={<IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />}
        trailing={<IconButton icon="help-circle" accessibilityLabel="Help with this order" onPress={onHelp} />}
      />
      <ScrollView contentContainerStyle={{ padding: t.component.screenPadding, paddingBottom: insets.bottom + t.space[10], gap: t.space[5] }}>
        <View style={{ gap: t.space[3] }}>
          <Badge tone={delivered ? 'success' : 'accent'} dot style={{ alignSelf: 'flex-start' }}>{STAGES[at]?.title ?? ''}</Badge>
          <View style={{ gap: t.space[1] }}>
            <Text variant="footnote" tone="muted">{delivered ? 'Delivered' : 'Estimated arrival'}</Text>
            <Text variant="title1" tabular accessibilityRole="header">{order.eta}</Text>
            <Text tone="muted">{order.etaNote}</Text>
          </View>
          <Progress value={at + (delivered ? 1 : 0.5)} max={STAGES.length} size="md" tone={delivered ? 'success' : 'accent'} accessibilityLabel="Delivery progress" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="subtle">Ordered</Text>
            <Text variant="caption" tone="subtle" tabular>Step {at + 1} of {STAGES.length}</Text>
            <Text variant="caption" tone="subtle">Delivered</Text>
          </View>
        </View>

        {!delivered && (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
              <Avatar name={order.courier.name} size="lg" />
              <View style={{ flex: 1, gap: t.space['0_5'] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
                  <Text variant="headline" numberOfLines={1}>{order.courier.name}</Text>
                  <Icon name="star" size={16} color={t.c.warningSolid} accessibilityLabel="Rating" />
                  <Text variant="footnote" tone="muted" tabular>{order.courier.rating}</Text>
                </View>
                <Text variant="footnote" tone="muted" numberOfLines={1}>{order.courier.vehicle}</Text>
              </View>
              <IconButton icon="message-square" variant="soft" round accessibilityLabel={`Message ${order.courier.name}`} onPress={() => onContact?.('message')} />
              <IconButton icon="phone" variant="soft" round accessibilityLabel={`Call ${order.courier.name}`} onPress={() => onContact?.('call')} />
            </View>
            <Separator />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
              <Icon name="map-pin" size={16} color={t.c.textSubtle} />
              <Text variant="footnote" tone="muted" numberOfLines={1} style={{ flex: 1 }}>{order.address}</Text>
            </View>
          </Card>
        )}

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">Progress</Text>
          <Timeline items={timeline} />
        </View>

        <View style={{ gap: t.space[3] }}>
          <Text variant="headline" accessibilityRole="header">In this order</Text>
          <Card padding={0}>
            <View>
              {order.lines.map((l, i) => (
                <View key={l.id}>
                  <View
                    accessible
                    accessibilityLabel={`${l.name}, ${l.detail}, quantity ${l.quantity}, ${usd(l.price * l.quantity)}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[4] }}
                  >
                    <View style={{ width: t.size.controlXl, height: t.size.controlXl, borderRadius: t.radius.lg, backgroundColor: t.c.surfaceHover, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={l.icon} size={20} color={t.c.textMuted} />
                    </View>
                    <View style={{ flex: 1, gap: t.space['0_5'] }}>
                      <Text weight="500" numberOfLines={1}>{l.name}</Text>
                      <Text variant="footnote" tone="muted" numberOfLines={1}>{l.detail} · Qty {l.quantity}</Text>
                    </View>
                    <Text tabular>{usd(l.price * l.quantity)}</Text>
                  </View>
                  <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: i < order.lines.length - 1 ? t.space[4] + t.size.controlXl + t.space[3] : 0 }} />
                </View>
              ))}
              <View style={{ padding: t.space[4], gap: t.space[2] }}>
                {[
                  { label: 'Subtotal', value: usd(subtotal) },
                  { label: 'Delivery', value: usd(order.delivery) },
                ].map((r) => (
                  <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="callout" tone="muted">{r.label}</Text>
                    <Text variant="callout" tone="muted" tabular>{r.value}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text weight="600">Total</Text>
                  <Text weight="600" tabular>{usd(subtotal + order.delivery)}</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        <Button variant="outline" icon="help-circle" block onPress={onHelp}>Get help with this order</Button>
      </ScrollView>
    </View>
  );
}
