import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { chartColor } from '../general/tone';
import { defaultFormat } from './chart';

export type ChartSeries = { name: string; data: number[]; color?: string };

export type BarChartProps = {
  /** One label per bar (or per group). */
  labels: string[];
  /** A single series. Use `series` for side-by-side groups. */
  data?: number[];
  series?: ChartSeries[];
  /** Height of the bar area. Default t.size.width2xs. */
  height?: number;
  formatValue?: (n: number) => string;
  /** Controlled selection; null for none. Leave undefined to let the chart manage it. */
  selectedIndex?: number | null;
  onSelectedIndexChange?: (index: number | null) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Vertical bars that grow in on mount. Tap or drag across to read a bar's value. */
export function BarChart({ labels, data, series, height, formatValue = defaultFormat, selectedIndex, onSelectedIndexChange, accessibilityLabel, style }: BarChartProps) {
  const t = useSlate();
  const all = series ?? [{ name: '', data: data ?? [] }];
  const colors = all.map((s, i) => s.color ?? chartColor(t, i));
  const n = labels.length;
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number>(selectedIndex ?? -1);
  const ph = height ?? t.size.width2xs;
  const top = t.type.caption.lineHeight + t.space[1];
  const max = Math.max(0, ...all.flatMap((s) => s.data)) || 1;

  // Selection lives on the UI thread so drags stay at 60fps; React hears only index changes.
  const selSV = useSharedValue(selectedIndex ?? -1);
  const slotSV = useSharedValue(1);
  const countSV = useSharedValue(n);
  useEffect(() => { slotSV.value = w / Math.max(1, n); countSV.value = n; }, [w, n, slotSV, countSV]);
  useEffect(() => { if (selectedIndex !== undefined) selSV.value = selectedIndex ?? -1; }, [selectedIndex, selSV]);

  const onPick = (i: number) => {
    setSel(i);
    if (i >= 0) t.haptic('selection');
    onSelectedIndexChange?.(i < 0 ? null : i);
  };
  useAnimatedReaction(
    () => selSV.value,
    (v, prev) => { if (prev !== null && v !== prev) scheduleOnRN(onPick, v); },
  );

  const pan = usePanGesture({
    activeOffsetX: [-6, 6],
    failOffsetY: [-12, 12],
    onActivate: (e) => { selSV.value = Math.max(0, Math.min(countSV.value - 1, Math.floor(e.x / slotSV.value))); },
    onUpdate: (e) => { selSV.value = Math.max(0, Math.min(countSV.value - 1, Math.floor(e.x / slotSV.value))); },
  });
  const tap = useTapGesture({
    onActivate: (e) => {
      const i = Math.max(0, Math.min(countSV.value - 1, Math.floor(e.x / slotSV.value)));
      selSV.value = selSV.value === i ? -1 : i;
    },
  });
  const gesture = useCompetingGestures(pan, tap);

  const slot = w / Math.max(1, n);
  const k = all.length;
  const inner = t.space['0_5'];
  const groupW = Math.min(slot * 0.62, t.space[7] * k);
  const barW = Math.max(1, (groupW - inner * (k - 1)) / k);
  const stagger = Math.min(t.motion.duration.instant, t.motion.duration.slow / Math.max(1, n));
  const every = Math.ceil(n / 8);
  const valueText = (i: number) => all.map((s) => formatValue(s.data[i] ?? 0)).join(' / ');
  const selTop = sel >= 0 ? Math.max(...all.map((s) => ((s.data[sel] ?? 0) / max) * ph)) : 0;
  const labelW = Math.max(slot, t.space[10]);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? 'Bar chart'}
      accessibilityValue={{ text: sel >= 0 ? `${labels[sel]}: ${valueText(sel)}` : `${n} bars. Swipe up or down to read each.` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const next = e.nativeEvent.actionName === 'increment' ? Math.min(n - 1, sel + 1) : Math.max(0, sel - 1);
        selSV.value = next;
      }}
      style={style}
    >
      <GestureDetector gesture={gesture}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: top + ph }}>
          {w > 0 &&
            labels.map((_, i) =>
              all.map((s, j) => (
                <Bar
                  key={`${i}-${j}`}
                  left={i * slot + (slot - groupW) / 2 + j * (barW + inner)}
                  width={barW}
                  height={Math.max((s.data[i] ?? 0) > 0 ? 2 : 0, ((s.data[i] ?? 0) / max) * ph)}
                  color={colors[j]}
                  delay={i * stagger}
                  dim={sel >= 0 && sel !== i}
                />
              )),
            )}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: t.c.border }} />
          {sel >= 0 && w > 0 && (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', width: labelW, left: Math.max(0, Math.min(w - labelW, sel * slot + slot / 2 - labelW / 2)), bottom: selTop + t.space[1] }}
            >
              <Text variant="caption" weight="600" tabular align="center" numberOfLines={1}>{valueText(sel)}</Text>
            </View>
          )}
        </View>
      </GestureDetector>
      <View style={{ flexDirection: 'row', marginTop: t.space['1_5'] }}>
        {labels.map((l, i) => (
          <Text
            key={i}
            variant="caption"
            tone={sel === i ? 'default' : 'subtle'}
            weight={sel === i ? '600' : undefined}
            align="center"
            numberOfLines={1}
            style={{ width: slot || undefined, flex: slot ? undefined : 1, opacity: i % every === 0 || sel === i ? 1 : 0 }}
          >
            {l}
          </Text>
        ))}
      </View>
      {k > 1 && <ChartLegend names={all.map((s) => s.name)} colors={colors} />}
    </View>
  );
}

function Bar({ left, width, height, color, delay, dim }: { left: number; width: number; height: number; color: string; delay: number; dim: boolean }) {
  const t = useSlate();
  const reduced = t.reducedMotion;
  const spring = t.spring.standard;
  const fast = t.motion.duration.base;
  const grow = useSharedValue(reduced ? 1 : 0);
  const fade = useSharedValue(1);
  useEffect(() => {
    if (!reduced) grow.value = withDelay(delay, withSpring(1, spring));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { fade.value = withTiming(dim ? 0.35 : 1, { duration: fast }); }, [dim, fade, fast]);
  const anim = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scaleY: grow.value }] }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left,
          width,
          height,
          backgroundColor: color,
          borderTopLeftRadius: Math.min(t.radius.sm, width / 2),
          borderTopRightRadius: Math.min(t.radius.sm, width / 2),
          transformOrigin: 'bottom',
        },
        anim,
      ]}
    />
  );
}

/** Dot-and-name key for multi-series charts. */
export function ChartLegend({ names, colors, style }: { names: string[]; colors: string[]; style?: StyleProp<ViewStyle> }) {
  const t = useSlate();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3], marginTop: t.space[3] }, style]}>
      {names.map((name, i) => (
        <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space['1_5'] }}>
          <View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: colors[i] }} />
          <Text variant="caption" tone="muted">{name}</Text>
        </View>
      ))}
    </View>
  );
}
