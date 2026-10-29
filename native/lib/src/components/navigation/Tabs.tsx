import { Children, isValidElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type LayoutRectangle, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

export type TabItem<T extends string = string> = { value: T; label: string; /** A count after the label. */ badge?: number };

export type TabsProps<T extends string = string> = {
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  variant?: 'underline' | 'pill';
  /** Scroll the tab strip sideways. Default: on when there are more than 4 tabs. */
  scrollable?: boolean;
  /** Tabs.Content panels. Swipe between them; the indicator follows the finger. */
  children?: ReactNode;
  /** Swipe between panels. Default true when there are panels. */
  swipeable?: boolean;
  style?: StyleProp<ViewStyle>;
};

export type TabsContentProps = { value: string; children: ReactNode };

/** One panel of Tabs, shown when its value is selected. */
function TabsContent({ children }: TabsContentProps) {
  return <>{children}</>;
}

function TabsRoot<T extends string = string>({
  items, value, onValueChange, variant = 'underline', scrollable = items.length > 4, children, swipeable = true, style,
}: TabsProps<T>) {
  const t = useSlate();
  const n = items.length;
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  const p = useSharedValue(index);
  const xs = useSharedValue<number[]>([]);
  const ws = useSharedValue<number[]>([]);
  const pw = useSharedValue(0);
  const tabL = useRef<LayoutRectangle[]>([]);
  const textL = useRef<LayoutRectangle[]>([]);
  const strip = useRef<ScrollViewInstance>(null);
  const stripW = useRef(0);
  const pager = useAnimatedRef<Animated.ScrollView>();
  const [pageW, setPageW] = useState(0);
  const underline = variant === 'underline';
  const reduced = t.reducedMotion;
  const spring = t.spring.standard;

  const panels = Children.toArray(children).filter(
    (c): c is ReactElement<TabsContentProps> => isValidElement(c) && c.type === TabsContent,
  );
  const paged = panels.length > 0 && swipeable;

  const sync = () => {
    const ready = items.every((_, i) => tabL.current[i] && textL.current[i]);
    if (!ready) return;
    xs.value = items.map((_, i) => (underline ? tabL.current[i].x + textL.current[i].x : tabL.current[i].x));
    ws.value = items.map((_, i) => (underline ? textL.current[i].width : tabL.current[i].width));
  };

  // Follow the selected tab: spring the indicator, page the panels, keep the tab in view.
  useEffect(() => {
    if (paged && pageW) pager.current?.scrollTo({ x: index * pageW, animated: !reduced });
    else if (!paged) p.value = reduced ? withTiming(index, { duration: t.motion.duration.fast }) : withSpring(index, spring);
    const tab = tabL.current[index];
    if (scrollable && tab) strip.current?.scrollTo({ x: Math.max(0, tab.x + tab.width / 2 - stripW.current / 2), animated: !reduced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paged, pageW]);

  const latest = useRef({ items, value, onValueChange });
  latest.current = { items, value, onValueChange };
  const [pick] = useState(() => (i: number) => {
    const { items: list, value: v, onValueChange: set } = latest.current;
    if (list[i] && list[i].value !== v) set(list[i].value);
  });

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (pw.value) p.value = e.contentOffset.x / pw.value;
    },
    onMomentumEnd: (e) => {
      if (pw.value) scheduleOnRN(pick, Math.round(e.contentOffset.x / pw.value));
    },
  });

  const indicator = useAnimatedStyle(() => {
    const X = xs.value;
    const Wd = ws.value;
    if (X.length < n) return { opacity: 0, width: 0, transform: [{ translateX: 0 }] };
    const i = Math.min(Math.max(p.value, 0), n - 1);
    const a = Math.floor(i);
    const b = Math.min(a + 1, n - 1);
    const f = i - a;
    return { opacity: 1, width: Wd[a] + (Wd[b] - Wd[a]) * f, transform: [{ translateX: X[a] + (X[b] - X[a]) * f }] };
  });

  const tabs = (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', flexGrow: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[
          underline
            ? { position: 'absolute', left: 0, bottom: 0, height: 2, borderRadius: 1, backgroundColor: t.c.accent }
            : { position: 'absolute', left: 0, top: (t.control.md - t.control.sm) / 2, height: t.control.sm, borderRadius: t.radius.full, backgroundColor: t.c.accentSoft },
          indicator,
        ]}
      />
      {items.map((item, i) => {
        const on = i === index;
        return (
          <Touchable
            key={item.value}
            onPress={() => onValueChange(item.value)}
            haptic={on ? false : 'selection'}
            pressScale={1}
            pressOpacity={0.6}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.badge ? `${item.label}, ${item.badge}` : item.label}
            onLayout={(e) => { tabL.current[i] = e.nativeEvent.layout; sync(); }}
            style={[
              { height: t.control.md, paddingHorizontal: t.space[3], flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
              !scrollable && { flex: 1 },
            ]}
          >
            <View
              onLayout={(e) => { textL.current[i] = e.nativeEvent.layout; sync(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: t.space['1_5'] }}
            >
              <Text variant="label" tone={on ? 'default' : 'subtle'} numberOfLines={1}>{item.label}</Text>
              {item.badge ? <Text variant="caption" tone="subtle" tabular>{item.badge}</Text> : null}
            </View>
          </Touchable>
        );
      })}
    </View>
  );

  return (
    <View style={style}>
      <View style={underline ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.c.border } : undefined}>
        {scrollable ? (
          <ScrollView
            ref={strip}
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={(e) => { stripW.current = e.nativeEvent.layout.width; }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {tabs}
          </ScrollView>
        ) : (
          tabs
        )}
      </View>
      {panels.length > 0 &&
        (paged ? (
          <View onLayout={(e) => { const w = e.nativeEvent.layout.width; pw.value = w; setPageW(w); }}>
            {pageW > 0 && (
              <Animated.ScrollView
                ref={pager}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                directionalLockEnabled
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentOffset={{ x: index * pageW, y: 0 }}
              >
                {items.map((item) => (
                  <View key={item.value} style={{ width: pageW }} accessibilityElementsHidden={item.value !== value}>
                    {panels.find((c) => c.props.value === item.value)}
                  </View>
                ))}
              </Animated.ScrollView>
            )}
          </View>
        ) : (
          panels.find((c) => c.props.value === value)
        ))}
    </View>
  );
}

/** Top tabs with a sliding indicator sized to the label. Add Tabs.Content panels to swipe between pages. */
export const Tabs = Object.assign(TabsRoot, { Content: TabsContent });
