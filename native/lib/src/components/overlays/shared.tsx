import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BackHandler, Keyboard, Platform, Pressable, StyleSheet, View,
  type HostInstance, type StyleProp, type ViewStyle,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';

// Internal pieces the overlays share: presence, keyboard, back button, backdrop, anchored placement.

export type Rect = { x: number; y: number; width: number; height: number };

/** Keeps an overlay mounted after `open` turns false, until its exit animation calls `onExited`. */
export function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  return { mounted, onExited: () => setMounted(false) };
}

/** Uncontrolled fallback for overlays whose open state is optional. */
export function useOpenState(open: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
  const [own, setOwn] = useState(false);
  const value = open ?? own;
  return [value, (v: boolean) => { if (open === undefined) setOwn(v); onOpenChange?.(v); }] as const;
}

/** Keyboard height as a shared value, eased with the keyboard's own duration. */
export function useKeyboardHeight() {
  const t = useSlate();
  const h = useSharedValue(0);
  const [, a, b, c, d] = t.motion.easing.standard;
  const fallback = t.motion.duration.slow;
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const easing = Easing.bezier(a, b, c, d);
    const to = (v: number, ms?: number) => { h.value = withTiming(v, { duration: ms || fallback, easing }); };
    if (Keyboard.isVisible()) h.value = Keyboard.metrics()?.height ?? 0;
    const subs = [
      Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => to(e.endCoordinates.height, e.duration)),
      Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (e) => to(0, e.duration)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [h, a, b, c, d, fallback]);
  return h;
}

/** Android back button closes the top overlay. */
export function useBackHandler(active: boolean, onBack: () => void) {
  const cb = useRef(onBack);
  cb.current = onBack;
  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { cb.current(); return true; });
    return () => sub.remove();
  }, [active]);
}

/** iOS-style rubber band: resistance grows with distance and never passes `limit`. */
export function rubberband(distance: number, limit: number) {
  'worklet';
  return (1 - 1 / ((distance * 0.55) / limit + 1)) * limit;
}

/** Full-screen scrim. Tappable when `onPress` is set; it always blocks touches to the app below. */
export function Backdrop({ progress, onPress, color, label = 'Dismiss' }: { progress: SharedValue<number>; onPress?: () => void; color?: string; label?: string }) {
  const t = useSlate();
  const fade = useAnimatedStyle(() => ({ opacity: progress.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color ?? t.c.overlay }, fade]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        disabled={!onPress}
        accessible={!!onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        importantForAccessibility={onPress ? 'yes' : 'no-hide-descendants'}
      />
    </Animated.View>
  );
}

/** Measures `ref` in window coordinates whenever `open` turns true. */
export function useAnchorRect(open: boolean) {
  const ref = useRef<HostInstance>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!open) return;
    setRect(null);
    ref.current?.measureInWindow((x, y, width, height) => setRect({ x, y, width, height }));
  }, [open]);
  return { ref, rect };
}

export type Side = 'top' | 'bottom';
export type Align = 'start' | 'center' | 'end';
type Placement = { left: number; top: number; side: Side; maxHeight: number; origin: [number, number, number]; arrowX: number };

/** Below the anchor (or above when there is more room there), clamped inside the safe screen. */
export function placeAnchored(
  a: Rect, size: { w: number; h: number }, bounds: { w: number; h: number },
  insets: { top: number; bottom: number; left: number; right: number }, gap: number, margin: number, prefer: Side, align: Align,
): Placement {
  const minTop = insets.top + margin, maxBottom = bounds.h - insets.bottom - margin;
  const below = maxBottom - (a.y + a.height + gap), above = a.y - gap - minTop;
  let side = prefer;
  if (prefer === 'bottom' && below < size.h && above > below) side = 'top';
  if (prefer === 'top' && above < size.h && below > above) side = 'bottom';
  const maxHeight = Math.max(0, side === 'bottom' ? below : above);
  const h = Math.min(size.h, maxHeight);
  const top = side === 'bottom' ? a.y + a.height + gap : a.y - gap - h;
  const raw = align === 'start' ? a.x : align === 'end' ? a.x + a.width - size.w : a.x + a.width / 2 - size.w / 2;
  const left = Math.max(insets.left + margin, Math.min(raw, bounds.w - insets.right - margin - size.w));
  const cx = a.x + a.width / 2 - left;
  // Grow from the corner nearest the trigger (its centre for centred bubbles).
  const ox = align === 'center' ? cx : cx < size.w / 2 ? 0 : size.w;
  return { left, top, side, maxHeight, origin: [ox, side === 'bottom' ? 0 : h, 0], arrowX: Math.max(margin * 2, Math.min(cx, size.w - margin * 2)) };
}

export type AnchoredLayerProps = {
  open: boolean;
  /** The trigger, in window coordinates. */
  rect: Rect;
  onClose: () => void;
  onExited: () => void;
  side?: Side;
  align?: Align;
  gap?: number;
  /** Dim the screen behind (context menus). Default: a clear scrim that closes on tap. */
  dim?: boolean;
  /** Draw a small arrow toward the trigger in this colour (tooltips). */
  arrowColor?: string;
  dismissLabel?: string;
  /** Rendered between the scrim and the surface, e.g. a lifted copy of the trigger. */
  underlay?: (rect: Rect, progress: SharedValue<number>) => ReactNode;
  surfaceStyle?: StyleProp<ViewStyle>;
  accessibilityRole?: 'menu' | 'none' | 'alert';
  accessibilityLabel?: string;
  children: ReactNode;
};

/** Measures itself, places next to `rect` and scales in from the corner nearest it. Render inside <Portal>. */
export function AnchoredLayer({
  open, rect, onClose, onExited, side = 'bottom', align = 'start', gap, dim, arrowColor, dismissLabel, underlay, surfaceStyle,
  accessibilityRole, accessibilityLabel, children,
}: AnchoredLayerProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const rootRef = useRef<HostInstance>(null);
  const [frame, setFrame] = useState<Rect | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const p = useSharedValue(0);
  const local = frame ? { ...rect, x: rect.x - frame.x, y: rect.y - frame.y } : null;
  const place = local && size && frame
    ? placeAnchored(local, size, { w: frame.width, h: frame.height }, insets, gap ?? t.space[2], t.space[2], side, align)
    : null;
  const placed = !!place;
  const spring = t.spring.standard;
  const exit = { duration: t.motion.duration.base, easing: Easing.out(Easing.quad) };

  useEffect(() => {
    if (open) { if (placed) p.value = withSpring(1, spring); }
    else if (!placed) onExited();
    else p.value = withTiming(0, exit, (done) => { if (done) scheduleOnRN(onExited); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placed]);
  useBackHandler(open, onClose);

  const pop = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.94 + 0.06 * p.value }] }));
  const arrowW = t.space[3], arrowH = t.space['1_5'];
  return (
    <View
      ref={rootRef}
      style={StyleSheet.absoluteFill}
      onLayout={() => rootRef.current?.measureInWindow((x, y, width, height) => setFrame({ x, y, width, height }))}
    >
      <Backdrop progress={p} onPress={onClose} color={dim ? t.c.overlay : 'transparent'} label={dismissLabel} />
      {local && underlay?.(local, p)}
      <Animated.View
        accessibilityViewIsModal
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onAccessibilityEscape={onClose}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setSize((s) => (s && Math.abs(s.w - w) < 0.5 && Math.abs(s.h - h) < 0.5 ? s : { w, h }));
        }}
        style={[
          { position: 'absolute', left: place?.left ?? 0, top: place?.top ?? 0, opacity: placed ? 1 : 0 },
          place && { maxHeight: place.maxHeight, transformOrigin: place.origin },
          surfaceStyle,
          pop,
        ]}
      >
        {children}
        {arrowColor && place && (
          <Svg
            width={arrowW}
            height={arrowH}
            style={{ position: 'absolute', left: place.arrowX - arrowW / 2, [place.side === 'bottom' ? 'top' : 'bottom']: -arrowH + 0.5 }}
          >
            <Path
              d={place.side === 'bottom' ? `M0 ${arrowH} L${arrowW / 2} 0 L${arrowW} ${arrowH} Z` : `M0 0 L${arrowW / 2} ${arrowH} L${arrowW} 0 Z`}
              fill={arrowColor}
            />
          </Svg>
        )}
      </Animated.View>
    </View>
  );
}

export type FieldTriggerProps = {
  label?: string;
  /** The current value, or undefined to show the placeholder. */
  valueText?: string;
  placeholder: string;
  icon?: IconName;
  trailingIcon: IconName;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** The 44pt field Select and DatePicker open from. */
export function FieldTrigger({ label, valueText, placeholder, icon, trailingIcon, active, disabled, onPress, style }: FieldTriggerProps) {
  const t = useSlate();
  return (
    <View style={[{ gap: t.space[2] }, style]}>
      {label && <Text variant="label" tone={disabled ? 'disabled' : 'default'} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{label}</Text>}
      <Touchable
        onPress={onPress}
        disabled={disabled}
        haptic="selection"
        pressScale={0.99}
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityValue={{ text: valueText ?? placeholder }}
        accessibilityState={{ disabled: !!disabled, expanded: !!active }}
        style={{
          height: t.control.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.space[2],
          paddingHorizontal: t.space[3],
          borderRadius: t.component.inputRadius,
          borderWidth: 1,
          borderColor: active ? t.c.accent : t.c.border,
          backgroundColor: disabled ? t.c.surface : t.c.surfaceRaised,
          boxShadow: t.c.shadowXs,
        }}
      >
        {icon && <Icon name={icon} size={16} color={t.c.textSubtle} />}
        <Text numberOfLines={1} tone={valueText ? 'default' : 'subtle'} style={{ flex: 1 }}>{valueText ?? placeholder}</Text>
        <Icon name={trailingIcon} size={16} color={t.c.textSubtle} />
      </Touchable>
    </View>
  );
}
