import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Pressable, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Icon, type IconName } from '../../primitives/Icon';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { motion } from '../../tokens';
import { Button } from '../general/Button';
import { Spinner } from './Spinner';

// ---- Store: a tiny module-level list, read with useSyncExternalStore ----

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'loading';
export type ToastAction = { label: string; onPress: () => void };
export type ToastOptions = {
  /** Reuse an id to update a toast in place. */
  id?: string;
  description?: string;
  action?: ToastAction;
  /** Milliseconds on screen. Default the Toaster's (4000). Infinity keeps it until dismissed. */
  duration?: number;
  icon?: IconName;
};
export type ToastItem = ToastOptions & { id: string; title: string; tone: ToastTone; dismissed: boolean; rev: number };

const EXIT_MS = motion.duration.slow + motion.duration.fast;
const KEEP = 8;
let items: ToastItem[] = [];
let hosts: string[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

function show(title: string, tone: ToastTone, opts: ToastOptions = {}) {
  const id = opts.id ?? `toast-${++seq}`;
  const prev = items.find((x) => x.id === id);
  const next: ToastItem = { ...opts, id, title, tone, dismissed: false, rev: (prev?.rev ?? 0) + 1 };
  items = prev ? items.map((x) => (x.id === id ? next : x)) : [...items, next].slice(-KEEP);
  emit();
  return id;
}

function dismiss(id?: string) {
  const hit = (x: ToastItem) => !id || x.id === id;
  items = items.map((x) => (hit(x) && !x.dismissed ? { ...x, dismissed: true } : x));
  emit();
  setTimeout(() => {
    items = items.filter((x) => !(x.dismissed && hit(x)));
    emit();
  }, EXIT_MS);
}

type Msg<T> = string | ((v: T) => string);
const msg = <T,>(m: Msg<T>, v: T) => (typeof m === 'function' ? m(v) : m);

/**
 * Show a toast from anywhere: `toast('Saved')`, `toast.success`, `toast.error`, `toast.promise(p, {...})`,
 * `toast.dismiss(id)`. Returns the toast id. Needs one `<Toaster />` mounted.
 */
export const toast = Object.assign((title: string, opts?: ToastOptions) => show(title, 'neutral', opts), {
  success: (title: string, opts?: ToastOptions) => show(title, 'success', opts),
  error: (title: string, opts?: ToastOptions) => show(title, 'error', opts),
  warning: (title: string, opts?: ToastOptions) => show(title, 'warning', opts),
  info: (title: string, opts?: ToastOptions) => show(title, 'info', opts),
  loading: (title: string, opts?: ToastOptions) => show(title, 'loading', { duration: Infinity, ...opts }),
  /** One toast that follows a promise: loading, then success or error, updated in place. */
  promise: <T,>(p: Promise<T>, m: { loading: string; success: Msg<T>; error: Msg<unknown> }, opts?: Omit<ToastOptions, 'id'>) => {
    const id = show(m.loading, 'loading', { ...opts, duration: Infinity });
    p.then(
      (v) => show(msg(m.success, v), 'success', { ...opts, id }),
      (e) => show(msg(m.error, e), 'error', { ...opts, id }),
    );
    return id;
  },
  /** Dismiss one toast, or all of them when called without an id. */
  dismiss,
});

// ---- Toaster ----

export type ToasterProps = {
  position?: 'top' | 'bottom';
  /** How many toasts show in the stack. Default 3. */
  visibleToasts?: number;
  /** Default time on screen in ms. */
  duration?: number;
  /** Extra distance from the safe-area edge, e.g. above a tab bar. */
  offset?: number;
};

/**
 * Renders toasts above the app, inside the safe area. Mount it once near the root.
 * If several are mounted, the most recent one shows the toasts.
 */
export function Toaster(props: ToasterProps) {
  const id = useId();
  useEffect(() => {
    hosts = [...hosts, id];
    emit();
    return () => {
      hosts = hosts.filter((h) => h !== id);
      emit();
    };
  }, [id]);
  const active = useSyncExternalStore(subscribe, () => hosts[hosts.length - 1] === id, () => false);
  if (!active) return null;
  return (
    <Portal>
      <ToastStack {...props} />
    </Portal>
  );
}

function ToastStack({ position = 'top', visibleToasts = 3, duration = 4000, offset = 0 }: ToasterProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const all = useSyncExternalStore(subscribe, () => items, () => items);
  const live = all.filter((x) => !x.dismissed).reverse();
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(false);
  const [touching, setTouching] = useState(false);
  useEffect(() => {
    if (live.length < 2) setExpanded(false);
  }, [live.length]);

  const top = position === 'top';
  const gap = t.space[2];
  const peek = t.space['2_5'];
  const frontH = heights[live[0]?.id] ?? 0;
  let acc = 0;
  const offsets = live.map((x) => {
    const o = acc;
    acc += (heights[x.id] ?? 0) + gap;
    return o;
  });
  const count = Math.min(live.length, visibleToasts);
  const stackH = expanded ? Math.max(0, acc - gap) : frontH + peek * Math.max(0, count - 1);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: t.component.screenPadding,
        right: t.component.screenPadding,
        height: stackH,
        [top ? 'top' : 'bottom']: (top ? insets.top : insets.bottom) + t.space[2] + offset,
      }}
    >
      {all.map((item) => {
        const i = live.indexOf(item);
        return (
          <ToastView
            key={item.id}
            item={item}
            index={i}
            visible={i >= 0 && i < visibleToasts}
            dir={top ? 1 : -1}
            expanded={expanded}
            offset={offsets[i] ?? 0}
            frontH={frontH}
            peek={peek}
            height={heights[item.id] ?? 0}
            paused={expanded || touching}
            duration={item.duration ?? duration}
            onHeight={(h) => setHeights((prev) => (prev[item.id] === h ? prev : { ...prev, [item.id]: h }))}
            onTouch={setTouching}
            onToggle={() => live.length > 1 && setExpanded((e) => !e)}
          />
        );
      })}
    </View>
  );
}

type ToastViewProps = {
  item: ToastItem; index: number; visible: boolean; dir: 1 | -1; expanded: boolean; offset: number; frontH: number; peek: number;
  height: number; paused: boolean; duration: number;
  onHeight: (h: number) => void; onTouch: (on: boolean) => void; onToggle: () => void;
};

const toneIcons: Partial<Record<ToastTone, IconName>> = {
  success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle', info: 'info',
};

function ToastView({ item, index, visible, dir, expanded, offset, frontH, peek, height: h, paused, duration, onHeight, onTouch, onToggle }: ToastViewProps) {
  const t = useSlate();
  const leaving = index < 0;
  const reduced = t.reducedMotion;
  const spring = t.spring.standard;
  const fast = t.motion.duration.base;

  // Stack position: newest in front, older ones scaled down and peeking from behind.
  const last = useRef({ y: 0, s: 1, o: 1 });
  if (!leaving) {
    const s = expanded || index === 0 ? 1 : 1 - 0.05 * index;
    const y = expanded ? dir * offset : index === 0 ? 0 : dir * (frontH + peek * index - (h * (1 + s)) / 2);
    last.current = { y, s, o: visible ? 1 : 0 };
  }
  const target = last.current;
  const y = useSharedValue(target.y);
  const s = useSharedValue(target.s);
  const o = useSharedValue(target.o);
  const content = useSharedValue(1);
  const life = useSharedValue(0);
  const drag = useSharedValue(0);
  const showContent = expanded || index <= 0;

  useEffect(() => {
    const go = (v: number) => (reduced ? withTiming(v, { duration: fast }) : withSpring(v, spring));
    y.value = go(target.y);
    s.value = go(target.s);
    o.value = withTiming(target.o, { duration: fast });
    content.value = withTiming(showContent ? 1 : 0, { duration: fast });
  }, [target.y, target.s, target.o, showContent, reduced, spring, fast, y, s, o, content]);

  // Enter once measured; leave when dismissed.
  useEffect(() => {
    if (!h) return;
    if (leaving) life.value = withTiming(0, { duration: fast });
    else life.value = reduced ? withTiming(1, { duration: fast }) : withSpring(1, spring);
  }, [h > 0, leaving]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss, paused while touched or expanded; restarts when the toast is updated.
  const remaining = useRef(duration);
  useEffect(() => {
    remaining.current = duration;
  }, [item.rev, duration]);
  const timed = !leaving && item.tone !== 'loading' && Number.isFinite(duration);
  useEffect(() => {
    if (!timed || paused) return;
    const start = Date.now();
    const id = setTimeout(() => toast.dismiss(item.id), Math.max(0, remaining.current));
    return () => {
      clearTimeout(id);
      remaining.current -= Date.now() - start;
    };
  }, [timed, paused, item.rev, item.id]);

  // Outcome haptic and a spoken announcement on show and on each update.
  useEffect(() => {
    if (item.tone === 'success' || item.tone === 'warning' || item.tone === 'error') t.haptic(item.tone);
    AccessibilityInfo.announceForAccessibility(item.description ? `${item.title}. ${item.description}` : item.title);
  }, [item.rev]); // eslint-disable-line react-hooks/exhaustive-deps

  const away = -dir;
  const id = item.id;
  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    onBegin: () => {
      scheduleOnRN(onTouch, true);
    },
    onUpdate: (e) => {
      const ty = e.translationY;
      drag.value = ty * away > 0 ? ty : ty / (1 + Math.abs(ty) / 24);
    },
    onDeactivate: (e) => {
      if (e.translationY * away > h * 0.35 || e.velocityY * away > 500) {
        drag.value = withTiming(away * (h + peek * 4), { duration: fast });
        scheduleOnRN(dismiss, id);
      } else {
        drag.value = withSpring(0, spring);
      }
    },
    onFinalize: () => {
      scheduleOnRN(onTouch, false);
    },
  });

  const outer = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ translateY: y.value }, { scale: s.value }],
  }));
  const inner = useAnimatedStyle(() => ({
    opacity: life.value,
    transform: [{ translateY: drag.value + (reduced ? 0 : (1 - life.value) * -dir * h) }],
  }));
  const fade = useAnimatedStyle(() => ({ opacity: content.value }));

  const icon = item.icon ?? toneIcons[item.tone];
  const iconColor = item.tone === 'error' ? t.c.danger : item.tone === 'neutral' ? t.c.text : item.tone === 'loading' ? t.c.textMuted : t.c[item.tone];

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[{ position: 'absolute', left: 0, right: 0, [dir === 1 ? 'top' : 'bottom']: 0, zIndex: 100 - Math.max(0, index) }, outer]}
    >
      <GestureDetector gesture={pan}>
        <Animated.View onLayout={(e) => onHeight(e.nativeEvent.layout.height)} style={inner}>
          <Pressable
            accessible={false}
            onPress={onToggle}
            style={{
              borderRadius: t.component.cardRadius,
              borderWidth: 1,
              borderColor: t.c.border,
              backgroundColor: t.c.surfaceRaised,
              boxShadow: t.c.shadowLg,
            }}
          >
            <Animated.View
              style={[
                { flexDirection: 'row', alignItems: 'center', gap: t.space[3], paddingVertical: t.space[3], paddingLeft: t.space[4], paddingRight: item.action ? t.space[3] : t.space[4], minHeight: t.control.lg + t.space[2] },
                fade,
              ]}
            >
              {item.tone === 'loading' ? <Spinner size="md" /> : icon ? <Icon name={icon} size={20} color={iconColor} strokeWidth={1.75} /> : null}
              <View
                accessible
                accessibilityRole={item.tone === 'error' || item.tone === 'warning' ? 'alert' : 'text'}
                accessibilityLabel={item.description ? `${item.title}. ${item.description}` : item.title}
                accessibilityActions={[{ name: 'dismiss', label: 'Dismiss' }]}
                onAccessibilityAction={(e) => e.nativeEvent.actionName === 'dismiss' && dismiss(id)}
                style={{ flex: 1, gap: t.space['0_5'] }}
              >
                <Text variant="label" weight="600" numberOfLines={2}>{item.title}</Text>
                {item.description ? <Text variant="footnote" tone="muted" numberOfLines={3}>{item.description}</Text> : null}
              </View>
              {item.action && (
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    item.action?.onPress();
                    dismiss(id);
                  }}
                >
                  {item.action.label}
                </Button>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
