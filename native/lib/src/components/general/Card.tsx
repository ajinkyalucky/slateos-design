import { createContext, useContext, type ReactNode } from 'react';
import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text';
import { Touchable, type TouchableProps } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { space } from '../../tokens';

export type CardVariant = 'outline' | 'elevated' | 'filled';

export type CardProps = Omit<TouchableProps, 'children' | 'style'> & {
  children?: ReactNode;
  /** Default follows the style: outline, or filled (Pebble) or elevated (Mica). */
  variant?: CardVariant;
  /** Inner padding. Default t.space[4]. */
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

const CardContext = createContext<{ padding: number }>({ padding: space[4] });

/** A grouped surface for related content. Pass onPress to make the whole card a tap target. */
export function Card({ children, variant: variantProp, padding, onPress, style, ...rest }: CardProps) {
  const t = useSlate();
  const variant = variantProp ?? t.style.card;
  const pad = padding ?? t.space[4];
  const outer: ViewStyle = {
    borderRadius: t.component.cardRadius,
    backgroundColor: variant === 'filled' ? t.c.surface : t.c.surfaceRaised,
    borderWidth: variant === 'filled' ? 0 : 1,
    borderColor: variant === 'elevated' ? t.c.borderSubtle : t.c.border,
    boxShadow: variant === 'elevated' ? t.c.shadowSm : undefined,
  };
  // The shadow sits on the outer view; the inner one clips media to the corners.
  const inner = (
    <View style={{ borderRadius: t.component.cardRadius - (variant === 'filled' ? 0 : 1), overflow: 'hidden', padding: pad, gap: t.space[3] }}>
      <CardContext.Provider value={{ padding: pad }}>{children}</CardContext.Provider>
    </View>
  );
  if (onPress)
    return (
      <Touchable onPress={onPress} pressScale={0.98} style={[outer, style]} {...rest}>
        {inner}
      </Touchable>
    );
  return <View style={[outer, style]}>{inner}</View>;
}

export type CardHeaderProps = {
  title: string;
  description?: string;
  /** Trailing element: a button, badge or menu. */
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Title, optional description and a trailing action for the top of a card. */
export function CardHeader({ title, description, action, style }: CardHeaderProps) {
  const t = useSlate();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] }, style]}>
      <View style={{ flex: 1, gap: t.space['0_5'] }}>
        <Text variant="headline" accessibilityRole="header">{title}</Text>
        {description && <Text variant="footnote" tone="muted">{description}</Text>}
      </View>
      {action}
    </View>
  );
}

/** The body of a card. */
export function CardContent({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useSlate();
  return <View style={[{ gap: t.space[2] }, style]}>{children}</View>;
}

/** A row of actions or meta at the bottom of a card, with an optional hairline above. */
export function CardFooter({ children, bordered, style }: { children?: ReactNode; bordered?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useSlate();
  const { padding } = useContext(CardContext);
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
        bordered && { borderTopWidth: 1, borderTopColor: t.c.borderSubtle, paddingTop: t.space[3], marginHorizontal: -padding, paddingHorizontal: padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type CardMediaProps = {
  source: string | ImageSourcePropType;
  /** Width / height. Default 16 / 9. */
  aspectRatio?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** An image that bleeds to the card's top and side edges. Put it first in the card. */
export function CardMedia({ source, aspectRatio = 16 / 9, accessibilityLabel, style }: CardMediaProps) {
  const t = useSlate();
  const { padding } = useContext(CardContext);
  return (
    <View style={[{ marginTop: -padding, marginHorizontal: -padding, aspectRatio, backgroundColor: t.c.surfaceHover }, style]}>
      <Image
        source={typeof source === 'string' ? { uri: source } : source}
        resizeMode="cover"
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
