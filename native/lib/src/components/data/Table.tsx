import { useMemo, useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, LinearTransition, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Crossfade, useToggleProgress } from '../../primitives/Crossfade';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate, type Theme } from '../../theme';

export type TableColumn<T> = {
  key: string;
  title: string;
  /** Points. Default t.space[12]; the first column defaults to t.size.width2xs. */
  width?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  /** The raw value, for sorting and default rendering. Default: row[key]. */
  value?: (row: T) => string | number;
  /** Custom cell content. */
  render?: (row: T) => ReactNode;
};

export type TableSort = { key: string; direction: 'asc' | 'desc' };

export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  /** A stable key per row; `index` is its position in `data`. Default: that index. */
  keyExtractor?: (row: T, index: number) => string;
  /** Keep the first column in place while the rest scroll sideways. Default true. */
  stickyFirstColumn?: boolean;
  /** Alternate row backgrounds instead of hairlines. */
  striped?: boolean;
  /** Controlled sort. Leave undefined to sort internally (starting from defaultSort). */
  sort?: TableSort | null;
  defaultSort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  style?: StyleProp<ViewStyle>;
};

const get = <T,>(col: TableColumn<T>, row: T) => (col.value ? col.value(row) : ((row as Record<string, unknown>)[col.key] as string | number));

/** A compact data table that scrolls sideways, with a pinned first column and sortable headers. */
export function Table<T>({ columns, data, keyExtractor, stickyFirstColumn = true, striped, sort, defaultSort, onSortChange, style }: TableProps<T>) {
  const t = useSlate();
  const [inner, setInner] = useState<TableSort | null>(defaultSort ?? null);
  const active = sort !== undefined ? sort : inner;
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { x.value = e.contentOffset.x; });
  const edge = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, 8], [0, 1], 'clamp') }));

  // Rows keep their original index, so the default key follows the row (not its slot) and sorting can animate.
  const rows = useMemo(() => {
    const indexed = data.map((r, i) => [r, i] as const);
    const col = active && columns.find((c) => c.key === active.key);
    if (!col || !active) return indexed;
    const dir = active.direction === 'asc' ? 1 : -1;
    return indexed.slice().sort(([a, i], [b, j]) => {
      const va = get(col, a), vb = get(col, b);
      const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return c * dir || i - j;
    });
  }, [data, columns, active]);
  // On a new sort each row glides to its new place; both halves share the spring, so they stay level.
  const { duration, dampingRatio } = t.spring.standard;
  const move = useMemo(() => LinearTransition.springify(duration).dampingRatio(dampingRatio), [duration, dampingRatio]);

  const toggle = (key: string) => {
    const next: TableSort = { key, direction: active?.key === key && active.direction === 'asc' ? 'desc' : 'asc' };
    if (sort === undefined) setInner(next);
    onSortChange?.(next);
  };

  const widthOf = (c: TableColumn<T>, i: number) => c.width ?? (i === 0 ? t.size.width2xs : t.space[12]);
  const rowKey = (r: T, i: number) => (keyExtractor ? keyExtractor(r, i) : String(i));
  const rowH = t.component.rowHeight;
  const pinned = stickyFirstColumn ? columns.slice(0, 1) : [];
  const scrolling = stickyFirstColumn ? columns.slice(1) : columns;

  const part = (cols: TableColumn<T>[], offset: number) => (
    <View style={{ flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', height: t.control.md, backgroundColor: t.c.surface, borderBottomWidth: 1, borderBottomColor: t.c.border }} accessibilityRole="header">
        {cols.map((c, i) => (
          <HeaderCell key={c.key} t={t} col={c} width={widthOf(c, i + offset)} sort={active?.key === c.key ? active.direction : null} onPress={() => toggle(c.key)} />
        ))}
      </View>
      <View>
        {/* Stripes and hairlines belong to the slots, not the rows, so they hold still while rows move. */}
        {rows.map((_, ri) => (
          <View
            key={ri}
            pointerEvents="none"
            style={{
              position: 'absolute', left: 0, right: 0, top: ri * rowH, height: rowH,
              backgroundColor: striped && ri % 2 ? t.c.surface : t.c.surfaceRaised,
              borderTopWidth: !striped && ri ? 1 : 0,
              borderTopColor: t.c.borderSubtle,
            }}
          />
        ))}
        {rows.map(([r, oi]) => (
          <Animated.View key={rowKey(r, oi)} layout={move} style={{ flexDirection: 'row', height: rowH }}>
            {cols.map((c, i) => {
              const v = get(c, r);
              return (
                <View key={c.key} style={{ width: widthOf(c, i + offset), paddingHorizontal: t.space[3], justifyContent: 'center', alignItems: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start' }}>
                  {c.render ? c.render(r) : (
                    <Text variant="callout" weight={offset === 0 && i === 0 ? '500' : undefined} tabular={typeof v === 'number'} numberOfLines={1}>
                      {v}
                    </Text>
                  )}
                </View>
              );
            })}
          </Animated.View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[{ flexDirection: 'row', borderRadius: t.component.listRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden', backgroundColor: t.c.surfaceRaised }, style]}>
      {stickyFirstColumn && (
        <View style={{ zIndex: 1 }}>
          {part(pinned, 0)}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 1, backgroundColor: t.c.border }, edge]} />
        </View>
      )}
      <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {part(scrolling, stickyFirstColumn ? 1 : 0)}
      </Animated.ScrollView>
    </View>
  );
}

function HeaderCell<T>({ t, col, width, sort, onPress }: { t: Theme; col: TableColumn<T>; width: number; sort: 'asc' | 'desc' | null; onPress: () => void }) {
  const justify = col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start';
  const on = useToggleProgress(!!sort);
  // The arrow turns over between ascending and descending rather than flipping in one frame.
  const flip = useToggleProgress(sort === 'desc');
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${flip.value * 180}deg` }] }));
  const label = (
    <Crossfade
      progress={on}
      on={<Text variant="footnote" weight="600" numberOfLines={1}>{col.title}</Text>}
      off={<Text variant="footnote" weight="600" tone="muted" numberOfLines={1}>{col.title}</Text>}
      style={{ flexShrink: 1 }}
    />
  );
  const box: ViewStyle = { width, height: '100%', paddingHorizontal: t.space[3], flexDirection: 'row', alignItems: 'center', justifyContent: justify, gap: t.space[1] };
  if (!col.sortable) return <View style={box}>{label}</View>;
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={1}
      pressOpacity={0.6}
      hitSlop={0}
      accessibilityLabel={`${col.title}, ${sort === 'asc' ? 'sorted ascending' : sort === 'desc' ? 'sorted descending' : 'not sorted'}`}
      accessibilityHint="Sorts the table by this column"
      style={box}
    >
      {label}
      <Crossfade
        progress={on}
        on={
          <Animated.View style={turn}>
            <Icon name="sort-asc" size={t.size.iconSm} color={t.c.text} strokeWidth={1.75} />
          </Animated.View>
        }
        off={<Icon name="chevrons-up-down" size={t.size.iconSm} color={t.c.textDisabled} strokeWidth={1.75} />}
      />
    </Touchable>
  );
}
