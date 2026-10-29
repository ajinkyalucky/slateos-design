import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, View, useWindowDimensions, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useNativeGesture, usePanGesture, type PanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation, interpolate, scrollTo, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { Backdrop, rubberband, useBackHandler, useKeyboardHeight, usePresence } from './shared';

/** 'auto' sizes to the content; a number is a fraction of the screen height. */
export type SheetDetent = 'auto' | number;

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resting heights, e.g. ['auto'] or [0.5, 0.92]. Default ['auto']. */
  detents?: SheetDetent[];
  /** Index into `detents` to open at. Default 0. */
  initialDetent?: number;
  onDetentChange?: (index: number) => void;
  title?: string;
  description?: string;
  /** Pinned under the content, above the safe area and the keyboard. */
  footer?: ReactNode;
  /** Drag down, tap the backdrop or press back to close. Default true. */
  dismissible?: boolean;
  /** Horizontal padding around the content. Default true. */
  padded?: boolean;
  accessibilityLabel?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type SheetCtx = { pan: PanGesture; y: SharedValue<number>; top: SharedValue<number>; scrollY: SharedValue<number>; inScroll: SharedValue<boolean>; fill: boolean };
const SheetContext = createContext<SheetCtx | null>(null);

/**
 * A bottom sheet with detents, a drag handle, rubber-banding and velocity-aware snapping.
 * Use it for focused tasks and pickers that keep the screen behind in view.
 */
export function Sheet(props: SheetProps) {
  const { mounted, onExited } = usePresence(props.open);
  if (!mounted) return null;
  return (
    <Portal modal>
      <SheetLayer {...props} onExited={onExited} />
    </Portal>
  );
}

function SheetLayer({
  open, onOpenChange, detents = ['auto'], initialDetent = 0, onDetentChange, title, description, footer, dismissible = true, padded = true,
  accessibilityLabel, children, style, onExited,
}: SheetProps & { onExited: () => void }) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const maxH = screenH - insets.top - t.space[2];
  const fractions = detents.filter((d): d is number => typeof d === 'number');
  const hasAuto = detents.includes('auto');
  const fixedH = fractions.length ? Math.min(maxH, Math.max(...fractions) * screenH) : undefined;
  const fill = fixedH !== undefined && !hasAuto;
  const [colH, setColH] = useState(0);
  const first = Math.max(0, Math.min(initialDetent, detents.length - 1));
  const [current, setCurrent] = useState(first);
  const ready = colH > 0;
  const boxH = fixedH ?? Math.min(colH, maxH);
  const positions = detents.map((d) => boxH - Math.min(boxH, d === 'auto' ? colH : d * screenH));
  const topY = Math.min(...positions), lowY = Math.max(...positions);
  const closedY = boxH + t.space[5];
  const limit = t.space[12];
  const spring = t.spring.standard;
  const kbInset = insets.bottom, safeTop = insets.top, screen = screenH;

  const y = useSharedValue(screenH);
  const top = useSharedValue(topY);
  const idx = useSharedValue(first);
  const scrollY = useSharedValue(0);
  const inScroll = useSharedValue(false);
  const fromScroll = useSharedValue(false);
  const anchor = useSharedValue(0);
  const kb = useKeyboardHeight();

  useEffect(() => { top.value = topY; }, [top, topY]);
  useEffect(() => {
    if (open) { if (ready) y.value = withSpring(positions[idx.value] ?? topY, spring); return; }
    Keyboard.dismiss();
    if (!ready) return onExited();
    y.value = withSpring(closedY, spring, (done) => { if (done) scheduleOnRN(onExited); });
    // Re-snap when the content or screen size changes, too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ready, boxH, colH, screenH]);

  const haptic = t.haptic;
  const close = () => onOpenChange(false);
  const settled = (i: number) => { haptic('light'); setCurrent(i); onDetentChange?.(i); };
  useBackHandler(open, () => { if (dismissible) close(); });

  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    // Fail before horizontal children (calendar, carousel, swipe rows) claim the drag.
    failOffsetX: [-10, 10],
    onActivate: () => {
      anchor.value = y.value;
      fromScroll.value = inScroll.value;
    },
    onUpdate: (e) => {
      // A drag that starts in a SheetScrollView scrolls the list until it reaches the top, then moves the sheet.
      if (fromScroll.value && y.value <= topY + 0.5 && (scrollY.value > 0 || anchor.value + e.translationY < topY)) {
        anchor.value = topY - e.translationY;
        y.value = topY;
        return;
      }
      let next = anchor.value + e.translationY;
      if (next < topY) next = topY - rubberband(topY - next, limit);
      else if (!dismissible && next > lowY) next = lowY + rubberband(next - lowY, limit);
      y.value = next;
    },
    onDeactivate: (e) => {
      if (fromScroll.value && y.value <= topY + 0.5 && scrollY.value > 0) return;
      const v = e.velocityY;
      const projected = y.value + v * 0.15;
      let best = 0;
      for (let i = 1; i < positions.length; i++) if (Math.abs(positions[i] - projected) < Math.abs(positions[best] - projected)) best = i;
      const flungAway = v > 1500 && y.value >= lowY;
      if (dismissible && (flungAway || Math.abs(closedY - projected) < Math.abs(positions[best] - projected))) {
        y.value = withSpring(closedY, { ...spring, velocity: v });
        scheduleOnRN(close);
        return;
      }
      y.value = withSpring(positions[best], { ...spring, velocity: v });
      if (best !== idx.value) {
        idx.value = best;
        scheduleOnRN(settled, best);
      }
    },
  });

  const shown = useDerivedValue(() =>
    ready ? interpolate(y.value, [lowY, Math.max(closedY, lowY + 1)], [1, 0], Extrapolation.CLAMP) : 0,
  );
  const lift = useAnimatedStyle(() => {
    // Ride up with the keyboard, but never past the top safe area.
    const room = screen - boxH + y.value - safeTop;
    const up = Math.min(Math.max(0, kb.value - kbInset), Math.max(0, room));
    return { transform: [{ translateY: y.value - up }] };
  });

  const step = (dir: 1 | -1) => {
    const order = positions.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
    const at = order.findIndex((o) => o.i === idx.value);
    const next = order[at + dir];
    if (!next) { if (dir === -1 && dismissible) close(); return; }
    idx.value = next.i;
    y.value = withSpring(next.p, spring);
    setCurrent(next.i);
    onDetentChange?.(next.i);
  };

  const r = t.component.sheetRadius;
  const surface = t.c.surfaceRaised;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Backdrop progress={shown} onPress={dismissible ? close : undefined} label="Close sheet" />
      <GestureDetector gesture={pan}>
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title}
          onAccessibilityEscape={dismissible ? close : undefined}
          style={[
            {
              position: 'absolute', left: 0, right: 0, bottom: 0, height: fixedH, maxHeight: maxH,
              backgroundColor: surface, borderTopLeftRadius: r, borderTopRightRadius: r, borderCurve: 'continuous', boxShadow: t.c.shadowXl,
            },
            style,
            lift,
          ]}
        >
          {/* Fills the gap under the sheet when a spring overshoots upward. */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: limit, backgroundColor: surface }} />
          <View
            onLayout={(e) => setColH(e.nativeEvent.layout.height)}
            style={[fill ? { flex: 1 } : { flexShrink: 1 }, { paddingBottom: Math.max(insets.bottom, t.space[4]) }]}
          >
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Sheet grabber"
              accessibilityValue={{ text: detents.length > 1 ? `Detent ${current + 1} of ${detents.length}` : 'Open' }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
              style={{ height: t.space[5], alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ width: t.size.tile, height: t.space[1], borderRadius: t.radius.full, backgroundColor: t.c.borderStrong }} />
            </View>
            {(title || description) && (
              <View style={{ paddingHorizontal: t.space[4], paddingTop: t.space[1], paddingBottom: t.space[3], gap: t.space[1] }}>
                {title && <Text variant="title3" accessibilityRole="header">{title}</Text>}
                {description && <Text tone="muted">{description}</Text>}
              </View>
            )}
            <SheetContext.Provider value={{ pan, y, top, scrollY, inScroll, fill }}>
              <View style={[fill ? { flex: 1 } : { flexShrink: 1 }, padded && { paddingHorizontal: t.space[4] }]}>{children}</View>
            </SheetContext.Provider>
            {footer && <View style={{ paddingHorizontal: t.space[4], paddingTop: t.space[3] }}>{footer}</View>}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export type SheetScrollViewProps = Omit<ScrollViewProps, 'onScroll'>;

/**
 * A ScrollView that hands off to the sheet: at the top of the list, dragging down moves the sheet,
 * and dragging up expands it to its top detent before the list scrolls.
 */
export function SheetScrollView(props: SheetScrollViewProps) {
  const ctx = useContext(SheetContext);
  return ctx ? <LinkedScroll ctx={ctx} {...props} /> : <Animated.ScrollView {...props} />;
}

function LinkedScroll({ ctx, style, ...rest }: SheetScrollViewProps & { ctx: SheetCtx }) {
  const { pan, y, top, scrollY, inScroll, fill } = ctx;
  const ref = useAnimatedRef<Animated.ScrollView>();
  const native = useNativeGesture({
    simultaneousWith: pan,
    onBegin: () => { inScroll.value = true; },
    onFinalize: () => { inScroll.value = false; },
  });
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      // While the sheet is below its top detent (or being pulled down) the list stays pinned at 0.
      if (y.value > top.value + 0.5 || e.contentOffset.y < 0) {
        if (e.contentOffset.y !== 0) scrollTo(ref, 0, 0, false);
        scrollY.value = 0;
      } else scrollY.value = e.contentOffset.y;
    },
  });
  return (
    <GestureDetector gesture={native}>
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        style={[fill ? { flex: 1 } : { flexShrink: 1 }, style]}
        {...rest}
      />
    </GestureDetector>
  );
}
