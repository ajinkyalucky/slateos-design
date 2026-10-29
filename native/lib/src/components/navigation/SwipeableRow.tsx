import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { useSlate, type Theme } from '../../theme';

export type SwipeActionTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export type SwipeAction = {
  label: string;
  icon?: IconName;
  tone?: SwipeActionTone;
  onPress: () => void;
};

export type SwipeableRowProps = {
  children: ReactNode;
  /** Revealed by swiping right. The first one sits at the outer edge and runs on a full swipe. */
  leftActions?: SwipeAction[];
  /** Revealed by swiping left. The first one sits at the outer edge and runs on a full swipe. */
  rightActions?: SwipeAction[];
  /** A long swipe runs the primary action. Default true. */
  fullSwipe?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const actionColor = (t: Theme, tone: SwipeActionTone = 'neutral') =>
  tone === 'neutral' ? t.c.textSubtle : tone === 'accent' ? t.c.accentSolid : t.c[`${tone}Solid`];

// Only one row stays open: opening one closes the last.
let openRow: { close: () => void } | null = null;

/** A list row that slides to reveal actions (Archive, Delete). A full swipe runs the primary action. */
export function SwipeableRow({ children, leftActions = [], rightActions = [], fullSwipe = true, disabled, style }: SwipeableRowProps) {
  const t = useSlate();
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const armed = useSharedValue(0);
  const start = useSharedValue(0);
  const [open, setOpen] = useState(false);
  const self = useRef({ close: () => {} }).current;
  const W = t.size.tile * 2;
  const nL = leftActions.length;
  const nR = rightActions.length;
  const spring = t.spring.standard;
  const fast = t.motion.duration.base;
  const haptic = t.haptic;

  self.close = () => {
    x.value = withSpring(0, spring);
    armed.value = 0;
    setOpen(false);
    if (openRow === self) openRow = null;
  };
  useEffect(() => () => { if (openRow === self) openRow = null; }, [self]);

  const claim = () => {
    if (openRow && openRow !== self) openRow.close();
  };
  const settle = (side: number) => {
    setOpen(side !== 0);
    if (side !== 0) openRow = self;
    else if (openRow === self) openRow = null;
  };
  const run = (a: SwipeAction | undefined) => {
    a?.onPress();
    // If the row is still here (the action did not remove it), slide it back.
    setTimeout(() => self.close(), fast);
  };
  const runPrimary = (sign: number) => run(sign > 0 ? leftActions[0] : rightActions[0]);
  const buzz = () => haptic('medium');

  const pan = usePanGesture({
    enabled: !disabled && (nL > 0 || nR > 0),
    activeOffsetX: [-10, 10],
    failOffsetY: [-10, 10],
    onActivate: () => {
      start.value = x.value;
      scheduleOnRN(claim);
    },
    onUpdate: (e) => {
      const raw = start.value + e.translationX;
      const n = raw > 0 ? nL : nR;
      const openW = n * W;
      const sign = raw > 0 ? 1 : -1;
      const r = Math.abs(raw);
      // Rubber band where there is nothing to reveal, and past the open width when full swipe is off.
      const limit = n === 0 ? 0 : fullSwipe ? w.value : openW;
      const over = Math.max(0, r - limit);
      const dim = W;
      const next = sign * (Math.min(r, limit) + dim * (1 - 1 / ((over / dim) * 0.55 + 1)));
      x.value = next;
      if (fullSwipe && n > 0) {
        const threshold = Math.max(openW + W / 2, w.value * 0.55);
        const on = r > threshold ? 1 : 0;
        if (on !== armed.value) {
          armed.value = on;
          scheduleOnRN(buzz);
        }
      }
    },
    onDeactivate: (e) => {
      const v = e.velocityX;
      const pos = x.value;
      const n = pos > 0 ? nL : nR;
      const sign = pos > 0 ? 1 : -1;
      if (armed.value === 1 && n > 0) {
        x.value = withTiming(sign * w.value, { duration: fast });
        scheduleOnRN(runPrimary, sign);
        return;
      }
      const opening = n > 0 && (Math.abs(pos) > (n * W) / 2 || v * sign > 600) && !(v * sign < -300);
      x.value = withSpring(opening ? sign * n * W : 0, { ...spring, velocity: v });
      scheduleOnRN(settle, opening ? sign : 0);
    },
  });

  const row = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const a11yActions = [...leftActions, ...rightActions].map((a) => ({ name: a.label, label: a.label }));
  const onA11y = (name: string) => [...leftActions, ...rightActions].find((a) => a.label === name)?.onPress();

  return (
    <View
      onLayout={(e) => { w.value = e.nativeEvent.layout.width; }}
      accessibilityActions={a11yActions}
      onAccessibilityAction={(e) => onA11y(e.nativeEvent.actionName)}
      style={[{ overflow: 'hidden' }, style]}
    >
      {leftActions.map((a, j) => (
        <ActionView key={a.label} action={a} side="left" j={j} n={nL} x={x} w={w} armed={armed} W={W} onPress={() => { run(a); }} />
      ))}
      {[...rightActions].reverse().map((a, j) => (
        <ActionView key={a.label} action={a} side="right" j={j} n={nR} x={x} w={w} armed={armed} W={W} onPress={() => { run(a); }} />
      ))}
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ backgroundColor: t.c.surfaceRaised }, row]}>
          {children}
          {open && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close actions"
              onPress={() => self.close()}
              style={StyleSheet.absoluteFill}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type ActionViewProps = {
  action: SwipeAction; side: 'left' | 'right'; j: number; n: number; W: number;
  x: SharedValue<number>; w: SharedValue<number>; armed: SharedValue<number>; onPress: () => void;
};

// Each action is a full-width plate whose edge tracks its slot; the primary plate takes the whole reveal when armed.
function ActionView({ action, side, j, n, W, x, w, armed, onPress }: ActionViewProps) {
  const t = useSlate();
  const bg = actionColor(t, action.tone);
  const fg = action.tone === 'accent' ? t.c.onAccent : t.c.onSolid;
  const primary = side === 'left' ? j === 0 : j === n - 1;
  const spring = t.spring.press;
  const p = useSharedValue(0);
  useAnimatedReaction(
    () => (primary ? armed.value : 0),
    (v, prev) => {
      if (v !== prev) p.value = withSpring(v, spring);
    },
  );
  const plate = useAnimatedStyle(() => {
    const r = side === 'left' ? Math.max(0, x.value) : Math.max(0, -x.value);
    const slot = r / n;
    if (side === 'left') {
      const edge = (j + 1) * slot + (r - (j + 1) * slot) * p.value;
      return { transform: [{ translateX: edge - w.value }] };
    }
    const edge = w.value - r + j * slot * (1 - p.value);
    return { transform: [{ translateX: edge }] };
  });
  const label = useAnimatedStyle(() => {
    const r = side === 'left' ? Math.max(0, x.value) : Math.max(0, -x.value);
    const centre = Math.max(0, (r / n - W) / 2);
    const shift = centre * (1 - p.value);
    return { opacity: r > W * 0.4 ? 1 : r / (W * 0.4), transform: [{ translateX: side === 'left' ? -shift : shift }] };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%', backgroundColor: bg, zIndex: side === 'left' ? n - j : j }, plate]}
    >
      <Pressable
        onPress={() => { t.haptic('light'); onPress(); }}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={{ position: 'absolute', top: 0, bottom: 0, width: W, [side === 'left' ? 'right' : 'left']: 0 }}
      >
        <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.space[1] }, label]}>
          {action.icon && <Icon name={action.icon} size={20} color={fg} strokeWidth={1.75} />}
          <Text variant="caption" weight="600" numberOfLines={1} style={{ color: fg }}>{action.label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
