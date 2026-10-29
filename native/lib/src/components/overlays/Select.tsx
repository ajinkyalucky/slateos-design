import { useState } from 'react';
import { TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Button } from '../general/Button';
import { Sheet, SheetScrollView } from './Sheet';
import { FieldTrigger, useOpenState } from './shared';

export type SelectOption<V extends string | number = string> = {
  value: V;
  label: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
};

type SelectBase<V extends string | number> = {
  options: SelectOption<V>[];
  label?: string;
  placeholder?: string;
  /** Sheet title. Default: the label. */
  title?: string;
  /** Show a search field in the sheet. Default: more than 10 options. */
  searchable?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  style?: StyleProp<ViewStyle>;
};
export type SelectProps<V extends string | number = string> = SelectBase<V> & (
  | { multiple?: false; value: V | null; onValueChange: (value: V) => void }
  | { multiple: true; value: V[]; onValueChange: (value: V[]) => void }
);

/** A field that opens a sheet of options. Use it instead of a menu when the choice is a form value. */
export function Select<V extends string | number = string>(props: SelectProps<V>) {
  const { options, label, placeholder = 'Select', title, disabled, style } = props;
  const t = useSlate();
  const [open, setOpen] = useOpenState(props.open, props.onOpenChange);
  const [query, setQuery] = useState('');
  const searchable = props.searchable ?? options.length > 10;
  const chosen = props.multiple ? props.value : props.value == null ? [] : [props.value];
  const labels = options.filter((o) => chosen.includes(o.value)).map((o) => o.label);
  const valueText = !labels.length ? undefined : labels.length <= 2 ? labels.join(', ') : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q)) : options;
  const tall = searchable || options.length > 7;

  const toggle = (v: V) => {
    if (props.multiple) props.onValueChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else { props.onValueChange(v); setOpen(false); }
  };
  const openSheet = () => { setQuery(''); setOpen(true); };

  const rows = shown.map((o) => {
    const on = chosen.includes(o.value);
    return (
      <Touchable
        key={String(o.value)}
        disabled={o.disabled}
        pressScale={0.98}
        haptic="selection"
        hitSlop={0}
        pressedStyle={{ backgroundColor: t.c.surfaceHover }}
        onPress={() => toggle(o.value)}
        accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
        accessibilityLabel={o.description ? `${o.label}, ${o.description}` : o.label}
        accessibilityState={{ checked: on, selected: on, disabled: !!o.disabled }}
        style={{
          minHeight: t.component.rowHeight, flexDirection: 'row', alignItems: 'center', gap: t.space[3],
          paddingHorizontal: t.space[3], paddingVertical: t.space[2], borderRadius: t.radius.lg, borderCurve: 'continuous',
        }}
      >
        {o.icon && <Icon name={o.icon} size={20} color={t.c.textMuted} />}
        <View style={{ flex: 1, gap: t.space['0_5'] }}>
          <Text weight={on ? '500' : '400'} numberOfLines={1}>{o.label}</Text>
          {o.description && <Text variant="footnote" tone="subtle" numberOfLines={2}>{o.description}</Text>}
        </View>
        <View style={{ width: 20, alignItems: 'flex-end' }}>{on && <Icon name="check" size={20} color={t.c.accent} strokeWidth={2} />}</View>
      </Touchable>
    );
  });

  return (
    <>
      <FieldTrigger
        label={label} valueText={valueText} placeholder={placeholder} trailingIcon="chevrons-up-down"
        active={open} disabled={disabled} onPress={openSheet} style={style}
      />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={title ?? label}
        detents={tall ? [0.6, 0.92] : ['auto']}
        padded={false}
        footer={props.multiple ? <Button block onPress={() => setOpen(false)}>Done</Button> : undefined}
      >
        {searchable && (
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: t.space[2], height: t.control.md, marginHorizontal: t.space[4], marginBottom: t.space[2],
              paddingHorizontal: t.space[3], borderRadius: t.component.inputRadius, backgroundColor: t.c.surfaceHover,
            }}
          >
            <Icon name="search" size={16} color={t.c.textSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={t.c.textSubtle}
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
              accessibilityLabel="Search options"
              maxFontSizeMultiplier={2}
              style={[t.type.body, { flex: 1, color: t.c.text, paddingVertical: 0 }]}
            />
          </View>
        )}
        <SheetScrollView contentContainerStyle={{ paddingHorizontal: t.space[2] }} accessibilityRole={props.multiple ? undefined : 'radiogroup'}>
          {rows}
          {!shown.length && <Text tone="subtle" align="center" style={{ paddingVertical: t.space[6] }}>No matches for “{query.trim()}”</Text>}
        </SheetScrollView>
      </Sheet>
    </>
  );
}
