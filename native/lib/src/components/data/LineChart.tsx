import { useEffect, useId, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { chartColor } from '../general/tone';
import { ChartLegend, type ChartSeries } from './BarChart';
import { areaPath, defaultFormat, extent, linePath, svgId, type Point } from './chart';

export type LineChartProps = {
  /** One x-axis label per point. */
  labels: string[];
  /** A single series. Use `series` for several lines. */
  data?: number[];
  series?: ChartSeries[];
  /** Height of the plot. Default t.size.width2xs. */
  height?: number;
  formatValue?: (n: number) => string;
  /** Soft fill under a single line. Default true. */
  area?: boolean;
  /** The value header above the plot; shows the latest point until you scrub. Default true. */
  readout?: boolean;
  onScrub?: (index: number | null) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** One or more trend lines. Drag across to scrub: a guide, a dot on each line and a live readout. */
export function LineChart({ labels, data, series, height, formatValue = defaultFormat, area = true, readout = true, onScrub, accessibilityLabel, style }: LineChartProps) {
  const t = useSlate();
  const all = series ?? [{ name: '', data: data ?? [] }];
  const colors = all.map((s, i) => s.color ?? chartColor(t, i));
  const n = labels.length;
  const [w, setW] = useState(0);
  const [idx, setIdx] = useState(-1);
  const [a11yIdx, setA11yIdx] = useState(n - 1);
  const gid = svgId(useId());
  const ph = height ?? t.size.width2xs;
  const dot = t.space[3];
  const pad = dot / 2 + 1;
  const [lo, hi] = extent(all.flatMap((s) => s.data));
  const step = n > 1 ? (w - pad * 2) / (n - 1) : 0;
  const xs = labels.map((_, i) => pad + i * step);
  const ys = all.map((s) => s.data.map((v) => pad + (1 - (v - lo) / (hi - lo)) * (ph - pad * 2)));

  const idxSV = useSharedValue(-1);
  const geo = useSharedValue({ pad, step, n });
  useEffect(() => { geo.value = { pad, step, n }; }, [pad, step, n, geo]);

  const onChange = (i: number, prev: number) => {
    setIdx(i);
    if (prev < 0 && i >= 0) t.haptic('selection');
    onScrub?.(i < 0 ? null : i);
  };
  useAnimatedReaction(
    () => idxSV.value,
    (v, prev) => { if (prev !== null && v !== prev) scheduleOnRN(onChange, v, prev); },
  );

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onActivate: (e) => {
      const g = geo.value;
      idxSV.value = g.step ? Math.max(0, Math.min(g.n - 1, Math.round((e.x - g.pad) / g.step))) : 0;
    },
    onUpdate: (e) => {
      const g = geo.value;
      idxSV.value = g.step ? Math.max(0, Math.min(g.n - 1, Math.round((e.x - g.pad) / g.step))) : 0;
    },
    onFinalize: () => { idxSV.value = -1; },
  });

  const shown = idx >= 0 ? idx : n - 1;
  const every = Math.max(1, Math.ceil(n / 5));
  const tickW = w / Math.ceil(n / every);
  const single = all.length === 1;
  const describe = (i: number) => `${labels[i]}: ${all.map((s) => `${s.name ? s.name + ' ' : ''}${formatValue(s.data[i] ?? 0)}`).join(', ')}`;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel ?? 'Line chart'}
      accessibilityValue={{ text: n ? describe(a11yIdx) : 'No data' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => setA11yIdx((i) => Math.max(0, Math.min(n - 1, i + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
      style={style}
    >
      {readout && n > 0 && (
        <View style={{ marginBottom: t.space[3], gap: t.space['0_5'] }}>
          <Text variant="caption" tone="subtle">{labels[shown]}</Text>
          {single ? (
            <Text variant="title3" tabular>{formatValue(all[0].data[shown] ?? 0)}</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: t.space[4], rowGap: t.space[1] }}>
              {all.map((s, j) => (
                <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space['1_5'] }}>
                  <View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: colors[j] }} />
                  <Text variant="footnote" tone="muted">{s.name}</Text>
                  <Text variant="headline" tabular>{formatValue(s.data[shown] ?? 0)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      <GestureDetector gesture={pan}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: ph }}>
          {w > 0 && n > 0 && (
            <>
              <Svg width={w} height={ph}>
                {[0, 0.5, 1].map((f) => (
                  <Line key={f} x1={0} x2={w} y1={pad + f * (ph - pad * 2)} y2={pad + f * (ph - pad * 2)} stroke={f === 1 ? t.c.border : t.c.borderSubtle} strokeWidth={1} />
                ))}
                {single && area && (
                  <>
                    <Defs>
                      <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors[0]} stopOpacity={0.18} />
                        <Stop offset="1" stopColor={colors[0]} stopOpacity={0} />
                      </LinearGradient>
                    </Defs>
                    <Path d={areaPath(xs.map((x, i) => [x, ys[0][i]] as Point), ph)} fill={`url(#${gid})`} />
                  </>
                )}
                {all.map((s, j) => (
                  <Path
                    key={s.name || j}
                    d={linePath(xs.map((x, i) => [x, ys[j][i]] as Point))}
                    stroke={colors[j]}
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
              <Guide idx={idxSV} xs={xs} height={ph} color={t.c.borderStrong} />
              {all.map((s, j) => (
                <ScrubDot key={s.name || j} idx={idxSV} xs={xs} ys={ys[j]} size={dot} color={colors[j]} ring={t.c.surfaceRaised} />
              ))}
            </>
          )}
        </View>
      </GestureDetector>
      <View style={{ height: t.type.caption.lineHeight, marginTop: t.space['1_5'] }}>
        {w > 0 &&
          labels.map((l, i) =>
            i % every === 0 ? (
              <Text
                key={i}
                variant="caption"
                tone="subtle"
                align="center"
                numberOfLines={1}
                style={{ position: 'absolute', width: tickW, left: Math.max(0, Math.min(w - tickW, xs[i] - tickW / 2)) }}
              >
                {l}
              </Text>
            ) : null,
          )}
      </View>
      {!single && !readout && <ChartLegend names={all.map((s) => s.name)} colors={colors} />}
    </View>
  );
}

function Guide({ idx, xs, height, color }: { idx: SharedValue<number>; xs: number[]; height: number; color: string }) {
  const anim = useAnimatedStyle(() => ({
    opacity: idx.value >= 0 ? 1 : 0,
    transform: [{ translateX: idx.value >= 0 ? xs[idx.value] : 0 }],
  }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 1, height, backgroundColor: color }, anim]} />;
}

function ScrubDot({ idx, xs, ys, size, color, ring }: { idx: SharedValue<number>; xs: number[]; ys: number[]; size: number; color: string; ring: string }) {
  const anim = useAnimatedStyle(() => {
    const i = idx.value;
    return {
      opacity: i >= 0 ? 1 : 0,
      transform: [{ translateX: i >= 0 ? xs[i] - size / 2 : 0 }, { translateY: i >= 0 ? ys[i] - size / 2 : 0 }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderWidth: 2, borderColor: ring }, anim]}
    />
  );
}
