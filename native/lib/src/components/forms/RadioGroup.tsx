import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { usePressSink } from './shared';

export type RadioVariant = 'default' | 'card';

type Ctx = { value: string | null | undefined; select: (v: string) => void; disabled?: boolean; variant: RadioVariant };
const RadioContext = createContext<Ctx | null>(null);

export type RadioGroupProps = {
  value: string | null | undefined;
  onValueChange?: (value: string) => void;
  /** 'default' rows, or 'card': each option is a bordered card that takes an accent border when chosen. */
  variant?: RadioVariant;
  disabled?: boolean;
  /** Names the group for screen readers, e.g. "Delivery speed". */
  accessibilityLabel?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A vertical set of mutually exclusive options. Use it when every option should stay visible. */
export function RadioGroup({ value, onValueChange, variant = 'default', disabled, accessibilityLabel, children, style }: RadioGroupProps) {
  const t = useSlate();
  return (
    <RadioContext.Provider value={{ value, select: (v) => onValueChange?.(v), disabled, variant }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[{ gap: variant === 'card' ? t.space[2] : 0 }, style]}>
        {children}
      </View>
    </RadioContext.Provider>
  );
}

export type RadioProps = {
  value: string;
  label: string;
  description?: string;
  /** Extra content on the right of a card, such as a price. */
  aside?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const DOT = 22;

/** One option inside a RadioGroup. */
export function Radio({ value, label, description, aside, disabled: own, style }: RadioProps) {
  const t = useSlate();
  const ctx = useContext(RadioContext);
  const selected = ctx?.value === value;
  const disabled = ctx?.disabled || own;
  const card = ctx?.variant === 'card';
  const sel = useSharedValue(selected ? 1 : 0);
  const sink = usePressSink(t);

  useEffect(() => {
    sel.value = withSpring(selected ? 1 : 0, t.spring.press);
  }, [selected, sel, t.spring.press]);

  const sinkP = sink.p;
  const ringAnim = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.1 * sinkP.value }] }));
  const fillAnim = useAnimatedStyle(() => ({ opacity: sel.value }));
  const dotAnim = useAnimatedStyle(() => ({ transform: [{ scale: sel.value }] }));
  if (!ctx) throw new Error('SlateOS: <Radio> must be inside <RadioGroup>.');

  const lineH = t.type.body.lineHeight;
  const indicator = (
    <View style={{ height: lineH, justifyContent: 'center' }}>
      <Animated.View style={[{ width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' }, ringAnim]}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: DOT / 2, borderWidth: 1, borderColor: t.c.borderStrong, backgroundColor: t.c.surfaceRaised }]} />
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: DOT / 2, backgroundColor: t.c.accentSolid }, fillAnim]} />
        <Animated.View style={[{ width: t.space[2], height: t.space[2], borderRadius: t.space[1], backgroundColor: t.c.onAccent }, dotAnim]} />
      </Animated.View>
    </View>
  );
  const text = (
    <View style={{ flex: 1, gap: t.space['0_5'] }}>
      <Text weight={card ? '500' : undefined}>{label}</Text>
      {description ? <Text variant="footnote" tone="muted">{description}</Text> : null}
    </View>
  );

  return (
    <Touchable
      disabled={disabled}
      pressScale={card ? 0.98 : 1}
      haptic={selected ? false : 'selection'}
      onPressIn={sink.onPressIn}
      onPressOut={sink.onPressOut}
      onPress={() => !selected && ctx.select(value)}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: selected, disabled: !!disabled }}
      hitSlop={0}
      style={[
        { flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3], minHeight: t.size.touch },
        card
          ? {
              padding: t.space[4],
              borderRadius: t.component.cardRadius,
              borderWidth: 1,
              borderColor: t.c.border,
              backgroundColor: t.c.surfaceRaised,
              boxShadow: t.c.shadowXs,
            }
          : { paddingVertical: (t.size.touch - lineH) / 2 },
        style,
      ]}
    >
      {card ? (
        <>
          {/* The 2pt accent ring (border plus 1pt outside, so nothing shifts) fades in with the dot. */}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: t.component.cardRadius + 1, borderWidth: 2, borderColor: t.c.accent },
              fillAnim,
            ]}
          />
          {text}
          {aside}
          {indicator}
        </>
      ) : (
        <>
          {indicator}
          {text}
        </>
      )}
    </Touchable>
  );
}
