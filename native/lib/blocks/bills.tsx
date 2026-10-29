import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Badge, Button, Card, EmptyState, Header, Icon, IconButton, ListRow, ListSection, SegmentedControl, Stat, Text, Touchable,
  useCollapsingHeader, useSlate, type BadgeTone, type IconName,
} from '@ajinkyabhagwat/slateos-native';

type Tint = 'chart1' | 'chart2' | 'chart3' | 'chart4' | 'chart5' | 'chart6';

export type Bill = { id: string; name: string; icon: IconName; tint: Tint; amount: number; due: Date; autopay?: boolean };
export type BillPayment = { id: string; name: string; icon: IconName; tint: Tint; amount: number; paidOn: Date; from: string };

export type BillsScreenProps = {
  bills?: Bill[];
  payments?: BillPayment[];
  /** Pay a bill. Resolve when it is paid and it moves to Paid; throw to leave it unpaid. */
  onPay?: (billId: string) => Promise<void> | void;
  onOpenBill?: (billId: string) => void;
  onAutopayChange?: (billId: string, on: boolean) => void;
  onAddBiller?: () => void;
};

type Segment = 'Upcoming' | 'Paid';

const DAY = 86_400_000;
const inDays = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const daysFromToday = (d: Date) => Math.round((d.getTime() - inDays(0).getTime()) / DAY);
const usd = (n: number) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Sample bills, dated relative to today: replace with your own data.
const DEFAULT_BILLS: Bill[] = [
  { id: 'water', name: 'City Water', icon: 'activity', tint: 'chart1', amount: 46.2, due: inDays(-2) },
  { id: 'electric', name: 'ConEd Electric', icon: 'zap', tint: 'chart4', amount: 128.74, due: inDays(3) },
  { id: 'card', name: 'Sapphire Visa', icon: 'credit-card', tint: 'chart2', amount: 482.16, due: inDays(6), autopay: true },
  { id: 'internet', name: 'Spectrum Internet', icon: 'wifi', tint: 'chart5', amount: 79.99, due: inDays(11) },
  { id: 'phone', name: 'Verizon Wireless', icon: 'phone', tint: 'chart3', amount: 65, due: inDays(17), autopay: true },
  { id: 'rent', name: 'Rent · Greenpoint Lofts', icon: 'home', tint: 'chart6', amount: 2350, due: inDays(26) },
];
const DEFAULT_PAYMENTS: BillPayment[] = [
  { id: 'p1', name: 'Rent · Greenpoint Lofts', icon: 'home', tint: 'chart6', amount: 2350, paidOn: inDays(-4), from: 'Checking ••4821' },
  { id: 'p2', name: 'Geico Auto', icon: 'shield', tint: 'chart3', amount: 112.5, paidOn: inDays(-9), from: 'Checking ••4821' },
  { id: 'p3', name: 'Sapphire Visa', icon: 'credit-card', tint: 'chart2', amount: 615.3, paidOn: inDays(-24), from: 'Autopay · Checking ••4821' },
  { id: 'p4', name: 'ConEd Electric', icon: 'zap', tint: 'chart4', amount: 141.08, paidOn: inDays(-27), from: 'Savings ••0937' },
];

function dueBadge(bill: Bill): { tone: BadgeTone; label: string } {
  const n = daysFromToday(bill.due);
  if (n < 0) return { tone: 'danger', label: n === -1 ? 'Overdue 1 day' : `Overdue ${-n} days` };
  if (n === 0) return { tone: 'warning', label: 'Due today' };
  if (n <= 3) return { tone: 'warning', label: n === 1 ? 'Due tomorrow' : `Due in ${n} days` };
  return { tone: 'neutral', label: `Due ${short(bill.due)}` };
}

/** A bill payment home: what is due in the next 30 days, upcoming bills with Pay, autopay switches and payment history. */
export function BillsScreen({
  bills = DEFAULT_BILLS,
  payments = DEFAULT_PAYMENTS,
  onPay,
  onOpenBill,
  onAutopayChange,
  onAddBiller,
}: BillsScreenProps) {
  const t = useSlate();
  const header = useCollapsingHeader();
  const [view, setView] = useState<Segment>('Upcoming');
  const [upcoming, setUpcoming] = useState(bills);
  const [paid, setPaid] = useState(payments);
  const [paying, setPaying] = useState<string | null>(null);

  const due = useMemo(() => upcoming.filter((b) => daysFromToday(b.due) <= 30), [upcoming]);
  const total = due.reduce((s, b) => s + b.amount, 0);
  const overdue = due.filter((b) => daysFromToday(b.due) < 0);
  const paidThisMonth = paid.filter((p) => daysFromToday(p.paidOn) > -30).reduce((s, p) => s + p.amount, 0);

  const pay = async (bill: Bill) => {
    setPaying(bill.id);
    try {
      await onPay?.(bill.id);
      setUpcoming((l) => l.filter((b) => b.id !== bill.id));
      setPaid((l) => [{ id: `paid-${bill.id}`, name: bill.name, icon: bill.icon, tint: bill.tint, amount: bill.amount, paidOn: inDays(0), from: 'Checking ••4821' }, ...l]);
      t.haptic('success');
    } catch {
      t.haptic('error');
    } finally {
      setPaying(null);
    }
  };

  const setAutopay = (id: string, on: boolean) => {
    setUpcoming((l) => l.map((b) => (b.id === id ? { ...b, autopay: on } : b)));
    onAutopayChange?.(id, on);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header
        title="Bills"
        collapse={header}
        trailing={<IconButton icon="plus" accessibilityLabel="Add a biller" onPress={onAddBiller} />}
      />
      <Animated.ScrollView
        onScroll={header.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingBottom: t.space[10], gap: t.space[5] }}
      >
        <Header.LargeTitle collapse={header}>Bills</Header.LargeTitle>

        <Card>
          <Stat
            size="lg"
            label="Due in the next 30 days"
            value={total}
            format={usd}
            caption={
              due.length === 0
                ? 'You’re all paid up.'
                : `${due.length} ${due.length === 1 ? 'bill' : 'bills'}${overdue.length ? ` · ${overdue.length} overdue` : ''}`
            }
          />
        </Card>

        <SegmentedControl options={['Upcoming', 'Paid'] as const} value={view} onValueChange={setView} />

        {view === 'Upcoming' ? (
          upcoming.length === 0 ? (
            <EmptyState
              icon="check-circle"
              title="All paid up"
              description="New bills show up here as soon as your billers send them."
              actions={<Button variant="outline" icon="plus" onPress={onAddBiller}>Add a biller</Button>}
            />
          ) : (
            <>
              <View style={{ gap: t.space[2] }}>
                <Text variant="overline" tone="subtle" accessibilityRole="header">Upcoming</Text>
                <Card padding={0}>
                  {upcoming.map((bill, i) => (
                    <BillRow
                      key={bill.id}
                      bill={bill}
                      first={i === 0}
                      paying={paying === bill.id}
                      onPay={() => pay(bill)}
                      onOpen={onOpenBill ? () => onOpenBill(bill.id) : undefined}
                    />
                  ))}
                </Card>
              </View>

              <ListSection header="Autopay" footer="Autopay pays the statement balance from Checking ••4821 on the due date.">
                {upcoming.map((bill) => (
                  <ListRow
                    key={bill.id}
                    icon={bill.icon}
                    iconTint={t.c[bill.tint]}
                    title={bill.name}
                    subtitle={bill.autopay ? `Pays ${short(bill.due)}` : 'Off'}
                    accessory="switch"
                    checked={!!bill.autopay}
                    onCheckedChange={(on) => setAutopay(bill.id, on)}
                  />
                ))}
              </ListSection>
            </>
          )
        ) : (
          <>
            <Card>
              <Stat label="Paid in the last 30 days" value={paidThisMonth} format={usd} caption={`${paid.length} payments`} />
            </Card>
            <ListSection header="Recent payments">
              {paid.map((p) => (
                <ListRow
                  key={p.id}
                  icon={p.icon}
                  iconTint={t.c[p.tint]}
                  title={p.name}
                  subtitle={`${daysFromToday(p.paidOn) === 0 ? 'Today' : short(p.paidOn)} · ${p.from}`}
                  accessory={<Text tabular>{usd(p.amount)}</Text>}
                />
              ))}
            </ListSection>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

type BillRowProps = { bill: Bill; first: boolean; paying: boolean; onPay: () => void; onOpen?: () => void };

function BillRow({ bill, first, paying, onPay, onOpen }: BillRowProps) {
  const t = useSlate();
  const badge = dueBadge(bill);

  return (
    <View style={!first ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.c.border } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingRight: t.space[4] }}>
        <Touchable
          onPress={onOpen}
          disabled={!onOpen}
          pressScale={1}
          pressOpacity={0.6}
          accessibilityRole={onOpen ? 'button' : undefined}
          accessibilityLabel={`${bill.name}, ${usd(bill.amount)}, ${badge.label}${bill.autopay ? ', autopay on' : ''}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingVertical: t.space[3], paddingLeft: t.space[4] }}
        >
          <View style={{ width: t.size.tile, height: t.size.tile, borderRadius: t.radius.lg, backgroundColor: t.c[bill.tint], alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={bill.icon} size={20} color={t.c.onSolid} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1, gap: t.space[1] }}>
            <Text variant="label" numberOfLines={1}>{bill.name}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.space['1_5'] }}>
              <Badge size="sm" tone={badge.tone}>{badge.label}</Badge>
              {bill.autopay && <Badge size="sm" tone="info" icon="refresh">Autopay</Badge>}
            </View>
          </View>
          <Text variant="headline" tabular>{usd(bill.amount)}</Text>
        </Touchable>
        <Button size="sm" variant={badge.tone === 'danger' ? 'solid' : 'soft'} loading={paying} onPress={onPay} accessibilityLabel={`Pay ${bill.name} ${usd(bill.amount)}`} style={{ alignSelf: 'center' }}>
          Pay
        </Button>
      </View>
    </View>
  );
}
