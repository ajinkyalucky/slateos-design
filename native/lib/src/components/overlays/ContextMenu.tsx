import { useRef, type ReactNode } from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useLongPressGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Portal } from '../../primitives/Portal';
import { useSlate } from '../../theme';
import { MenuList, menuSurface, type MenuEntry } from './Menu';
import { AnchoredLayer, useAnchorRect, useOpenState, usePresence, type Rect } from './shared';

export type ContextMenuProps = {
  items: MenuEntry[];
  /** Controlled visibility. Leave unset to open on long-press. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Spoken name of the long-press action. Default 'Show actions'. */
  actionLabel?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Long-press a child to lift it, dim the screen and show its actions alongside.
 * Use it for shortcuts on items in a list or grid; keep every action reachable elsewhere too.
 */
export function ContextMenu({ items, open: openProp, onOpenChange, disabled, actionLabel = 'Show actions', children, style }: ContextMenuProps) {
  const t = useSlate();
  const { width: screenW } = useWindowDimensions();
  const [open, setOpen] = useOpenState(openProp, onOpenChange);
  const { mounted, onExited } = usePresence(open);
  const { ref, rect: measured } = useAnchorRect(open);
  // measureInWindow sees the press sink; rebuild the rect from the untransformed layout size around the same centre.
  const size = useRef({ w: 0, h: 0 });
  const rect = measured && size.current.w
    ? { x: measured.x + (measured.width - size.current.w) / 2, y: measured.y + (measured.height - size.current.h) / 2, width: size.current.w, height: size.current.h }
    : measured;
  const hold = useSharedValue(0);
  const covered = useSharedValue(0);
  const haptic = t.haptic;
  const lift = () => { haptic('medium'); setOpen(true); };
  const holdMs = 450;
  const settle = t.spring.press;

  const press = useLongPressGesture({
    enabled: !disabled,
    minDuration: holdMs,
    onBegin: () => { hold.value = withTiming(1, { duration: holdMs }); },
    onActivate: () => { scheduleOnRN(lift); },
    onFinalize: () => { hold.value = withSpring(0, settle); },
  });
  const sink = useAnimatedStyle(() => ({ opacity: 1 - covered.value, transform: [{ scale: 1 - 0.02 * hold.value }] }));
  const close = () => setOpen(false);

  return (
    <>
      <GestureDetector gesture={press}>
        <Animated.View
          ref={ref}
          collapsable={false}
          accessible
          accessibilityActions={[{ name: 'longpress', label: actionLabel }]}
          onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'longpress' && !disabled) lift(); }}
          onLayout={(e) => { size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
          style={[style, sink]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
      {mounted && rect && (
        <Portal modal>
          <AnchoredLayer
            dim
            open={open}
            rect={rect}
            onClose={close}
            onExited={() => { covered.value = 0; onExited(); }}
            align={rect.x + rect.width / 2 > screenW / 2 ? 'end' : 'start'}
            accessibilityRole="menu"
            dismissLabel="Close menu"
            surfaceStyle={menuSurface(t)}
            underlay={(r, p) => <Lifted rect={r} progress={p} covered={covered}>{children}</Lifted>}
          >
            <MenuList items={items} onClose={close} />
          </AnchoredLayer>
        </Portal>
      )}
    </>
  );
}

/** A copy of the child above the scrim, lifted 3% with a soft shadow. */
function Lifted({ rect, progress, covered, children }: { rect: Rect; progress: SharedValue<number>; covered: SharedValue<number>; children: ReactNode }) {
  const t = useSlate();
  const lift = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.03 * progress.value }] }));
  const shadow = useAnimatedStyle(() => ({ opacity: progress.value }));
  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      onLayout={() => { covered.value = 1; }}
      style={[{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }, lift]}
    >
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: t.component.cardRadius, boxShadow: t.c.shadowXl }, shadow]}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </Animated.View>
  );
}
