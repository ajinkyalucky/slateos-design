import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

type Ctx = { open: string[]; toggle: (v: string) => void };
const AccordionContext = createContext<Ctx>({ open: [], toggle: () => {} });

export type AccordionProps = {
  /** 'single' keeps one item open at a time. Default 'single'. */
  type?: 'single' | 'multiple';
  /** Open item values (controlled). */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function AccordionRoot({ type = 'single', value, defaultValue = [], onValueChange, children, style }: AccordionProps) {
  const [own, setOwn] = useState(defaultValue);
  const open = value ?? own;
  const toggle = (v: string) => {
    const next = open.includes(v) ? open.filter((x) => x !== v) : type === 'single' ? [v] : [...open, v];
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return (
    <AccordionContext.Provider value={{ open, toggle }}>
      <View style={style}>{children}</View>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = {
  value: string;
  title: string;
  children: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function AccordionItem({ value, title, children, disabled, style }: AccordionItemProps) {
  const t = useSlate();
  const { open, toggle } = useContext(AccordionContext);
  const on = open.includes(value);
  const [h, setH] = useState(0);
  const p = useSharedValue(on ? 1 : 0);
  const reduced = t.reducedMotion;
  const spring = t.spring.standard;
  const fast = t.motion.duration.fast;
  useEffect(() => {
    p.value = reduced ? withTiming(on ? 1 : 0, { duration: fast }) : withSpring(on ? 1 : 0, spring);
  }, [on, reduced, spring, fast, p]);

  const body = useAnimatedStyle(() => ({ height: h * p.value, opacity: p.value }));
  // The content settles down into the space as it opens, so it reads as unfolding rather than being uncovered.
  const drop = t.space[2];
  const settle = useAnimatedStyle(() => ({ transform: [{ translateY: -drop * (1 - p.value) }] }));
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${p.value * 180}deg` }] }));

  return (
    <View style={[{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.c.border }, style]}>
      <Touchable
        onPress={() => toggle(value)}
        disabled={disabled}
        haptic="selection"
        pressScale={1}
        pressOpacity={0.6}
        accessibilityRole="button"
        accessibilityState={{ expanded: on, disabled: !!disabled }}
        style={{ minHeight: t.component.rowHeight, flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingVertical: t.space[3] }}
      >
        <Text variant="headline" style={{ flex: 1 }}>{title}</Text>
        <Animated.View style={chevron}>
          <Icon name="chevron-down" size={20} color={t.c.textSubtle} strokeWidth={1.75} />
        </Animated.View>
      </Touchable>
      <Animated.View
        style={[{ overflow: 'hidden' }, body]}
        accessibilityElementsHidden={!on}
        importantForAccessibility={on ? 'auto' : 'no-hide-descendants'}
      >
        {/* Measured out of flow, so its height never depends on the animating container. */}
        <Animated.View onLayout={(e) => setH(e.nativeEvent.layout.height)} style={[{ position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: t.space[4] }, settle]}>
          {typeof children === 'string' ? <Text variant="callout" tone="muted">{children}</Text> : children}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** Stacked sections that expand in place: FAQs, settings details. Single or multiple open; height springs open. */
export const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem });
