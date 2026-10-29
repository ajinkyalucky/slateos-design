import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { IconButton } from '../general/Button';
import { rubberband } from './shared';

// Plain Date helpers; every date is local midnight.
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
export const defaultLocale = () => Intl.DateTimeFormat().resolvedOptions().locale;

// CLDR regions whose week starts on Sunday or Saturday; everywhere else starts on Monday.
const SUNDAY = new Set('AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(' '));
const SATURDAY = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));

/** 0 = Sunday … 6 = Saturday, from Intl week info when the engine has it, else from the region. */
export function firstDayOfWeek(locale: string): number {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const info = l.getWeekInfo?.() ?? l.weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch {}
  const region = /[-_]([A-Z]{2})(?:$|[-_])/.exec(locale)?.[1] ?? (locale.startsWith('en') ? 'US' : '');
  return SUNDAY.has(region) ? 0 : SATURDAY.has(region) ? 6 : 1;
}

export type DateRange = { start: Date | null; end: Date | null };

type CalendarBase = {
  /** Days before this are disabled. */
  min?: Date;
  /** Days after this are disabled. */
  max?: Date;
  /** BCP 47 tag for names and the first day of the week. Default: the device locale. */
  locale?: string;
  /** Month shown when there is no value. Default: this month. */
  defaultMonth?: Date;
  style?: StyleProp<ViewStyle>;
};
export type CalendarProps = CalendarBase & (
  | { mode?: 'single'; value: Date | null; onValueChange: (value: Date) => void }
  | { mode: 'range'; value: DateRange; onValueChange: (value: DateRange) => void }
);

/** A month grid for picking a day or a range. Swipe sideways or use the arrows to change month. */
export function Calendar(props: CalendarProps) {
  const { min, max, locale: localeProp, defaultMonth, style } = props;
  const t = useSlate();
  const locale = localeProp ?? defaultLocale();
  const focus = props.mode === 'range' ? props.value.start : props.value;
  const [month, setMonth] = useState(() => startOfMonth(focus ?? defaultMonth ?? new Date()));
  const [w, setW] = useState(0);

  const fmt = useMemo(() => ({
    title: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    narrow: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
    long: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
    day: new Intl.DateTimeFormat(locale, { day: 'numeric' }),
    full: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  }), [locale]);
  const first = useMemo(() => firstDayOfWeek(locale), [locale]);
  const weeks = useMemo(() => {
    const start = addDays(month, -((month.getDay() - first + 7) % 7));
    return Array.from({ length: 6 }, (_, r) => Array.from({ length: 7 }, (_, c) => addDays(start, r * 7 + c)));
  }, [month, first]);

  const today = startOfDay(new Date());
  const lo = min && startOfDay(min), hi = max && startOfDay(max);
  const canPrev = !lo || new Date(month.getFullYear(), month.getMonth(), 0) >= lo;
  const canNext = !hi || addMonths(month, 1) <= hi;

  // Slide: the old month leaves with a fade, the new one settles in from a quarter width on the other side.
  const tx = useSharedValue(0);
  const op = useSharedValue(1);
  const pending = useRef(0);
  const spring = t.spring.standard;
  const out = { duration: t.motion.duration.base, easing: Easing.out(Easing.quad) };
  const limit = t.space[7];
  const haptic = t.haptic;
  const commit = (dir: number, target?: number) => { pending.current = dir; setMonth((m) => (target ? new Date(target) : addMonths(m, dir))); };
  const swiped = (dir: number) => { haptic('selection'); commit(dir); };
  useEffect(() => {
    const dir = pending.current;
    if (!dir) return;
    pending.current = 0;
    tx.value = dir * w * 0.25;
    tx.value = withSpring(0, spring);
    op.value = withSpring(1, spring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);
  const go = (dir: 1 | -1, target?: number) => {
    tx.value = withTiming(-dir * w * 0.3, out, (done) => { if (done) scheduleOnRN(commit, dir, target); });
    op.value = withTiming(0, out);
  };
  // Follow the value when it moves to another month (quick picks, typed dates).
  useEffect(() => {
    if (focus && monthKey(focus) !== monthKey(month)) go(monthKey(focus) > monthKey(month) ? 1 : -1, startOfMonth(focus).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.getTime()]);

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      const x = e.translationX;
      const blocked = (x < 0 && !canNext) || (x > 0 && !canPrev);
      tx.value = blocked ? Math.sign(x) * rubberband(Math.abs(x), limit) : x;
    },
    onDeactivate: (e) => {
      const projected = e.translationX + e.velocityX * 0.15;
      const dir = projected < -w / 3 ? 1 : projected > w / 3 ? -1 : 0;
      if (!dir || (dir === 1 && !canNext) || (dir === -1 && !canPrev)) {
        tx.value = withSpring(0, { ...spring, velocity: e.velocityX });
        return;
      }
      tx.value = withTiming(-dir * w, out, (done) => { if (done) scheduleOnRN(swiped, dir); });
      op.value = withTiming(0, out);
    },
  });
  const slide = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateX: tx.value }] }));

  const pick = (d: Date) => {
    if (props.mode === 'range') {
      const { start, end } = props.value;
      props.onValueChange(!start || end || d < start ? { start: d, end: null } : { start, end: d });
    } else props.onValueChange(d);
  };
  const range = props.mode === 'range' ? props.value : null;
  const hasBand = !!range?.start && !!range.end && !sameDay(range.start, range.end);

  const cellH = t.size.touch, dot = t.size.controlLg;
  return (
    <View style={[{ gap: t.space[2] }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: t.space[1] }}>
        <Text variant="headline" accessibilityRole="header" accessibilityLiveRegion="polite" style={{ flex: 1 }}>{fmt.title.format(month)}</Text>
        <IconButton icon="chevron-left" size="sm" accessibilityLabel="Previous month" disabled={!canPrev} onPress={() => go(-1)} />
        <IconButton icon="chevron-right" size="sm" accessibilityLabel="Next month" disabled={!canNext} onPress={() => go(1)} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {weeks[0].map((d) => (
          <Text key={d.getDay()} variant="caption" tone="subtle" align="center" accessibilityLabel={fmt.long.format(d)} style={{ flex: 1 }}>
            {fmt.narrow.format(d)}
          </Text>
        ))}
      </View>
      <GestureDetector gesture={pan}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ overflow: 'hidden' }}>
          <Animated.View style={slide}>
            {weeks.map((week) => (
              <View key={week[0].getTime()} style={{ flexDirection: 'row' }}>
                {week.map((d) => {
                  const outside = d.getMonth() !== month.getMonth();
                  const disabled = (!!lo && d < lo) || (!!hi && d > hi);
                  const isStart = sameDay(d, range ? range.start : props.value as Date | null);
                  const isEnd = !!range && sameDay(d, range.end);
                  const selected = isStart || isEnd;
                  const between = hasBand && range!.start! < d && d < range!.end!;
                  const isToday = sameDay(d, today);
                  const band = between ? { left: 0, right: 0 } : hasBand && isStart ? { left: '50%', right: 0 } : hasBand && isEnd ? { left: 0, right: '50%' } : null;
                  return (
                    <View key={d.getTime()} style={{ flex: 1, height: cellH, alignItems: 'center', justifyContent: 'center' }}>
                      {band && (
                        <View style={[{ position: 'absolute', top: (cellH - dot) / 2, height: dot, backgroundColor: t.c.accentSoft, opacity: outside ? 0.5 : 1 }, band as ViewStyle]} />
                      )}
                      <Touchable
                        disabled={outside || disabled}
                        pressScale={0.9}
                        haptic="selection"
                        hitSlop={(cellH - dot) / 2}
                        onPress={() => pick(d)}
                        accessibilityRole="button"
                        accessibilityLabel={fmt.full.format(d) + (isToday ? ', today' : '')}
                        accessibilityState={{ selected, disabled }}
                        accessibilityElementsHidden={outside}
                        importantForAccessibility={outside ? 'no-hide-descendants' : 'auto'}
                        style={{
                          width: dot, height: dot, borderRadius: dot / 2, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: selected && !outside ? t.c.accentSolid : 'transparent',
                          borderWidth: isToday && !selected ? 1 : 0, borderColor: t.c.accent,
                        }}
                      >
                        <Text
                          variant="callout"
                          tabular
                          weight={selected || isToday ? '600' : '400'}
                          style={{ color: selected && !outside ? t.c.onAccent : outside ? t.c.textSubtle : t.c.text }}
                        >
                          {fmt.day.format(d)}
                        </Text>
                      </Touchable>
                    </View>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}
