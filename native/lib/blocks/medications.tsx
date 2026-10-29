import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Banner, Button, Card, CardHeader, Checkbox, IconButton, Input, SegmentedControl, Sheet, Switch, Text, useSlate,
} from '@ajinkyabhagwat/slateos-native';

export type MedSlot = 'Morning' | 'Afternoon' | 'Evening';
export type MedTone = 'accent' | 'info' | 'success' | 'warning' | 'danger';

export type Medication = {
  id: string;
  name: string;
  dose: string;
  note?: string;
  slot: MedSlot;
  time: string;
  tone: MedTone;
  taken?: boolean;
  takenAt?: string;
};

export type NewMedication = { name: string; dose: string; slot: MedSlot; time: string; reminder: boolean };

export type MedicationsScreenProps = {
  meds?: Medication[];
  /** Share of doses taken on each of the last six days, oldest first (0 to 1). Today is live. */
  pastWeek?: number[];
  /** Shows the refill banner; leave undefined to hide it. */
  refill?: { name: string; left: string };
  onAdd?: (med: NewMedication) => void;
  onTakenChange?: (id: string, taken: boolean) => void;
  onRefill?: () => void;
};

const SLOTS: MedSlot[] = ['Morning', 'Afternoon', 'Evening'];
const SLOT_TIME: Record<MedSlot, string> = { Morning: '8:00 AM', Afternoon: '1:00 PM', Evening: '9:00 PM' };
const TONES: MedTone[] = ['accent', 'info', 'success', 'warning', 'danger'];

const DEFAULT_MEDS: Medication[] = [
  { id: '1', name: 'Metformin', dose: '500 mg', note: 'With breakfast', slot: 'Morning', time: '8:00 AM', tone: 'info', taken: true, takenAt: '8:04 AM' },
  { id: '2', name: 'Vitamin D3', dose: '1000 IU', slot: 'Morning', time: '8:00 AM', tone: 'warning', taken: true, takenAt: '8:04 AM' },
  { id: '3', name: 'Lisinopril', dose: '10 mg', slot: 'Morning', time: '9:00 AM', tone: 'danger' },
  { id: '4', name: 'Metformin', dose: '500 mg', note: 'With lunch', slot: 'Afternoon', time: '1:00 PM', tone: 'info' },
  { id: '5', name: 'Atorvastatin', dose: '20 mg', slot: 'Evening', time: '9:00 PM', tone: 'success' },
  { id: '6', name: 'Magnesium', dose: '250 mg', note: 'Before bed', slot: 'Evening', time: '10:00 PM', tone: 'accent' },
];

const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Today's medicines by time of day: tick doses off, see the week's adherence, get refill nudges and add new ones. */
export function MedicationsScreen({
  meds = DEFAULT_MEDS,
  pastWeek = [1, 1, 0.83, 1, 0.67, 1],
  refill = { name: 'Lisinopril', left: '4 tablets left' },
  onAdd,
  onTakenChange,
  onRefill,
}: MedicationsScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState(meds);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [slot, setSlot] = useState<MedSlot>('Morning');
  const [reminder, setReminder] = useState(true);

  const taken = list.filter((m) => m.taken).length;
  const today = list.length ? taken / list.length : 0;
  const week = [...pastWeek.slice(-6), today];
  const days = week.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (week.length - 1 - i));
    return { short: d.toLocaleDateString('en-US', { weekday: 'narrow' }), long: d.toLocaleDateString('en-US', { weekday: 'long' }) };
  });
  const weekPct = Math.round((week.reduce((a, b) => a + b, 0) / week.length) * 100);

  const toggle = (id: string, on: boolean) => {
    setList((l) => l.map((m) => (m.id === id ? { ...m, taken: on, takenAt: on ? nowTime() : undefined } : m)));
    onTakenChange?.(id, on);
  };

  const add = () => {
    const med: NewMedication = { name: name.trim(), dose: dose.trim(), slot, time: SLOT_TIME[slot], reminder };
    setList((l) => [...l, { id: `${Date.now()}`, name: med.name, dose: med.dose, slot, time: med.time, tone: TONES[l.length % TONES.length] }]);
    onAdd?.(med);
    t.haptic('success');
    setAdding(false);
    setName('');
    setDose('');
    setReminder(true);
  };

  const pill = (tone: MedTone) => {
    const solid = tone === 'accent' ? t.c.accentSolid : t.c[`${tone}Solid`];
    const soft = tone === 'accent' ? t.c.accentSoft : t.c[`${tone}Soft`];
    return (
      <View style={{ width: t.size.controlLg, height: t.size.controlLg, borderRadius: t.radius.lg, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
        {/* A two-tone capsule drawn from views: the kit has no pill icon. */}
        <View
          style={{
            width: t.space[5], height: t.space['2_5'], borderRadius: t.radius.full, borderWidth: 1.5, borderColor: solid,
            flexDirection: 'row', overflow: 'hidden', transform: [{ rotate: '-45deg' }],
          }}
        >
          <View style={{ flex: 1, backgroundColor: solid }} />
          <View style={{ flex: 1 }} />
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: t.component.screenPadding, paddingTop: t.space[2], paddingBottom: t.space[3] }}>
        <View style={{ gap: t.space[1] }}>
          <Text variant="footnote" tone="muted" tabular>{taken} of {list.length} taken today</Text>
          <Text variant="title1" accessibilityRole="header">Medications</Text>
        </View>
        <IconButton icon="plus" variant="soft" round accessibilityLabel="Add medication" onPress={() => setAdding(true)} />
      </View>

      {refill && (
        <Banner tone="warning" title="Refill soon." action={{ label: 'Refill', onPress: () => onRefill?.() }} dismissible>
          {`${refill.name}: ${refill.left}.`}
        </Banner>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[4], paddingBottom: insets.bottom + t.space[10], gap: t.space[5] }}>
        <Card>
          <CardHeader title="This week" description={`${weekPct}% of doses taken`} />
          <View
            accessible
            accessibilityLabel={days.map((d, i) => `${d.long}${i === days.length - 1 ? ' (today)' : ''}: ${Math.round(week[i] * 100)}%`).join(', ')}
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            {week.map((v, i) => {
              const isToday = i === week.length - 1;
              const full = v >= 1;
              const fill = full ? t.c.successSolid : v > 0 ? t.c.warningSolid : undefined;
              return (
                <View key={i} style={{ alignItems: 'center', gap: t.space['1_5'], flex: 1 }}>
                  <View
                    style={{
                      width: t.space[3], height: t.space[3], borderRadius: t.radius.full, backgroundColor: fill,
                      borderWidth: v > 0 ? 0 : 1.5, borderColor: t.c.borderStrong,
                      boxShadow: isToday ? `0 0 0 ${t.space['0_5']}px ${t.c.bg}, 0 0 0 ${t.space[1]}px ${t.c.accentSolid}` : undefined,
                    }}
                  />
                  <Text variant="caption" tone={isToday ? 'default' : 'subtle'} weight={isToday ? '600' : undefined}>{days[i].short}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {SLOTS.map((s) => {
          const rows = list.filter((m) => m.slot === s);
          if (!rows.length) return null;
          return (
            <View key={s} style={{ gap: t.space[2] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: t.space[4] }}>
                <Text variant="overline" tone="subtle" accessibilityRole="header">{s}</Text>
                <Text variant="caption" tone="subtle" tabular>{rows.filter((m) => m.taken).length}/{rows.length}</Text>
              </View>
              <View style={{ backgroundColor: t.c.surfaceRaised, borderRadius: t.component.listRadius, borderWidth: StyleSheet.hairlineWidth, borderColor: t.c.border, overflow: 'hidden' }}>
                {rows.map((m, i) => (
                  <View key={m.id}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingLeft: t.space[4], paddingRight: t.space[2], paddingVertical: t.space[2] }}>
                      {pill(m.tone)}
                      <View style={{ flex: 1, gap: t.space['0_5'] }}>
                        <Text weight="500" numberOfLines={1}>{m.name} <Text tone="muted">{m.dose}</Text></Text>
                        {m.taken
                          ? <Text variant="footnote" tone="success">Taken at {m.takenAt}</Text>
                          : <Text variant="footnote" tone="muted" numberOfLines={1}>{[m.time, m.note].filter(Boolean).join(' · ')}</Text>}
                      </View>
                      <Checkbox
                        checked={!!m.taken}
                        onValueChange={(v) => toggle(m.id, v)}
                        accessibilityLabel={`${m.name} ${m.dose}, ${m.time}. Taken`}
                      />
                    </View>
                    {i < rows.length - 1 && (
                      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: t.space[4] + t.size.controlLg + t.space[3] }} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Sheet
        open={adding}
        onOpenChange={setAdding}
        title="Add medication"
        description="It joins today’s schedule straight away."
        footer={<Button block size="lg" disabled={!name.trim()} onPress={add}>Add medication</Button>}
      >
        <View style={{ gap: t.space[4], paddingBottom: t.space[2] }}>
          <Input label="Name" placeholder="e.g. Amoxicillin" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />
          <Input label="Dose" placeholder="e.g. 250 mg" value={dose} onChangeText={setDose} optional />
          <View style={{ gap: t.space[2] }}>
            <Text variant="label">When</Text>
            <SegmentedControl options={SLOTS} value={slot} onValueChange={setSlot} />
          </View>
          <Switch value={reminder} onValueChange={setReminder} label="Remind me" description={`A notification at ${SLOT_TIME[slot]} each day.`} />
        </View>
      </Sheet>
    </View>
  );
}
