import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';

export type CollapsingHeader = {
  /** The scroll view's vertical offset. */
  scrollY: SharedValue<number>;
  /** Measured height of the large title. */
  titleHeight: SharedValue<number>;
  /** Pass to an Animated.ScrollView / FlatList `onScroll`, with scrollEventThrottle={16}. */
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
};

/** Drives a Header from a scroll view: the large title scrolls away and the compact title fades in. */
export function useCollapsingHeader(): CollapsingHeader {
  const scrollY = useSharedValue(0);
  const titleHeight = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });
  return { scrollY, titleHeight, onScroll };
}

export type HeaderProps = {
  title: string;
  /** Usually an IconButton (back, close). */
  leading?: ReactNode;
  /** Usually one or two IconButtons. */
  trailing?: ReactNode;
  /** From useCollapsingHeader(). Without it the compact title always shows. */
  collapse?: CollapsingHeader;
  /** Pad for the status bar. Default true. */
  safeArea?: boolean;
  style?: StyleProp<ViewStyle>;
};

function HeaderBar({ title, leading, trailing, collapse, safeArea = true, style }: HeaderProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const zero = useSharedValue(0);
  const y = collapse?.scrollY ?? zero;
  const th = collapse?.titleHeight ?? zero;
  const always = !collapse;
  const lift = t.space[1];
  const compact = useAnimatedStyle(() => {
    if (always) return { opacity: 1, transform: [{ translateY: 0 }] };
    const h = th.value || 1;
    const f = interpolate(y.value, [h * 0.55, h * 0.95], [0, 1], Extrapolation.CLAMP);
    return { opacity: f, transform: [{ translateY: (1 - f) * lift }] };
  });
  const rule = useAnimatedStyle(() => ({
    opacity: always ? 0 : interpolate(y.value, [th.value, th.value + lift * 2], [0, 1], Extrapolation.CLAMP),
  }));
  return (
    <View style={[{ backgroundColor: t.c.bg, paddingTop: safeArea ? insets.top : 0 }, style]}>
      <View style={{ height: t.component.headerHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space[1] }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>{leading}</View>
        <Animated.View style={[{ maxWidth: '60%' }, compact]}>
          <Text variant="headline" numberOfLines={1} accessibilityRole="header">{title}</Text>
        </Animated.View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>{trailing}</View>
      </View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.c.border }, rule]} />
    </View>
  );
}

export type LargeTitleProps = { children: string; collapse: CollapsingHeader; style?: StyleProp<ViewStyle> };

/** The large title: place it first inside the scroll view. It stretches a little on pull-down. */
function LargeTitle({ children, collapse, style }: LargeTitleProps) {
  const t = useSlate();
  const { scrollY, titleHeight } = collapse;
  const stretch = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + Math.min(Math.max(-scrollY.value, 0), 120) / 1200 }],
  }));
  return (
    <Animated.View
      onLayout={(e) => { titleHeight.value = e.nativeEvent.layout.height; }}
      style={[{ paddingHorizontal: t.component.screenPadding, paddingTop: t.space[1], paddingBottom: t.space[2], transformOrigin: 'left center' }, stretch, style]}
    >
      <Text variant="title1" numberOfLines={1} accessibilityElementsHidden importantForAccessibility="no">{children}</Text>
    </Animated.View>
  );
}

/**
 * A screen header for apps without native headers: leading and trailing slots and a centred compact title.
 * With useCollapsingHeader and Header.LargeTitle, a large title scrolls away into the compact one.
 */
export const Header = Object.assign(HeaderBar, { LargeTitle });
/** Alias of Header. */
export const LargeHeader = Header;
