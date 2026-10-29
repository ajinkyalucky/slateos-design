import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Checkbox, EmptyState, IconButton, Input, Progress, Select, SwipeableRow, Text, useSlate, type SelectOption,
} from '@ajinkyabhagwat/slateos-native';

export type GroceryAisle = 'Produce' | 'Dairy' | 'Bakery' | 'Pantry' | 'Frozen' | 'Household';

export type GroceryItem = { id: string; name: string; quantity: string; aisle: GroceryAisle; checked?: boolean };

export type GroceryListScreenProps = {
  title?: string;
  items?: GroceryItem[];
  /** Called with the current list, checked items included. */
  onShare?: (items: GroceryItem[]) => void;
  /** Called after every change: add, check, delete or clear. */
  onItemsChange?: (items: GroceryItem[]) => void;
};

const AISLES: GroceryAisle[] = ['Produce', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Household'];
const AISLE_OPTIONS: SelectOption<GroceryAisle>[] = AISLES.map((a) => ({ value: a, label: a }));

const DEFAULT_ITEMS: GroceryItem[] = [
  { id: '1', name: 'Avocados', quantity: '3', aisle: 'Produce', checked: true },
  { id: '2', name: 'Baby spinach', quantity: '1 bag', aisle: 'Produce' },
  { id: '3', name: 'Lemons', quantity: '4', aisle: 'Produce', checked: true },
  { id: '4', name: 'Cherry tomatoes', quantity: '1 punnet', aisle: 'Produce', checked: true },
  { id: '5', name: 'Greek yoghurt', quantity: '500 g', aisle: 'Dairy', checked: true },
  { id: '6', name: 'Oat milk', quantity: '2 L', aisle: 'Dairy' },
  { id: '7', name: 'Feta', quantity: '200 g', aisle: 'Dairy', checked: true },
  { id: '8', name: 'Sourdough loaf', quantity: '1', aisle: 'Bakery', checked: true },
  { id: '9', name: 'Bagels', quantity: '6', aisle: 'Bakery' },
  { id: '10', name: 'Basmati rice', quantity: '1 kg', aisle: 'Pantry', checked: true },
  { id: '11', name: 'Chickpeas', quantity: '2 tins', aisle: 'Pantry' },
  { id: '12', name: 'Olive oil', quantity: '1 bottle', aisle: 'Pantry', checked: true },
  { id: '13', name: 'Frozen peas', quantity: '1 bag', aisle: 'Frozen' },
  { id: '14', name: 'Dish soap', quantity: '1', aisle: 'Household' },
];

// "2 avocados" → quantity "2", name "Avocados". Anything else is a single item.
function parse(text: string) {
  const m = text.trim().match(/^(\d+(?:\.\d+)?\s?(?:kg|g|l|ml|lb|oz|x)?)\s+(.+)$/i);
  const [quantity, name] = m ? [m[1].replace(/x$/i, ''), m[2]] : ['1', text.trim()];
  return { quantity: quantity.trim(), name: name.charAt(0).toUpperCase() + name.slice(1) };
}

/** A shopping list by aisle: add items, check them into the basket, swipe to delete, clear what is done. */
export function GroceryListScreen({ title = 'Groceries', items = DEFAULT_ITEMS, onShare, onItemsChange }: GroceryListScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [list, setList] = useState(items);
  // Where each item sits. It follows `checked` a beat later, so the tick draws before the row moves.
  const [inBasket, setInBasket] = useState(() => new Set(items.filter((i) => i.checked).map((i) => i.id)));
  const [draft, setDraft] = useState('');
  const [aisle, setAisle] = useState<GroceryAisle>('Produce');
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const sink = t.motion.duration.slow;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const commit = (next: GroceryItem[]) => {
    setList(next);
    onItemsChange?.(next);
  };

  const toggle = (id: string, checked: boolean) => {
    commit(list.map((i) => (i.id === id ? { ...i, checked } : i)));
    clearTimeout(timers.current.get(id));
    timers.current.set(id, setTimeout(() => {
      setInBasket((s) => {
        const n = new Set(s);
        if (checked) n.add(id); else n.delete(id);
        return n;
      });
    }, sink));
  };

  const add = () => {
    if (!draft.trim()) return;
    const { name, quantity } = parse(draft);
    commit([{ id: `${Date.now()}`, name, quantity, aisle }, ...list]);
    setDraft('');
    t.haptic('light');
  };

  const remove = (id: string) => commit(list.filter((i) => i.id !== id));

  const clearChecked = () => {
    commit(list.filter((i) => !i.checked));
    setInBasket(new Set());
    t.haptic('success');
  };

  const done = list.filter((i) => i.checked).length;
  const groups = useMemo(
    () => AISLES.map((a) => ({ aisle: a, rows: list.filter((i) => i.aisle === a && !inBasket.has(i.id)) })).filter((g) => g.rows.length),
    [list, inBasket],
  );
  const basket = list.filter((i) => inBasket.has(i.id));

  const row = (item: GroceryItem, i: number, count: number) => (
    <Animated.View key={item.id} layout={LinearTransition.springify().damping(24)} entering={FadeIn} exiting={FadeOut}>
      <SwipeableRow rightActions={[{ label: 'Delete', icon: 'trash', tone: 'danger', onPress: () => remove(item.id) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingLeft: t.space[2], paddingRight: t.space[4] }}>
          <Checkbox
            checked={!!item.checked}
            onValueChange={(v) => toggle(item.id, v)}
            label={item.name}
            accessibilityLabel={`${item.name}, ${item.quantity}`}
            style={{ flex: 1 }}
          />
          <Text variant="callout" tone={item.checked ? 'subtle' : 'muted'} tabular>{item.quantity}</Text>
        </View>
        {i < count - 1 && (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.c.border, marginLeft: t.space[2] + t.size.touch }} />
        )}
      </SwipeableRow>
    </Animated.View>
  );

  const group = (key: string, heading: string, rows: GroceryItem[], action?: ReactNode) => (
    <Animated.View key={key} layout={LinearTransition.springify().damping(24)} entering={FadeIn} exiting={FadeOut} style={{ gap: t.space[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.space[4], minHeight: t.space[5] }}>
        <Text variant="overline" tone="subtle" accessibilityRole="header">{heading}</Text>
        {action}
      </View>
      <View style={{ backgroundColor: t.c.surfaceRaised, borderRadius: t.component.listRadius, borderWidth: StyleSheet.hairlineWidth, borderColor: t.c.border, overflow: 'hidden' }}>
        {rows.map((r, i) => row(r, i, rows.length))}
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[2], paddingBottom: t.space[3], gap: t.space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title1" accessibilityRole="header">{title}</Text>
          <IconButton icon="share" variant="soft" round accessibilityLabel="Share list" onPress={() => onShare?.(list)} />
        </View>
        <View style={{ gap: t.space[2] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="footnote" tone="muted" tabular>{done} of {list.length} in the basket</Text>
            {list.length > 0 && done === list.length && <Text variant="footnote" tone="success" weight="500">All done</Text>}
          </View>
          <Progress value={done} max={Math.max(1, list.length)} tone={list.length > 0 && done === list.length ? 'success' : 'accent'} accessibilityLabel="Items in the basket" />
        </View>
        <View style={{ flexDirection: 'row', gap: t.space[2] }}>
          <Input
            value={draft}
            onChangeText={setDraft}
            placeholder="Add an item, e.g. 2 limes"
            accessibilityLabel="New item"
            icon="plus"
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={add}
            style={{ flex: 1 }}
          />
          <Select<GroceryAisle> placeholder="Aisle" title="Add to aisle" options={AISLE_OPTIONS} value={aisle} onValueChange={setAisle} style={{ width: t.size.width2xs }} />
        </View>
      </View>

      {list.length === 0 ? (
        <EmptyState icon="list" title="Your list is empty" description="Add what you need above. Items you check sink into the basket." style={{ flex: 1 }} />
      ) : (
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[2], paddingBottom: insets.bottom + t.space[10], gap: t.space[5] }}
        >
          {groups.map((g) => group(g.aisle, g.aisle, g.rows))}
          {basket.length > 0 &&
            group('basket', `In the basket · ${basket.length}`, basket, (
              <Button variant="link" size="sm" onPress={clearChecked}>Clear checked</Button>
            ))}
        </ScrollView>
      )}
    </View>
  );
}
