import { useEffect, useMemo, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Button } from '../general/Button';
import { Calendar, addDays, defaultLocale, sameDay, startOfDay } from './Calendar';
import { Sheet } from './Sheet';
import { FieldTrigger, useOpenState } from './shared';

export type DatePickerProps = {
  value: Date | null;
  onValueChange: (value: Date | null) => void;
  label?: string;
  placeholder?: string;
  /** Sheet title. Default: the label. */
  title?: string;
  min?: Date;
  max?: Date;
  locale?: string;
  /** How the field shows the date. Default { dateStyle: 'medium' }. */
  format?: Intl.DateTimeFormatOptions;
  /** Today, Tomorrow and Next week chips above the calendar. Default true. */
  quickPicks?: boolean;
  /** Show a Clear button when there is a value. Default false. */
  clearable?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

/** A date field that opens a calendar sheet with quick picks. Use it for single dates in forms. */
export function DatePicker({
  value, onValueChange, label, placeholder = 'Pick a date', title, min, max, locale: localeProp, format, quickPicks = true, clearable,
  disabled, open: openProp, onOpenChange, style,
}: DatePickerProps) {
  const t = useSlate();
  const locale = localeProp ?? defaultLocale();
  const [open, setOpen] = useOpenState(openProp, onOpenChange);
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(closing.current), []);
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, format ?? { dateStyle: 'medium' }), [locale, format]);
  const today = startOfDay(new Date());
  const inRange = (d: Date) => (!min || d >= startOfDay(min)) && (!max || d <= startOfDay(max));
  const picks = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'Next week', date: addDays(today, 7) },
  ];

  // Let the selection fill show for a beat before the sheet leaves.
  const choose = (d: Date) => {
    onValueChange(d);
    clearTimeout(closing.current);
    closing.current = setTimeout(() => setOpen(false), t.motion.duration.slow);
  };

  return (
    <>
      <FieldTrigger
        label={label} valueText={value ? fmt.format(value) : undefined} placeholder={placeholder} icon="calendar" trailingIcon="chevrons-up-down"
        active={open} disabled={disabled} onPress={() => setOpen(true)} style={style}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={title ?? label}
        footer={clearable && value ? <Button variant="ghost" block onPress={() => { onValueChange(null); setOpen(false); }}>Clear</Button> : undefined}
      >
        {quickPicks && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2], paddingBottom: t.space[3] }}>
            {picks.map((p) => {
              const on = sameDay(value, p.date);
              const ok = inRange(p.date);
              return (
                <Touchable
                  key={p.label}
                  disabled={!ok}
                  haptic="selection"
                  pressScale={0.95}
                  hitSlop={(t.size.touch - t.control.sm) / 2}
                  onPress={() => choose(p.date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label}, ${fmt.format(p.date)}`}
                  accessibilityState={{ selected: on, disabled: !ok }}
                  style={{
                    height: t.control.sm, paddingHorizontal: t.space[3], justifyContent: 'center', borderRadius: t.radius.full, borderWidth: 1,
                    borderColor: on ? t.c.accentBorder : t.c.border, backgroundColor: on ? t.c.accentSoft : t.c.surfaceRaised,
                  }}
                >
                  <Text variant="label" weight="500" style={{ color: on ? t.c.accent : t.c.text }}>{p.label}</Text>
                </Touchable>
              );
            })}
          </View>
        )}
        <Calendar value={value} onValueChange={choose} min={min} max={max} locale={locale} />
      </Sheet>
    </>
  );
}
