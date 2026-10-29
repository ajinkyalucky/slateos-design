import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { Sparkline } from './Sparkline';

export type StatTrend = 'up' | 'down' | 'flat';

export type StatProps = {
  label: string;
  value: number | string;
  /** Formats a numeric value (and every frame of the count-up). */
  format?: (n: number) => string;
  /** The change, already formatted: "+12%", "−$40". */
  delta?: string;
  trend?: StatTrend;
  /** For metrics where down is good (costs, resting heart rate). */
  invertTone?: boolean;
  /** Context for the delta, e.g. "vs last week". */
  caption?: string;
  sparkline?: number[];
  /** Count up from 0 on first mount. Default true for numbers; off with Reduce Motion. */
  countUp?: boolean;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

const decimalsOf = (n: number) => (Number.isInteger(n) ? 0 : Math.min(2, String(n).split('.')[1]?.length ?? 0));

/** A key number with its label, change and trend: the top of a dashboard. */
export function Stat({ label, value, format, delta, trend, invertTone, caption, sparkline, countUp = true, size = 'md', style }: StatProps) {
  const t = useSlate();
  const numeric = typeof value === 'number';
  const animate = numeric && countUp && !t.reducedMotion;
  const [shown, setShown] = useState(animate ? 0 : numeric ? value : 0);
  const mounted = useRef(false);
  const duration = t.spring.gentle.duration;

  useEffect(() => {
    if (!numeric) return;
    // Only the first mount counts up; later changes snap, so live data does not keep spinning.
    if (mounted.current || !animate) { setShown(value); return; }
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else mounted.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fmt = (n: number) => (format ? format(n) : n.toLocaleString(undefined, { minimumFractionDigits: decimalsOf(value as number), maximumFractionDigits: decimalsOf(value as number) }));
  const display = numeric ? fmt(shown) : value;
  const final = numeric ? fmt(value) : value;
  const good = trend === 'flat' || !trend ? null : (trend === 'up') !== !!invertTone;
  const tone = good == null ? 'muted' : good ? 'success' : 'danger';
  const toneColor = good == null ? t.c.textMuted : good ? t.c.success : t.c.danger;

  return (
    <View
      accessible
      accessibilityLabel={[label, final, delta, caption].filter(Boolean).join(', ')}
      style={[{ gap: t.space[1] }, style]}
    >
      <Text variant="footnote" tone="muted">{label}</Text>
      <Text variant={size === 'lg' ? 'title1' : 'title2'} tabular numberOfLines={1} adjustsFontSizeToFit>
        {display}
      </Text>
      {(delta || caption) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1], flexWrap: 'wrap' }}>
          {trend && trend !== 'flat' && <Icon name={trend === 'up' ? 'trending-up' : 'trending-down'} size={16} color={toneColor} strokeWidth={1.75} />}
          {delta && <Text variant="footnote" weight="500" tone={tone} tabular>{delta}</Text>}
          {caption && <Text variant="footnote" tone="subtle">{caption}</Text>}
        </View>
      )}
      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} color={good == null ? undefined : toneColor} style={{ marginTop: t.space[2] }} />
      )}
    </View>
  );
}
