import { useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSlate } from '../../theme';

export type CarouselProps<T> = {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  /** Card width. Default: the container width minus the insets and a peek of the next card. */
  itemWidth?: number;
  /** Space between cards. Default t.space[3]. */
  gap?: number;
  /** Leading and trailing padding, usually the screen margin. Default t.space[4]. */
  inset?: number;
  /** Page dots under the cards. Default true. */
  dots?: boolean;
  onIndexChange?: (index: number) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A horizontal, snapping row of cards that peeks the next one. For promos, plans and photos. */
export function Carousel<T>({ data, renderItem, keyExtractor, itemWidth, gap, inset, dots = true, onIndexChange, accessibilityLabel, style }: CarouselProps<T>) {
  const t = useSlate();
  const [w, setW] = useState(0);
  const g = gap ?? t.space[3];
  const pad = inset ?? t.space[4];
  const iw = itemWidth ?? Math.max(0, w - pad * 2 - t.space[6]);
  const interval = iw + g;
  const x = useSharedValue(0);
  const page = useSharedValue(0);
  const count = data.length; // copy: the worklet must not capture the items themselves
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
    if (interval > 0) page.value = Math.max(0, Math.min(count - 1, Math.round(e.contentOffset.x / interval)));
  });
  useAnimatedReaction(
    () => page.value,
    (v, prev) => { if (prev !== null && v !== prev && onIndexChange) scheduleOnRN(onIndexChange, v); },
  );

  return (
    <View style={style} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityLabel={accessibilityLabel}>
      {w > 0 && (
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={interval}
          decelerationRate="fast"
          disableIntervalMomentum
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: pad, gap: g }}
        >
          {data.map((item, i) => (
            <View key={keyExtractor ? keyExtractor(item, i) : i} style={{ width: iw }} accessibilityHint={`${i + 1} of ${data.length}`}>
              {renderItem(item, i)}
            </View>
          ))}
        </Animated.ScrollView>
      )}
      {dots && data.length > 1 && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ flexDirection: 'row', justifyContent: 'center', gap: t.space['1_5'], marginTop: t.space[3] }}
        >
          {data.map((_, i) => (
            <Dot key={i} i={i} x={x} interval={interval} size={t.space['1_5']} color={t.c.text} />
          ))}
        </View>
      )}
    </View>
  );
}

function Dot({ i, x, interval, size, color }: { i: number; x: SharedValue<number>; interval: number; size: number; color: string }) {
  const anim = useAnimatedStyle(() => {
    const d = Math.min(1, Math.abs((interval > 0 ? x.value / interval : 0) - i));
    return { opacity: interpolate(d, [0, 1], [1, 0.25]), transform: [{ scale: interpolate(d, [0, 1], [1.25, 1]) }] };
  });
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, anim]} />;
}
