import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Avatar, type AvatarProps } from './Avatar';

export type ChipProps = {
  label: string;
  /** Selected state for filter chips. Pass with onValueChange to make the chip a toggle. */
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  /** For action chips (not toggles). */
  onPress?: () => void;
  /** Shows an x that calls this. */
  onRemove?: () => void;
  icon?: IconName;
  avatar?: Pick<AvatarProps, 'name' | 'src'>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const CHECK = 16;

/** A compact pill for filters, tags and picked people: toggles with a check, or removes with an x. */
export function Chip({ label, value = false, onValueChange, onPress, onRemove, icon, avatar, disabled, style }: ChipProps) {
  const t = useSlate();
  const selectable = !!onValueChange;
  const on = selectable && value;
  const p = useSharedValue(on ? 1 : 0);
  const spring = t.spring.standard;
  const reduced = t.reducedMotion;
  useEffect(() => {
    p.value = reduced ? (on ? 1 : 0) : withSpring(on ? 1 : 0, spring);
  }, [on, reduced, p, spring]);

  const gap = t.space['1_5'];
  // Copy plain numbers for the worklet; never capture t.
  const checkW = CHECK + gap;
  const checkStyle = useAnimatedStyle(() => ({
    width: checkW * p.value,
    opacity: p.value,
    transform: [{ scale: 0.6 + 0.4 * p.value }],
  }));

  const fg = on ? t.c.accent : t.c.text;
  const pressable = selectable || !!onPress;
  const hasLeading = !!avatar || !!icon;
  const box: ViewStyle = {
    height: t.control.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingLeft: avatar ? t.space[1] : t.space[3],
    paddingRight: onRemove ? t.space[1] : t.space[3],
    borderRadius: t.component.badgeRadius,
    borderWidth: 1,
    borderColor: on ? t.c.accentBorder : t.c.border,
    backgroundColor: on ? t.c.accentSoft : t.c.surfaceRaised,
    opacity: disabled ? t.opacity.disabled : 1,
  };
  const a11y = {
    accessibilityLabel: label,
    accessibilityState: { selected: selectable ? on : undefined, disabled: !!disabled },
    accessibilityActions: onRemove ? [{ name: 'remove', label: `Remove ${label}` }] : undefined,
    onAccessibilityAction: onRemove ? () => onRemove() : undefined,
  };

  const content = (
    <>
      {selectable && !hasLeading && (
        <Animated.View style={[{ overflow: 'hidden', flexDirection: 'row' }, checkStyle]}>
          <Icon name="check" size={CHECK} color={fg} strokeWidth={2} />
        </Animated.View>
      )}
      {avatar && <Avatar name={avatar.name} src={avatar.src} size="sm" style={{ marginRight: gap }} />}
      {icon && !avatar && <Icon name={on ? 'check' : icon} size={CHECK} color={on ? fg : t.c.textMuted} strokeWidth={1.75} />}
      {icon && !avatar && <View style={{ width: gap }} />}
      <Text variant="label" numberOfLines={1} style={{ color: fg }}>{label}</Text>
      {onRemove && (
        <Touchable
          onPress={onRemove}
          disabled={disabled}
          haptic="selection"
          pressScale={0.85}
          hitSlop={t.space[2]}
          accessibilityLabel={`Remove ${label}`}
          style={{ width: t.space[6] - t.space[1], height: t.space[6] - t.space[1], marginLeft: t.space['0_5'], borderRadius: t.radius.full, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={CHECK} color={t.c.textSubtle} strokeWidth={1.75} />
        </Touchable>
      )}
    </>
  );

  if (pressable)
    return (
      <Touchable
        {...a11y}
        accessibilityRole={selectable ? 'togglebutton' : 'button'}
        disabled={disabled}
        haptic="selection"
        pressScale={0.95}
        onPress={() => (selectable ? onValueChange?.(!value) : onPress?.())}
        style={[box, { opacity: 1 }, style]}
      >
        {content}
      </Touchable>
    );
  return (
    <View accessible accessibilityRole="text" {...a11y} style={[box, style]}>
      {content}
    </View>
  );
}
