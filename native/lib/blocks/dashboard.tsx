import { useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  Avatar, BarChart, Card, CardHeader, Header, IconButton, ListRow, ListSection, SegmentedControl, Stat, Text,
  useCollapsingHeader, useSlate, type IconName,
} from '@ajinkyabhagwat/slateos-native';

type Range = 'Week' | 'Month' | 'Year';

export type DashboardActivity = { id: string; icon: IconName; title: string; subtitle: string; amount: string; positive?: boolean };

export type DashboardScreenProps = {
  name?: string;
  activity?: DashboardActivity[];
  onOpenActivity?: (id: string) => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
};

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

// Sample numbers per range: replace with your own data.
const DATA: Record<Range, { labels: string[]; revenue: number[]; total: number; delta: string; orders: number; ordersDelta: string }> = {
  Week: { labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], revenue: [1820, 2140, 1960, 2480, 2710, 3120, 2290], total: 16520, delta: '+12.4%', orders: 214, ordersDelta: '+8%' },
  Month: { labels: ['W1', 'W2', 'W3', 'W4'], revenue: [14200, 15880, 16520, 17940], total: 64540, delta: '+6.1%', orders: 872, ordersDelta: '+4%' },
  Year: { labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], revenue: [48, 52, 55, 51, 60, 64, 70, 68, 72, 75, 79, 86].map((k) => k * 1000), total: 780000, delta: '+18.9%', orders: 10240, ordersDelta: '+15%' },
};

const DEFAULT_ACTIVITY: DashboardActivity[] = [
  { id: '1', icon: 'credit-card', title: 'Payout to Chase ••42', subtitle: 'Today, 9:14 AM', amount: '−$4,200' },
  { id: '2', icon: 'package', title: 'Order #4821', subtitle: 'Kestrel Logistics · 2 items', amount: '+$312.40', positive: true },
  { id: '3', icon: 'user-plus', title: 'New customer', subtitle: 'Halvorsen Marine', amount: '+$89.00', positive: true },
  { id: '4', icon: 'receipt', title: 'Refund #4790', subtitle: 'Yesterday, 4:02 PM', amount: '−$48.00' },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** A home dashboard: a collapsing title, key numbers for a range, a chart and recent activity. */
export function DashboardScreen({ name = 'Maya Patel', activity = DEFAULT_ACTIVITY, onOpenActivity, onOpenProfile, onOpenNotifications }: DashboardScreenProps) {
  const t = useSlate();
  const header = useCollapsingHeader();
  const [range, setRange] = useState<Range>('Week');
  const d = DATA[range];

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header
        title="Overview"
        collapse={header}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton icon="bell" accessibilityLabel="Notifications" onPress={onOpenNotifications} />
            <IconButton icon="user" accessibilityLabel="Profile" onPress={onOpenProfile} />
          </View>
        }
      />
      <Animated.ScrollView
        onScroll={header.onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingBottom: t.space[10], gap: t.space[5] }}
      >
        <View style={{ gap: t.space[1] }}>
          <Text variant="footnote" tone="muted">{greeting()}, {name.split(' ')[0]}</Text>
          <Header.LargeTitle collapse={header}>Overview</Header.LargeTitle>
        </View>

        <SegmentedControl options={['Week', 'Month', 'Year'] as const} value={range} onValueChange={setRange} />

        <View style={{ flexDirection: 'row', gap: t.space[3] }}>
          <Card style={{ flex: 1 }}>
            <Stat key={`r-${range}`} label="Revenue" value={d.total} format={usd} delta={d.delta} trend="up" />
          </Card>
          <Card style={{ flex: 1 }}>
            <Stat key={`o-${range}`} label="Orders" value={d.orders} delta={d.ordersDelta} trend="up" />
          </Card>
        </View>

        <Card>
          <CardHeader title="Revenue" description={`${usd(d.total)} this ${range.toLowerCase()}`} action={<Avatar size="sm" name={name} />} />
          <BarChart key={range} labels={d.labels} data={d.revenue} formatValue={usd} accessibilityLabel={`Revenue by ${range === 'Week' ? 'day' : range === 'Month' ? 'week' : 'month'}`} />
        </Card>

        <ListSection header="Recent activity">
          {activity.map((a) => (
            <ListRow
              key={a.id}
              icon={a.icon}
              iconTint={a.positive ? t.c.successSolid : t.c.textSubtle}
              title={a.title}
              subtitle={a.subtitle}
              accessory={<Text tabular tone={a.positive ? 'success' : 'default'}>{a.amount}</Text>}
              onPress={onOpenActivity ? () => onOpenActivity(a.id) : undefined}
            />
          ))}
        </ListSection>
      </Animated.ScrollView>
    </View>
  );
}
