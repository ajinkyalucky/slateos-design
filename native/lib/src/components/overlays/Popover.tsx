import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, View, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, useLongPressGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Portal } from '../../primitives/Portal';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { AnchoredLayer, useAnchorRect, useOpenState, usePresence, type Align, type Side } from './shared';

export type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The card's contents. */
  content: ReactNode;
  align?: Align;
  side?: Side;
  /** Card width. Default t.size.widthSm (256). */
  width?: number;
  accessibilityLabel?: string;
  /** The trigger. Open the popover from its onPress. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A small card anchored to its trigger, for extra detail or a quick edit without leaving the screen. */
export function Popover({ open, onOpenChange, content, align = 'start', side = 'bottom', width, accessibilityLabel, children, style }: PopoverProps) {
  const t = useSlate();
  const { mounted, onExited } = usePresence(open);
  const { ref, rect } = useAnchorRect(open);
  return (
    <>
      <View ref={ref} collapsable={false} style={[{ alignSelf: 'flex-start' }, style]}>{children}</View>
      {mounted && rect && (
        <Portal modal>
          <AnchoredLayer
            open={open} rect={rect} onClose={() => onOpenChange(false)} onExited={onExited} side={side} align={align}
            accessibilityLabel={accessibilityLabel} dismissLabel="Close popover"
            surfaceStyle={{
              width: width ?? t.size.widthSm, padding: t.space[4], gap: t.space[2],
              borderRadius: t.component.cardRadius, borderCurve: 'continuous', borderWidth: 1, borderColor: t.c.border,
              backgroundColor: t.c.surfaceRaised, boxShadow: t.c.shadowLg,
            }}
          >
            {content}
          </AnchoredLayer>
        </Portal>
      )}
    </>
  );
}

export type TooltipProps = {
  /** Short text: what the control does. */
  content: string;
  /** Controlled visibility. Leave unset to show on long-press. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide after this many ms. Default 1500; 0 keeps it up until a tap. */
  duration?: number;
  side?: Side;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A small inverse label for icon-only controls. Shows on long-press and hides itself. */
export function Tooltip({ content, open: openProp, onOpenChange, duration = 1500, side = 'top', children, style }: TooltipProps) {
  const t = useSlate();
  const [open, setOpen] = useOpenState(openProp, onOpenChange);
  const { mounted, onExited } = usePresence(open);
  const { ref, rect } = useAnchorRect(open);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => { t.haptic('selection'); setOpen(true); };
  const press = useLongPressGesture({ onActivate: () => { scheduleOnRN(show); } });

  useEffect(() => {
    if (!open) return;
    AccessibilityInfo.announceForAccessibility(content);
    if (duration > 0) timer.current = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, content, duration]);

  return (
    <>
      <GestureDetector gesture={press}>
        <View ref={ref} collapsable={false} style={[{ alignSelf: 'flex-start' }, style]}>{children}</View>
      </GestureDetector>
      {mounted && rect && (
        <Portal>
          <AnchoredLayer
            open={open} rect={rect} onClose={() => setOpen(false)} onExited={onExited} side={side} align="center" gap={t.space[2]}
            arrowColor={t.c.inverse} dismissLabel="Hide tooltip"
            surfaceStyle={{
              maxWidth: t.size.widthSm, paddingHorizontal: t.space['2_5'], paddingVertical: t.space['1_5'],
              borderRadius: t.radius.md, borderCurve: 'continuous', backgroundColor: t.c.inverse, boxShadow: t.c.shadowMd,
            }}
          >
            <Text variant="footnote" tone="inverse" weight="500">{content}</Text>
          </AnchoredLayer>
        </Portal>
      )}
    </>
  );
}
