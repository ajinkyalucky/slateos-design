import type { ReactNode } from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import type { HapticKind } from '../../haptics';
import { Icon, type IconName } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable, type TouchableProps } from '../../primitives/Touchable';
import { useSlate, type Theme } from '../../theme';

/** `plain` is text only, like an iOS bar button: for headers and toolbars. `link` is underlined, for inline text. */
export type ButtonVariant = 'solid' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'destructive' | 'link' | 'plain';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<TouchableProps, 'children' | 'style'> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  /** Stretch to the width of the container. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function buttonColors(t: Theme, variant: ButtonVariant) {
  const { c } = t;
  switch (variant) {
    case 'solid': return { bg: c.accentSolid, fg: c.onAccent, border: 'transparent' };
    case 'secondary': return { bg: c.surfaceHover, fg: c.text, border: 'transparent' };
    case 'outline': return { bg: c.surfaceRaised, fg: c.text, border: c.border };
    case 'ghost': return { bg: 'transparent', fg: c.text, border: 'transparent' };
    case 'soft': return { bg: c.accentSoft, fg: c.accent, border: 'transparent' };
    case 'destructive': return { bg: c.dangerSolid, fg: c.onSolid, border: 'transparent' };
    case 'link': return { bg: 'transparent', fg: c.accent, border: 'transparent' };
    case 'plain': return { bg: 'transparent', fg: c.accent, border: 'transparent' };
  }
}

const hapticFor: Record<ButtonVariant, HapticKind> = {
  solid: 'light', destructive: 'medium', secondary: 'selection', outline: 'selection', ghost: 'selection', soft: 'selection', link: 'selection', plain: 'selection',
};

/** The primary action control. 44pt tall by default, with a press spring and a light haptic. */
export function Button({ children, variant = 'solid', size = 'md', icon, iconRight, loading, block, disabled, style, haptic, ...rest }: ButtonProps) {
  const t = useSlate();
  const col = buttonColors(t, variant);
  const h = t.control[size];
  const padX = { sm: t.space[3], md: t.space[4], lg: t.space[5] }[size];
  const iconSize = size === 'sm' ? 16 : 20;
  const label = typeof children === 'string' || typeof children === 'number';
  const raised = variant === 'solid' || variant === 'destructive';
  const bare = variant === 'link' || variant === 'plain';

  return (
    <Touchable
      disabled={disabled || loading}
      haptic={haptic ?? hapticFor[variant]}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={[
        {
          height: bare ? undefined : h,
          minHeight: bare ? t.size.touch : undefined,
          paddingHorizontal: bare ? 0 : padX,
          borderRadius: t.component.buttonRadius,
          backgroundColor: col.bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: col.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.space[2],
          alignSelf: block ? 'stretch' : 'flex-start',
          boxShadow: raised ? `${t.c.buttonHighlight}, ${t.c.shadowXs}` : variant === 'outline' ? t.c.shadowXs : undefined,
        },
        style,
      ]}
      {...rest}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], opacity: loading ? 0 : 1 }}>
        {icon && <Icon name={icon} size={iconSize} color={col.fg} strokeWidth={1.75} />}
        {label ? (
          <Text
            variant={size === 'sm' ? 'label' : 'headline'}
            weight="600"
            numberOfLines={1}
            style={[{ color: col.fg }, variant === 'link' && { textDecorationLine: 'underline' }]}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {iconRight && <Icon name={iconRight} size={iconSize} color={col.fg} strokeWidth={1.75} />}
      </View>
      {loading && <ActivityIndicator color={col.fg} style={{ position: 'absolute' }} />}
    </Touchable>
  );
}

export type IconButtonProps = Omit<ButtonProps, 'children' | 'icon' | 'iconRight' | 'block'> & {
  icon: IconName;
  /** Required: icon-only buttons need a spoken name. */
  accessibilityLabel: string;
  /** Round instead of the button radius. */
  round?: boolean;
};

/** A square, icon-only button. Always 44pt to touch, even at sm. */
export function IconButton({ icon, variant = 'ghost', size = 'md', round, style, ...rest }: IconButtonProps) {
  const t = useSlate();
  const col = buttonColors(t, variant);
  const h = t.control[size];
  return (
    <Button
      variant={variant}
      size={size}
      hitSlop={Math.max(0, (t.size.touch - h) / 2)}
      style={[{ width: h, paddingHorizontal: 0 }, round && { borderRadius: h / 2 }, style]}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} color={col.fg} strokeWidth={1.75} />
    </Button>
  );
}
