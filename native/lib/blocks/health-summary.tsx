import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart, Card, CardHeader, IconButton, ListRow, ListSection, Progress, ProgressRing, SegmentedControl, Stat, Text, useSlate,
  type IconName, type ProgressTone,
} from '@ajinkyabhagwat/slateos-native';

type Range = 'Day' | 'Week' | 'Month';

export type HealthWorkout = { id: string; icon: IconName; title: string; detail: string; time: string };

export type HealthSummaryScreenProps = {
  workouts?: HealthWorkout[];
  /** Called with a workout id, or with no id from the start button. */
  onOpenWorkout?: (id?: string) => void;
};

type Ring = { key: string; label: string; value: number; goal: number; unit: string; tone: ProgressTone };

// Sample numbers per range: replace with your own data. Week and month show daily averages.
const DATA: Record<Range, {
  title: string; average: boolean; rings: [number, number, number];
  steps: { labels: string[]; data: number[]; total: string; note: string };
  heart: { value: number; delta: string; trend: 'up' | 'down' | 'flat'; line: number[] };
  sleep: { value: string; delta: string; trend: 'up' | 'down' };
  water: { value: number; goal: number };
}> = {
  Day: {
    title: 'Today', average: false, rings: [452, 24, 9],
    steps: { labels: ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'], data: [0, 0, 820, 2140, 1630, 2410, 1980, 432], total: '9,412', note: 'steps so far' },
    heart: { value: 64, delta: '−2 bpm', trend: 'down', line: [62, 61, 66, 72, 68, 70, 65, 64] },
    sleep: { value: '7h 12m', delta: '+24m', trend: 'up' },
    water: { value: 1.6, goal: 2.5 },
  },
  Week: {
    title: 'This week', average: true, rings: [538, 31, 11],
    steps: { labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], data: [8210, 10340, 7680, 11920, 9412, 13780, 6120], total: '9,637', note: 'steps a day on average' },
    heart: { value: 62, delta: '−1 bpm', trend: 'down', line: [65, 63, 64, 62, 61, 62, 62] },
    sleep: { value: '6h 54m', delta: '−8m', trend: 'down' },
    water: { value: 2.1, goal: 2.5 },
  },
  Month: {
    title: 'This month', average: true, rings: [501, 28, 10],
    steps: { labels: ['W1', 'W2', 'W3', 'W4'], data: [8840, 9210, 9637, 8970], total: '9,164', note: 'steps a day on average' },
    heart: { value: 63, delta: '−3 bpm', trend: 'down', line: [66, 65, 64, 63] },
    sleep: { value: '7h 03m', delta: '+11m', trend: 'up' },
    water: { value: 2.0, goal: 2.5 },
  },
};

const DEFAULT_WORKOUTS: HealthWorkout[] = [
  { id: 'run-1029', icon: 'activity', title: 'Outdoor run', detail: '5.21 km · 28:14 · 152 bpm avg', time: '7:12 AM' },
  { id: 'strength-1028', icon: 'zap', title: 'Strength', detail: '42 min · 318 kcal', time: 'Yesterday' },
];

const steps = (n: number) => Math.round(n).toLocaleString('en-US');

/** Today's health at a glance: activity rings, steps by hour or day, heart rate, sleep and water. */
export function HealthSummaryScreen({ workouts = DEFAULT_WORKOUTS, onOpenWorkout }: HealthSummaryScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<Range>('Day');
  const d = DATA[range];
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const rings: Ring[] = [
    { key: 'move', label: 'Move', value: d.rings[0], goal: 600, unit: 'kcal', tone: 'danger' },
    { key: 'exercise', label: 'Exercise', value: d.rings[1], goal: 30, unit: 'min', tone: 'success' },
    { key: 'stand', label: 'Stand', value: d.rings[2], goal: 12, unit: 'hr', tone: 'accent' },
  ];
  const ringColor = (tone: ProgressTone) => (tone === 'accent' ? t.c.accentSolid : t.c[`${tone}Solid`]);
  // Concentric rings: lg, md and sm sizes nest with a small gap between them.
  const ringSizes = ['lg', 'md', 'sm'] as const;
  const outer = t.space[10];

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingTop: insets.top + t.space[2], paddingBottom: insets.bottom + t.space[10], gap: t.space[5] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ gap: t.space[1] }}>
            <Text variant="footnote" tone="muted">{date}</Text>
            <Text variant="title1" accessibilityRole="header">{d.title}</Text>
          </View>
          <IconButton icon="play" variant="soft" round accessibilityLabel="Start a workout" onPress={() => onOpenWorkout?.()} />
        </View>

        <SegmentedControl options={['Day', 'Week', 'Month'] as const} value={range} onValueChange={setRange} />

        <Card>
          <CardHeader title="Activity" description={d.average ? 'Daily average' : 'Closes at midnight'} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[5] }}>
            <View style={{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }}>
              {rings.map((r, i) => (
                <ProgressRing
                  key={r.key}
                  value={r.value}
                  max={r.goal}
                  size={ringSizes[i]}
                  tone={r.tone}
                  accessibilityLabel={`${r.label}: ${r.value} of ${r.goal} ${r.unit}`}
                  style={{ position: 'absolute' }}
                />
              ))}
            </View>
            <View style={{ flex: 1, gap: t.space[2] }}>
              {rings.map((r) => (
                <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: ringColor(r.tone) }} />
                  <Text variant="callout" tone="muted" style={{ flex: 1 }}>{r.label}</Text>
                  <Text variant="callout" weight="600" tabular>{r.value}</Text>
                  <Text variant="callout" tone="subtle" tabular>/ {r.goal} {r.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <Card>
          <CardHeader title="Steps" description={`${d.steps.total} ${d.steps.note}`} />
          <BarChart
            key={range}
            labels={d.steps.labels}
            data={d.steps.data}
            formatValue={steps}
            accessibilityLabel={`Steps by ${range === 'Day' ? 'hour' : range === 'Week' ? 'day' : 'week'}`}
          />
        </Card>

        <Card>
          <Stat
            key={`hr-${range}`}
            label="Resting heart rate"
            value={d.heart.value}
            format={(n) => `${Math.round(n)} bpm`}
            delta={d.heart.delta}
            trend={d.heart.trend}
            invertTone
            caption={range === 'Day' ? 'vs yesterday' : `vs last ${range.toLowerCase()}`}
            sparkline={d.heart.line}
          />
        </Card>

        <View style={{ flexDirection: 'row', gap: t.space[3] }}>
          <Card style={{ flex: 1 }}>
            <Stat key={`s-${range}`} label="Sleep" value={d.sleep.value} delta={d.sleep.delta} trend={d.sleep.trend} />
          </Card>
          <Card style={{ flex: 1 }}>
            <Stat key={`w-${range}`} label="Water" value={d.water.value} format={(n) => `${n.toFixed(1)} L`} caption={`of ${d.water.goal.toFixed(1)} L`} />
            <Progress value={d.water.value} max={d.water.goal} accessibilityLabel="Water goal" />
          </Card>
        </View>

        <ListSection header="Workouts">
          {workouts.map((w) => (
            <ListRow
              key={w.id}
              icon={w.icon}
              iconTint={t.c.successSolid}
              title={w.title}
              subtitle={w.detail}
              detail={w.time}
              onPress={() => onOpenWorkout?.(w.id)}
            />
          ))}
        </ListSection>
      </ScrollView>
    </View>
  );
}
