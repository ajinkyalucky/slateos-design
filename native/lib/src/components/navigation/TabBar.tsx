import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crossfade, useToggleProgress } from '../../primitives/Crossfade';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

export type TabBarItem<T extends string = string> = {
  value: T;
  label: string;
  icon: IconName;
  /** A count, or true for a dot. */
  badge?: number | boolean;
};

export type TabBarProps<T extends string = string> = {
  items: TabBarItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Called when the selected tab is tapped again, e.g. to scroll to top. */
  onReselect?: (value: T) => void;
  /** Pad for the home indicator. Default true. */
  safeArea?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A bottom tab bar: icon, label and an optional badge, tinted with the accent when selected.
 * Works as a custom `tabBar` for expo-router and React Navigation tabs.
 */
export function TabBar<T extends string = string>({ items, value, onValueChange, onReselect, safeArea = true, style }: TabBarProps<T>) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          backgroundColor: t.c.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: t.c.border,
          paddingBottom: safeArea ? insets.bottom : 0,
        },
        style,
      ]}
    >
      {items.map((item) => (
        <TabBarButton
          key={item.value}
          item={item}
          selected={item.value === value}
          onPress={() => (item.value === value ? onReselect?.(item.value) : onValueChange(item.value))}
        />
      ))}
    </View>
  );
}

function TabBarButton<T extends string>({ item, selected, onPress }: { item: TabBarItem<T>; selected: boolean; onPress: () => void }) {
  const t = useSlate();
  const s = useSharedValue(1);
  const reduced = t.reducedMotion;
  const bouncy = t.spring.bouncy;
  useEffect(() => {
    if (!selected || reduced) return;
    s.value = 0.86;
    s.value = withSpring(1, bouncy);
  }, [selected, reduced, bouncy, s]);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const tint = useToggleProgress(selected, t.spring.press);
  const count = typeof item.badge === 'number' && item.badge > 0 ? item.badge : 0;
  const dot = item.badge === true;
  const dotSize = t.space[2] + 4; // 8pt dot plus its 2pt ring
  const pill = t.space[4] + t.space[1];
  return (
    <Touchable
      onPress={onPress}
      haptic={selected ? false : 'selection'}
      pressScale={0.94}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={count ? `${item.label}, ${count} new` : dot ? `${item.label}, new` : item.label}
      style={{ flex: 1, minHeight: t.component.tabBarHeight, alignItems: 'center', justifyContent: 'center', paddingTop: t.space['1_5'], paddingBottom: t.space[1], gap: t.space['0_5'] }}
    >
      <Animated.View style={pop}>
        <Crossfade
          progress={tint}
          on={<Icon name={item.icon} size={24} color={t.c.accent} strokeWidth={2} />}
          off={<Icon name={item.icon} size={24} color={t.c.textSubtle} strokeWidth={1.5} />}
        />
        {(count > 0 || dot) && (
          <View
            style={{
              position: 'absolute',
              top: dot ? -2 : -t.space[1],
              left: dot ? 24 - dotSize / 2 - 2 : 24 - pill / 2,
              minWidth: dot ? dotSize : pill,
              height: dot ? dotSize : pill,
              paddingHorizontal: dot ? 0 : t.space[1],
              borderRadius: t.radius.full,
              backgroundColor: t.c.dangerSolid,
              borderWidth: 2,
              borderColor: t.c.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {count > 0 && (
              <Text variant="caption" weight="600" tabular style={{ color: t.c.onSolid, fontSize: t.type.overline.fontSize, lineHeight: t.type.overline.lineHeight }}>
                {count > 99 ? '99+' : count}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
      <Crossfade
        progress={tint}
        on={<Text variant="caption" weight="600" numberOfLines={1} style={{ color: t.c.accent }}>{item.label}</Text>}
        off={<Text variant="caption" weight="500" numberOfLines={1} style={{ color: t.c.textSubtle }}>{item.label}</Text>}
      />
    </Touchable>
  );
}
