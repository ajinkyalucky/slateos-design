import { useState } from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Badge, BarChart, Button, Card, CardHeader, Carousel, DescriptionList, DonutChart, LineChart, Sparkline, Stat, Table,
  Text, Timeline, useSlate, type TableColumn,
} from '@ajinkyabhagwat/slateos-native';
import type { DemoPage } from './types';

const usd = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const days = Array.from({ length: 14 }, (_, i) => `Oct ${i + 16}`);
const weight = [78.4, 78.1, 78.3, 77.9, 77.6, 77.8, 77.4, 77.2, 77.5, 77.0, 76.8, 76.9, 76.5, 76.4];
const revenue = [42, 45, 44, 51, 55, 53, 58, 62, 60, 67, 71, 76];
const expenses = [38, 39, 41, 40, 43, 47, 45, 46, 49, 50, 52, 54];

export const pages: DemoPage[] = [
  {
    slug: 'stat',
    name: 'Stat',
    group: 'Data',
    description: 'A key number with its label, change and trend. Counts up once on mount unless Reduce Motion is on.',
    demos: [
      { title: 'Count up', render: () => <StatReplay />, code: `<Stat label="Active minutes" value={1284} delta="+12%" trend="up" caption="vs last week" size="lg" />` },
      {
        title: 'Dashboard row',
        render: () => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 24 }}>
            <Stat style={{ width: '50%' }} label="Revenue" value={48210} format={usd} delta="+8.2%" trend="up" />
            <Stat style={{ width: '50%' }} label="Churn" value={2.4} format={(n) => `${n.toFixed(1)}%`} delta="−0.3 pts" trend="down" invertTone />
            <Stat style={{ width: '50%' }} label="Resting heart rate" value={58} format={(n) => `${Math.round(n)} bpm`} delta="+3" trend="up" invertTone />
            <Stat style={{ width: '50%' }} label="Plan" value="Pro" caption="Renews Nov 12" />
          </View>
        ),
        code: `<Stat label="Revenue" value={48210} format={usd} delta="+8.2%" trend="up" />
<Stat label="Churn" value={2.4} format={(n) => \`\${n.toFixed(1)}%\`} delta="−0.3 pts" trend="down" invertTone />
<Stat label="Resting heart rate" value={58} format={(n) => \`\${Math.round(n)} bpm\`} delta="+3" trend="up" invertTone />
<Stat label="Plan" value="Pro" caption="Renews Nov 12" />`,
      },
      {
        title: 'With a sparkline',
        render: () => (
          <Stat label="Savings balance" value={12480} format={usd} delta="+$640" trend="up" caption="this month" sparkline={[11200, 11350, 11300, 11620, 11700, 11840, 11790, 12010, 12200, 12480]} />
        ),
        code: `<Stat
  label="Savings balance"
  value={12480}
  format={usd}
  delta="+$640"
  trend="up"
  caption="this month"
  sparkline={[11200, 11350, 11300, 11620, 11700, 11840, 11790, 12010, 12200, 12480]}
/>`,
      },
    ],
  },
  {
    slug: 'sparkline',
    name: 'Sparkline',
    group: 'Data',
    description: 'A tiny trend line with a soft fill and the latest point marked. For stats, rows and cells.',
    demos: [
      {
        title: 'In a list',
        render: () => <Watchlist />,
        code: `<Sparkline data={[182, 184, 181, 186, 189, 188, 192]} width={72} height={28} color={t.c.success} />`,
      },
      {
        title: 'Line only',
        render: () => (
          <View style={{ gap: 16 }}>
            <Sparkline data={[62, 64, 61, 59, 60, 58, 57, 58, 56]} area={false} />
            <Sparkline data={[3, 8, 5, 9, 12, 10, 14, 13, 17, 21]} area={false} showLast={false} height={48} />
          </View>
        ),
        code: `<Sparkline data={[62, 64, 61, 59, 60, 58, 57, 58, 56]} area={false} />
<Sparkline data={[3, 8, 5, 9, 12, 10, 14, 13, 17, 21]} area={false} showLast={false} height={48} />`,
      },
    ],
  },
  {
    slug: 'bar-chart',
    name: 'Bar chart',
    group: 'Data',
    description: 'Bars that grow in with a staggered spring. Tap or drag across them to read a value, with a tick of haptics.',
    demos: [
      { title: 'Tap or drag to read', render: () => <WeeklyBars />, code: `<BarChart
  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
  data={[32, 45, 28, 60, 52, 75, 40]}
  formatValue={(n) => \`\${n} min\`}
  onSelectedIndexChange={setDay}
  accessibilityLabel="Active minutes this week"
/>` },
      {
        title: 'Two series',
        render: () => (
          <BarChart
            labels={week}
            series={[
              { name: 'This week', data: [6.2, 0, 8.1, 5.0, 0, 12.4, 4.2] },
              { name: 'Last week', data: [5.0, 4.1, 0, 6.3, 0, 10.2, 0] },
            ]}
            formatValue={(n) => `${n} km`}
            accessibilityLabel="Distance run, this week and last"
          />
        ),
        code: `<BarChart
  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
  series={[
    { name: 'This week', data: [6.2, 0, 8.1, 5.0, 0, 12.4, 4.2] },
    { name: 'Last week', data: [5.0, 4.1, 0, 6.3, 0, 10.2, 0] },
  ]}
  formatValue={(n) => \`\${n} km\`}
/>`,
      },
      {
        title: 'A year of spending',
        render: () => (
          <BarChart labels={months.map((m) => m[0])} data={[1840, 1720, 1910, 2050, 1780, 2240, 2480, 2120, 1960, 1880, 2010, 2650]} formatValue={usd} height={96} accessibilityLabel="Monthly spending" />
        ),
        code: `<BarChart
  labels={['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']}
  data={[1840, 1720, 1910, 2050, 1780, 2240, 2480, 2120, 1960, 1880, 2010, 2650]}
  formatValue={usd}
  height={96}
/>`,
      },
    ],
  },
  {
    slug: 'line-chart',
    name: 'Line chart',
    group: 'Data',
    description: 'One or more trend lines. Drag across to scrub: a guide line, a dot per series and a live readout.',
    demos: [
      {
        title: 'Single series',
        render: () => <LineChart labels={days} data={weight} formatValue={(n) => `${n.toFixed(1)} kg`} accessibilityLabel="Body weight, last 14 days" />,
        code: `<LineChart
  labels={days}       // 'Oct 16' … 'Oct 29'
  data={weight}       // [78.4, 78.1, …, 76.4]
  formatValue={(n) => \`\${n.toFixed(1)} kg\`}
  accessibilityLabel="Body weight, last 14 days"
/>`,
      },
      {
        title: 'Two series',
        render: () => (
          <LineChart
            labels={months}
            series={[{ name: 'Revenue', data: revenue }, { name: 'Expenses', data: expenses }]}
            formatValue={(n) => `$${n}k`}
            accessibilityLabel="Revenue and expenses by month"
          />
        ),
        code: `<LineChart
  labels={months}
  series={[
    { name: 'Revenue', data: revenue },
    { name: 'Expenses', data: expenses },
  ]}
  formatValue={(n) => \`$\${n}k\`}
/>`,
      },
    ],
  },
  {
    slug: 'donut-chart',
    name: 'Donut chart',
    group: 'Data',
    description: 'Parts of a whole with the total in the middle. Tap a segment or a legend row to focus it.',
    demos: [
      {
        title: 'Spending by category',
        render: () => (
          <DonutChart
            totalLabel="October"
            formatValue={usd}
            segments={[
              { label: 'Rent', value: 1450 },
              { label: 'Groceries', value: 420 },
              { label: 'Dining out', value: 260 },
              { label: 'Transport', value: 140 },
              { label: 'Other', value: 190 },
            ]}
          />
        ),
        code: `<DonutChart
  totalLabel="October"
  formatValue={usd}
  segments={[
    { label: 'Rent', value: 1450 },
    { label: 'Groceries', value: 420 },
    { label: 'Dining out', value: 260 },
    { label: 'Transport', value: 140 },
    { label: 'Other', value: 190 },
  ]}
/>`,
      },
      {
        title: 'Compact, no legend',
        render: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <DonutChart size={96} thickness={10} legend={false} total={100} totalLabel="of goal" formatValue={(n) => `${Math.round(n)}%`} segments={[{ label: 'Done', value: 72 }]} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="headline">Weekly goal</Text>
              <Text variant="footnote" tone="muted">3 of 4 workouts done. One more by Sunday.</Text>
            </View>
          </View>
        ),
        code: `<DonutChart
  size={96}
  thickness={10}
  legend={false}
  total={100}
  totalLabel="of goal"
  formatValue={(n) => \`\${Math.round(n)}%\`}
  segments={[{ label: 'Done', value: 72 }]}
/>`,
      },
    ],
  },
  {
    slug: 'carousel',
    name: 'Carousel',
    group: 'Data',
    description: 'A snapping row of cards that peeks the next one, with dots that follow the scroll.',
    demos: [
      { title: 'Programs', render: () => <Programs />, code: `<Carousel
  data={programs}
  keyExtractor={(p) => p.title}
  onIndexChange={setIndex}
  renderItem={(p) => (
    <Card variant="filled">
      <CardHeader title={p.title} description={p.meta} action={<Badge tone="accent">{p.level}</Badge>} />
      <Text tone="muted">{p.body}</Text>
    </Card>
  )}
/>` },
      {
        title: 'Fixed width, no dots',
        render: () => (
          <Carousel
            style={{ marginHorizontal: -16 }}
            data={[{ k: 'Steps', v: '9,412' }, { k: 'Sleep', v: '7h 20m' }, { k: 'Water', v: '1.8 L' }, { k: 'Kcal', v: '486' }, { k: 'Stand', v: '10 h' }]}
            keyExtractor={(i) => i.k}
            itemWidth={120}
            dots={false}
            renderItem={(i) => (
              <Card variant="filled" padding={12}>
                <Text variant="footnote" tone="muted">{i.k}</Text>
                <Text variant="title3" tabular>{i.v}</Text>
              </Card>
            )}
          />
        ),
        code: `<Carousel
  data={today}
  itemWidth={120}
  dots={false}
  renderItem={(i) => (
    <Card variant="filled" padding={12}>
      <Text variant="footnote" tone="muted">{i.k}</Text>
      <Text variant="title3" tabular>{i.v}</Text>
    </Card>
  )}
/>`,
      },
    ],
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    group: 'Data',
    description: 'Events on a connecting line, for order tracking, activity feeds and history. The current step is highlighted.',
    demos: [
      {
        title: 'Order tracking',
        render: () => (
          <Timeline
            items={[
              { title: 'Order placed', time: 'Oct 26, 9:14 AM', description: 'Paid with Visa ending 4242' },
              { title: 'Packed', time: 'Oct 27, 2:40 PM' },
              { title: 'Out for delivery', time: 'Today, 8:05 AM', description: 'Arriving between 1 and 3 PM', status: 'current' },
              { title: 'Delivered', status: 'upcoming' },
            ]}
          />
        ),
        code: `<Timeline
  items={[
    { title: 'Order placed', time: 'Oct 26, 9:14 AM', description: 'Paid with Visa ending 4242' },
    { title: 'Packed', time: 'Oct 27, 2:40 PM' },
    { title: 'Out for delivery', time: 'Today, 8:05 AM', description: 'Arriving between 1 and 3 PM', status: 'current' },
    { title: 'Delivered', status: 'upcoming' },
  ]}
/>`,
      },
      {
        title: 'Activity with icons',
        render: () => (
          <Timeline
            items={[
              { icon: 'user-plus', title: 'Jordan joined the team', time: '2m' },
              { icon: 'check-circle', title: 'Priya completed “Mobility 101”', time: '1h', description: '12 sessions, 6 hours in total', status: 'current', children: <Badge tone="success" icon="star">New badge</Badge> },
              { icon: 'credit-card', title: 'Invoice #1042 paid', time: 'Yesterday', description: '$240.00 · Team plan' },
              { icon: 'calendar', title: 'Quarterly review', time: 'Nov 4', status: 'upcoming' },
            ]}
          />
        ),
        code: `<Timeline
  items={[
    { icon: 'user-plus', title: 'Jordan joined the team', time: '2m' },
    {
      icon: 'check-circle', title: 'Priya completed “Mobility 101”', time: '1h',
      description: '12 sessions, 6 hours in total', status: 'current',
      children: <Badge tone="success" icon="star">New badge</Badge>,
    },
    { icon: 'credit-card', title: 'Invoice #1042 paid', time: 'Yesterday', description: '$240.00 · Team plan' },
    { icon: 'calendar', title: 'Quarterly review', time: 'Nov 4', status: 'upcoming' },
  ]}
/>`,
      },
    ],
  },
  {
    slug: 'description-list',
    name: 'Description list',
    group: 'Data',
    description: 'Label and value rows for detail screens, with a copy button where people need the value elsewhere.',
    demos: [
      { title: 'Transaction', render: () => <Transaction />, code: `<DescriptionList
  onCopy={(text) => Clipboard.setStringAsync(text)}
  items={[
    { label: 'Amount', value: '$84.20' },
    { label: 'Status', value: <Badge tone="success">Paid</Badge> },
    { label: 'Date', value: 'Oct 28, 2026 · 6:12 PM' },
    { label: 'Merchant', value: 'Green Bowl Kitchen' },
    { label: 'Transaction ID', value: 'TX-8F2K-1193', mono: true, copyable: true },
  ]}
/>` },
      {
        title: 'Stacked',
        render: () => (
          <DescriptionList
            layout="stacked"
            items={[
              { label: 'Shipping address', value: '221 Baker Street, Apt 4B, Brooklyn, NY 11201' },
              { label: 'Delivery notes', value: 'Leave with the front desk if nobody answers.' },
            ]}
          />
        ),
        code: `<DescriptionList
  layout="stacked"
  items={[
    { label: 'Shipping address', value: '221 Baker Street, Apt 4B, Brooklyn, NY 11201' },
    { label: 'Delivery notes', value: 'Leave with the front desk if nobody answers.' },
  ]}
/>`,
      },
    ],
  },
  {
    slug: 'table',
    name: 'Table',
    group: 'Data',
    description: 'A compact table that scrolls sideways under a pinned first column. Tap a header to sort.',
    demos: [
      { title: 'Sortable, pinned first column', render: () => <Table columns={holdingColumns} data={holdings} keyExtractor={(h) => h.symbol} defaultSort={{ key: 'value', direction: 'desc' }} />, code: `const columns: TableColumn<Holding>[] = [
  { key: 'symbol', title: 'Holding', sortable: true, width: 96 },
  { key: 'price', title: 'Price', align: 'right', sortable: true, value: (h) => h.price, render: (h) => <Text tabular>{usd2(h.price)}</Text> },
  { key: 'change', title: 'Today', align: 'right', sortable: true, render: (h) => <Text tabular tone={h.change >= 0 ? 'success' : 'danger'}>{pct(h.change)}</Text> },
  { key: 'shares', title: 'Shares', align: 'right', sortable: true },
  { key: 'value', title: 'Value', align: 'right', sortable: true, width: 112, value: (h) => h.price * h.shares, render: (h) => <Text tabular weight="500">{usd(h.price * h.shares)}</Text> },
];

<Table columns={columns} data={holdings} keyExtractor={(h) => h.symbol} defaultSort={{ key: 'value', direction: 'desc' }} />` },
      {
        title: 'Striped, no pinning',
        render: () => <Table columns={leaderColumns} data={leaders} striped stickyFirstColumn={false} />,
        code: `<Table
  striped
  stickyFirstColumn={false}
  columns={[
    { key: 'rank', title: '#', width: 48 },
    { key: 'name', title: 'Athlete', width: 136 },
    { key: 'km', title: 'Km', align: 'right', sortable: true, width: 80 },
  ]}
  data={leaders}
/>`,
      },
    ],
  },
];

function StatReplay() {
  const [run, setRun] = useState(0);
  return (
    <View style={{ gap: 16, alignItems: 'flex-start' }}>
      <Stat key={run} label="Active minutes" value={1284} delta="+12%" trend="up" caption="vs last week" size="lg" />
      <Button size="sm" variant="secondary" icon="refresh" onPress={() => setRun((r) => r + 1)}>Replay</Button>
    </View>
  );
}

function Watchlist() {
  const t = useSlate();
  const rows = [
    { s: 'AAPL', name: 'Apple', p: '$192.40', c: '+1.8%', d: [182, 184, 181, 186, 189, 188, 192] },
    { s: 'NVDA', name: 'NVIDIA', p: '$131.10', c: '−2.4%', d: [140, 138, 139, 135, 136, 133, 131] },
    { s: 'VTI', name: 'Total Market', p: '$284.75', c: '+0.4%', d: [280, 281, 283, 282, 283, 284, 284.75] },
  ];
  return (
    <View>
      {rows.map((r, i) => {
        const up = !r.c.startsWith('−');
        return (
          <View key={r.s} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: t.component.rowHeight, borderTopWidth: i ? 1 : 0, borderTopColor: t.c.borderSubtle }}>
            <View style={{ flex: 1 }}>
              <Text variant="headline">{r.s}</Text>
              <Text variant="caption" tone="subtle">{r.name}</Text>
            </View>
            <Sparkline data={r.d} width={72} height={28} color={up ? t.c.success : t.c.danger} />
            <View style={{ alignItems: 'flex-end', minWidth: 72 }}>
              <Text variant="callout" weight="500" tabular>{r.p}</Text>
              <Text variant="caption" tone={up ? 'success' : 'danger'} tabular>{r.c}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function WeeklyBars() {
  const [day, setDay] = useState<number | null>(null);
  const data = [32, 45, 28, 60, 52, 75, 40];
  return (
    <View style={{ gap: 12 }}>
      <Text variant="footnote" tone="muted">
        {day == null ? `This week: ${data.reduce((a, b) => a + b, 0)} active minutes` : `${week[day]}: ${data[day]} active minutes`}
      </Text>
      <BarChart labels={week} data={data} formatValue={(n) => `${n} min`} onSelectedIndexChange={setDay} accessibilityLabel="Active minutes this week" />
    </View>
  );
}

const programs = [
  { title: 'Couch to 5K', meta: '8 weeks · 3 runs a week', level: 'Beginner', body: 'Walk-run intervals that build to 30 minutes of easy running.' },
  { title: 'Strength foundations', meta: '6 weeks · 3 sessions', level: 'All levels', body: 'Squat, hinge, push and pull with a barbell or dumbbells.' },
  { title: 'Half marathon', meta: '12 weeks · 4 runs a week', level: 'Intermediate', body: 'Long runs, tempo and recovery weeks to race 21.1 km.' },
  { title: 'Mobility daily', meta: '15 minutes · every day', level: 'Beginner', body: 'Hips, spine and shoulders, to undo a day at a desk.' },
];

function Programs() {
  const [index, setIndex] = useState(0);
  return (
    <View style={{ gap: 8 }}>
      <Carousel
        style={{ marginHorizontal: -16 }}
        data={programs}
        keyExtractor={(p) => p.title}
        onIndexChange={setIndex}
        renderItem={(p) => (
          <Card variant="filled" style={{ flex: 1 }}>
            <CardHeader title={p.title} description={p.meta} action={<Badge tone="accent">{p.level}</Badge>} />
            <Text tone="muted">{p.body}</Text>
          </Card>
        )}
      />
      <Text variant="caption" tone="subtle" align="center">{`${index + 1} of ${programs.length}: ${programs[index].title}`}</Text>
    </View>
  );
}

function Transaction() {
  return (
    <DescriptionList
      onCopy={(text) => Clipboard.setStringAsync(text)}
      items={[
        { label: 'Amount', value: '$84.20' },
        { label: 'Status', value: <Badge tone="success">Paid</Badge> },
        { label: 'Date', value: 'Oct 28, 2026 · 6:12 PM' },
        { label: 'Merchant', value: 'Green Bowl Kitchen' },
        { label: 'Transaction ID', value: 'TX-8F2K-1193', mono: true, copyable: true },
      ]}
    />
  );
}

type Holding = { symbol: string; price: number; change: number; shares: number };
const holdings: Holding[] = [
  { symbol: 'AAPL', price: 192.4, change: 1.8, shares: 24 },
  { symbol: 'MSFT', price: 418.2, change: 0.6, shares: 10 },
  { symbol: 'NVDA', price: 131.1, change: -2.4, shares: 40 },
  { symbol: 'VTI', price: 284.75, change: 0.4, shares: 32 },
  { symbol: 'TSLA', price: 248.5, change: -1.1, shares: 6 },
];
const usd2 = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}%`;
const holdingColumns: TableColumn<Holding>[] = [
  { key: 'symbol', title: 'Holding', sortable: true, width: 96 },
  { key: 'price', title: 'Price', align: 'right', sortable: true, render: (h) => <Text variant="callout" tabular>{usd2(h.price)}</Text> },
  { key: 'change', title: 'Today', align: 'right', sortable: true, render: (h) => <Text variant="callout" tabular tone={h.change >= 0 ? 'success' : 'danger'}>{pct(h.change)}</Text> },
  { key: 'shares', title: 'Shares', align: 'right', sortable: true },
  { key: 'value', title: 'Value', align: 'right', sortable: true, width: 112, value: (h) => h.price * h.shares, render: (h) => <Text variant="callout" tabular weight="500">{usd(h.price * h.shares)}</Text> },
];

type Leader = { rank: number; name: string; km: number };
const leaders: Leader[] = [
  { rank: 1, name: 'Ada Okafor', km: 182.4 },
  { rank: 2, name: 'Diego Alvarez', km: 171.0 },
  { rank: 3, name: 'Maya Patel', km: 158.6 },
  { rank: 4, name: 'Kenji Watanabe', km: 142.3 },
  { rank: 5, name: 'Lena Fischer', km: 139.9 },
];
const leaderColumns: TableColumn<Leader>[] = [
  { key: 'rank', title: '#', width: 48 },
  { key: 'name', title: 'Athlete', width: 136 },
  { key: 'km', title: 'Km', align: 'right', sortable: true, width: 80 },
];
