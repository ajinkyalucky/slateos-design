import { useEffect, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { toneColors, toneIcon, type FeedbackTone } from './tone';

export type BannerProps = {
  tone?: FeedbackTone;
  /** The message, one or two short lines. */
  children: string;
  title?: string;
  icon?: IconName | false;
  action?: { label: string; onPress: () => void };
  /** Controlled visibility. Leave unset to let the close button hide it. */
  visible?: boolean;
  /** Shows a close button. When controlled, keep the banner mounted and set visible={false} so it can slide away. */
  onDismiss?: () => void;
  dismissible?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A full-width strip at the top of content for app-wide status (offline, trial ending). Collapses smoothly when dismissed. */
export function Banner({ tone = 'info', children, title, icon, action, visible, onDismiss, dismissible = !!onDismiss, style }: BannerProps) {
  const t = useSlate();
  const col = toneColors(t, tone);
  const [own, setOwn] = useState(true);
  const shown = visible ?? own;
  const [h, setH] = useState(0);
  const p = useSharedValue(shown ? 1 : 0);
  const reduced = t.reducedMotion;
  const spring = t.spring.standard;
  const fast = t.motion.duration.base;

  useEffect(() => {
    p.value = reduced ? withTiming(shown ? 1 : 0, { duration: fast }) : withSpring(shown ? 1 : 0, spring);
  }, [p, shown, reduced, fast, spring]);

  const wrap = useAnimatedStyle(() =>
    h ? { height: h * p.value, opacity: p.value } : shown ? { opacity: 1 } : { height: 0, opacity: 0 },
  );
  const inner = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : (p.value - 1) * h * 0.5 }] }));
  const iconName = icon === false ? null : icon ?? toneIcon[tone];

  return (
    <Animated.View
      pointerEvents={shown ? 'auto' : 'none'}
      accessibilityElementsHidden={!shown}
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      style={[{ overflow: 'hidden' }, wrap]}
    >
      <Animated.View
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
        accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}
        style={[
          {
            flexDirection: 'row', alignItems: 'center', gap: t.space[3],
            paddingLeft: t.component.screenPadding, paddingRight: dismissible ? t.space[2] : t.component.screenPadding,
            paddingVertical: t.space['2_5'], minHeight: t.control.md,
            backgroundColor: col.soft, borderBottomWidth: 1, borderBottomColor: col.border,
          },
          inner,
          style,
        ]}
      >
        {iconName && <Icon name={iconName} size={20} color={col.icon} strokeWidth={1.75} />}
        <Text variant="callout" style={{ flex: 1 }}>
          {title ? <Text variant="callout" weight="600">{title} </Text> : null}
          <Text variant="callout" tone="muted">{children}</Text>
        </Text>
        {action && (
          <Touchable onPress={action.onPress} haptic="selection" pressScale={0.96} hitSlop={t.space[3]}>
            <Text variant="label" weight="600" style={{ color: col.fg }}>{action.label}</Text>
          </Touchable>
        )}
        {dismissible && (
          <Touchable
            onPress={() => {
              if (visible === undefined) setOwn(false);
              onDismiss?.();
            }}
            haptic="selection"
            pressScale={0.9}
            accessibilityLabel="Dismiss"
            style={{ width: t.size.touch, height: t.size.touch, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={16} color={t.c.textSubtle} strokeWidth={1.75} />
          </Touchable>
        )}
      </Animated.View>
    </Animated.View>
  );
}
