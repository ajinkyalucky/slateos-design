import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertDialog, Badge, Button, Card, Header, Icon, IconButton, ListRow, ListSection, Stat, Text, useSlate, type IconName,
} from '@ajinkyabhagwat/slateos-native';

export type WorkoutSummary = {
  /** Seconds. */
  duration: number;
  distanceKm: number;
  calories: number;
  avgHeartRate: number;
  /** Seconds per km. */
  avgPace: number;
  /** Each lap's length in seconds. */
  laps: number[];
};

export type WorkoutScreenProps = {
  title?: string;
  /** Seconds already on the clock when the screen opens. */
  initialElapsed?: number;
  /** Called once, when the person confirms Finish. */
  onFinish?: (summary: WorkoutSummary) => void;
  onBack?: () => void;
};

// A simulated run so the screen is alive out of the box: swap these for your sensor readings.
const distanceAt = (s: number) => s / 342 + 0.03 * Math.sin(s / 97);
const heartAt = (s: number) => Math.round(96 + (50 + 6 * Math.sin(s / 41) + 3 * Math.sin(s / 7)) * Math.min(1, s / 240));
const caloriesAt = (s: number) => s * 0.205;

// The moments the run passed each whole kilometre: the default splits.
function kmMarks(until: number) {
  const marks: number[] = [];
  for (let k = 1; k <= Math.floor(distanceAt(until)); k++) {
    let lo = 0, hi = until;
    while (hi - lo > 0.5) { const mid = (lo + hi) / 2; if (distanceAt(mid) < k) lo = mid; else hi = mid; }
    marks.push(Math.round(hi));
  }
  return marks;
}

const clock = (sec: number) => {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`;
};
const pace = (secPerKm: number) => (Number.isFinite(secPerKm) && secPerKm > 0 ? `${clock(secPerKm).replace(/^0/, '')}` : '–:––');

/** An active workout: a ticking timer, live stats, splits, pause and resume, and a summary after Finish. */
export function WorkoutScreen({ title = 'Outdoor run', initialElapsed = 1094, onFinish, onBack }: WorkoutScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [banked, setBanked] = useState(initialElapsed * 1000);
  const [since, setSince] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [laps, setLaps] = useState(() => kmMarks(initialElapsed));
  const [confirm, setConfirm] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const running = since !== null && !summary;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = (banked + (since !== null ? Math.max(0, now - since) : 0)) / 1000;
  const km = distanceAt(elapsed);

  const pause = () => {
    const n = Date.now();
    if (since !== null) setBanked((b) => b + (n - since));
    setSince(null);
    setNow(n);
  };
  const resume = () => { const n = Date.now(); setSince(n); setNow(n); };
  const lap = () => setLaps((l) => [...l, elapsed]);

  const finish = () => {
    const samples = Array.from({ length: Math.max(1, Math.floor(elapsed / 5)) }, (_, i) => heartAt(i * 5));
    const marks = [...laps, elapsed];
    const s: WorkoutSummary = {
      duration: Math.round(elapsed),
      distanceKm: Math.round(km * 100) / 100,
      calories: Math.round(caloriesAt(elapsed)),
      avgHeartRate: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
      avgPace: Math.round(elapsed / Math.max(0.01, km)),
      laps: marks.map((m, i) => Math.round(m - (marks[i - 1] ?? 0))),
    };
    setLaps(marks);
    setSummary(s);
    t.haptic('success');
    onFinish?.(s);
  };

  // Newest first, with the lap in progress on top while the workout runs.
  const splits = [...laps, ...(summary ? [] : [elapsed])]
    .map((end, i, all) => {
      const start = all[i - 1] ?? 0;
      const dist = distanceAt(end) - distanceAt(start);
      return { n: i + 1, time: end - start, dist, current: !summary && i === all.length - 1 };
    })
    .reverse();

  const live: { icon: IconName; label: string; value: string; unit: string; tint: string }[] = [
    { icon: 'heart', label: 'Heart rate', value: String(heartAt(elapsed)), unit: 'bpm', tint: t.c.danger },
    { icon: 'zap', label: 'Calories', value: String(Math.round(caloriesAt(elapsed))), unit: 'kcal', tint: t.c.warning },
    { icon: 'map-pin', label: 'Distance', value: km.toFixed(2), unit: 'km', tint: t.c.info },
    { icon: 'clock', label: 'Avg pace', value: pace(elapsed / km), unit: '/km', tint: t.c.success },
  ];

  const splitList = (
    <ListSection header="Splits">
      {splits.map((l) => (
        <ListRow
          key={l.n}
          title={l.current ? `Lap ${l.n} · now` : `Lap ${l.n}`}
          subtitle={`${l.dist.toFixed(2)} km · ${pace(l.time / l.dist)} /km`}
          accessory={<Text tabular weight={l.current ? '600' : '400'} tone={l.current ? 'accent' : 'default'}>{clock(l.time)}</Text>}
        />
      ))}
    </ListSection>
  );

  if (summary) {
    return (
      <View style={{ flex: 1, backgroundColor: t.c.bg }}>
        <Header title="Summary" leading={<IconButton icon="x" accessibilityLabel="Close" onPress={onBack} />} />
        <ScrollView contentContainerStyle={{ padding: t.component.screenPadding, paddingBottom: t.space[6], gap: t.space[5] }}>
          <View style={{ alignItems: 'center', gap: t.space[3], paddingTop: t.space[2] }}>
            <View style={{ width: t.size.controlXl, height: t.size.controlXl, borderRadius: t.radius.full, backgroundColor: t.c.successSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={24} color={t.c.success} strokeWidth={2} />
            </View>
            <View style={{ alignItems: 'center', gap: t.space[1] }}>
              <Text variant="title2" accessibilityRole="header">Workout saved</Text>
              <Text tone="muted">{title} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
            </View>
          </View>
          <Card>
            <View style={{ flexDirection: 'row', gap: t.space[3] }}>
              <Stat label="Time" value={summary.duration} format={clock} style={{ flex: 1 }} />
              <Stat label="Distance" value={summary.distanceKm} format={(n) => `${n.toFixed(2)} km`} style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: t.space[3] }}>
              <Stat label="Avg pace" value={summary.avgPace} format={(n) => `${pace(n)} /km`} style={{ flex: 1 }} />
              <Stat label="Avg heart rate" value={summary.avgHeartRate} format={(n) => `${Math.round(n)} bpm`} style={{ flex: 1 }} />
            </View>
            <Stat label="Calories" value={summary.calories} format={(n) => `${Math.round(n)} kcal`} />
          </Card>
          {splitList}
        </ScrollView>
        <View style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle }}>
          <Button block size="lg" onPress={onBack}>Done</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <Header title={title} leading={<IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />} />
      <ScrollView contentContainerStyle={{ padding: t.component.screenPadding, paddingBottom: t.space[6], gap: t.space[5] }}>
        <View style={{ alignItems: 'center', gap: t.space[2], paddingVertical: t.space[4] }}>
          {running ? <Badge tone="success" dot>Recording</Badge> : <Badge tone="warning" icon="pause">Paused</Badge>}
          <Text
            variant="display"
            tabular
            tone={running ? 'default' : 'muted'}
            accessibilityRole="timer"
            accessibilityLabel={`Elapsed time ${clock(elapsed)}`}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {clock(elapsed)}
          </Text>
          <Text variant="footnote" tone="muted">Elapsed</Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
          {live.map((s) => (
            <Card key={s.label} style={{ flexGrow: 1, flexBasis: '40%' }}>
              <View accessible accessibilityLabel={`${s.label}, ${s.value} ${s.unit}`} style={{ gap: t.space[1] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space['1_5'] }}>
                  <Icon name={s.icon} size={16} color={s.tint} strokeWidth={1.75} />
                  <Text variant="footnote" tone="muted">{s.label}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[1] }}>
                  <Text variant="title2" tabular>{s.value}</Text>
                  <Text variant="footnote" tone="subtle">{s.unit}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {splitList}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: t.space[3], paddingHorizontal: t.component.screenPadding, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle }}>
        {running ? (
          <>
            <Button variant="secondary" size="lg" icon="flag" style={{ flex: 1 }} onPress={lap}>Lap</Button>
            <Button size="lg" icon="pause" style={{ flex: 1 }} onPress={pause}>Pause</Button>
          </>
        ) : (
          <>
            <Button variant="destructive" size="lg" style={{ flex: 1 }} onPress={() => setConfirm(true)}>Finish</Button>
            <Button size="lg" icon="play" style={{ flex: 1 }} onPress={resume}>Resume</Button>
          </>
        )}
      </View>

      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Finish workout?"
        description={`${km.toFixed(2)} km in ${clock(elapsed)}. It will be saved to your history.`}
        actions={[
          { label: 'Keep going', style: 'cancel' },
          { label: 'Finish', onPress: finish },
        ]}
      />
    </View>
  );
}
