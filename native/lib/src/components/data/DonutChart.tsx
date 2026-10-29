import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedProps, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { chartColor } from '../general/tone';
import { defaultFormat } from './chart';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type DonutSegment = { label: string; value: number; color?: string };

export type DonutChartProps = {
  segments: DonutSegment[];
  /** Caption under the centre total. Default "Total". */
  totalLabel?: string;
  formatValue?: (n: number) => string;
  /** The whole the segments are parts of. Default: their sum. Set it for a progress ring (e.g. 100). */
  total?: number;
  /** Diameter. Default t.size.width2xs + t.space[6]. */
  size?: number;
  /** Ring thickness. Default t.space[4]. */
  thickness?: number;
  /** Show the tappable legend under the ring. Default true. */
  legend?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Parts of a whole, with the total in the middle. Tap a segment or legend row to focus it. */
export function DonutChart({ segments, totalLabel = 'Total', formatValue = defaultFormat, total: whole, size, thickness, legend = true, accessibilityLabel, style }: DonutChartProps) {
  const t = useSlate();
  const S = size ?? t.size.width2xs + t.space[6];
  const th = thickness ?? t.space[4];
  const r = (S - th) / 2;
  const C = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const total = Math.max(whole ?? 0, sum) || 1;
  const gap = segments.length > 1 || sum < total ? t.space[1] : 0;
  const [sel, setSel] = useState(-1);
  const p = useSharedValue(t.reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!t.reducedMotion) p.value = withSpring(1, t.spring.gentle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let acc = 0;
  const arcs = segments.map((s, i) => {
    const frac = Math.max(0, s.value) / total;
    const a = { start: acc, frac, color: s.color ?? chartColor(t, i) };
    acc += frac;
    return a;
  });

  const pick = (i: number) => {
    setSel((cur) => (cur === i ? -1 : i));
    t.haptic('selection');
  };
  const onTapAt = (x: number, y: number) => {
    const dx = x - S / 2, dy = y - S / 2, d = Math.hypot(dx, dy);
    if (d < r - th / 2 - t.space[2] || d > r + th / 2 + t.space[2]) return setSel(-1);
    const turn = ((Math.atan2(dx, -dy) / (2 * Math.PI)) + 1) % 1;
    const i = arcs.findIndex((a) => turn >= a.start && turn < a.start + a.frac);
    if (i >= 0) pick(i);
  };
  const tap = useTapGesture({ onActivate: (e) => { scheduleOnRN(onTapAt, e.x, e.y); } });

  const focus = sel >= 0 ? segments[sel] : null;
  const pct = (v: number) => `${Math.round((Math.max(0, v) / total) * 100)}%`;

  return (
    <View style={[{ alignItems: 'center', gap: t.space[4] }, style]}>
      <GestureDetector gesture={tap}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel ?? `${totalLabel} ${formatValue(sum)}. ${segments.map((s) => `${s.label} ${formatValue(s.value)}, ${pct(s.value)}`).join('. ')}`}
          style={{ width: S, height: S }}
        >
          <Svg width={S} height={S}>
            <Circle cx={S / 2} cy={S / 2} r={r} stroke={t.c.surfaceHover} strokeWidth={th} fill="none" />
            <G rotation={-90} origin={`${S / 2}, ${S / 2}`}>
              {arcs.map((a, i) => (
                <Arc key={i} p={p} cx={S / 2} r={r} C={C} start={a.start} frac={a.frac} gap={gap} color={a.color} width={th} dim={sel >= 0 && sel !== i} />
              ))}
            </G>
          </Svg>
          <View pointerEvents="none" style={{ position: 'absolute', inset: th, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="title3" tabular numberOfLines={1} adjustsFontSizeToFit>{formatValue(focus ? focus.value : sum)}</Text>
            <Text variant="caption" tone="subtle" numberOfLines={1}>{focus ? `${focus.label} · ${pct(focus.value)}` : totalLabel}</Text>
          </View>
        </View>
      </GestureDetector>
      {legend && (
        <View style={{ alignSelf: 'stretch' }}>
          {segments.map((s, i) => (
            <Touchable
              key={s.label}
              onPress={() => pick(i)}
              pressScale={1}
              pressOpacity={0.6}
              accessibilityRole="button"
              accessibilityState={{ selected: sel === i }}
              accessibilityLabel={`${s.label}, ${formatValue(s.value)}, ${pct(s.value)}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], minHeight: t.size.touch, opacity: sel >= 0 && sel !== i ? 0.5 : 1 }}
            >
              <View style={{ width: t.space[2], height: t.space[2], borderRadius: t.radius.full, backgroundColor: arcs[i].color }} />
              <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>{s.label}</Text>
              <Text variant="callout" tabular weight="500">{formatValue(s.value)}</Text>
              <Text variant="footnote" tone="subtle" tabular align="right" style={{ minWidth: t.space[7] }}>{pct(s.value)}</Text>
            </Touchable>
          ))}
        </View>
      )}
    </View>
  );
}

function Arc({ p, cx, r, C, start, frac, gap, color, width, dim }: {
  p: SharedValue<number>; cx: number; r: number; C: number; start: number; frac: number; gap: number; color: string; width: number; dim: boolean;
}) {
  const props = useAnimatedProps(() => ({
    strokeDasharray: [Math.max(0, frac * C * p.value - gap), C],
    strokeDashoffset: -start * C * p.value,
  }));
  return <AnimatedCircle animatedProps={props} cx={cx} cy={cx} r={r} stroke={color} strokeWidth={width} fill="none" opacity={dim ? 0.3 : 1} />;
}
