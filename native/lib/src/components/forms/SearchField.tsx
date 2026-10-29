import { useEffect, useMemo, useRef, useState } from 'react';
import { View, type TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Input, type InputProps } from './Input';
import { mergeRefs } from './shared';

export type SearchFieldProps = Omit<
  InputProps,
  'icon' | 'label' | 'hint' | 'error' | 'required' | 'optional' | 'variant' | 'round' | 'secure' | 'clearable'
> & {
  /** Called after Cancel clears and blurs the field. */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Slide in a Cancel button while focused. Default true. */
  showCancel?: boolean;
};

/** A rounded search field. While focused, a Cancel button slides in that clears and dismisses it. */
export function SearchField({
  ref, onCancel, cancelLabel = 'Cancel', showCancel = true, placeholder = 'Search', value, defaultValue, onChangeText,
  onFocus, onBlur, style, ...rest
}: SearchFieldProps) {
  const t = useSlate();
  const inner = useRef<TextInputInstance>(null);
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref]);
  const [own, setOwn] = useState(defaultValue ?? '');
  const [focused, setFocused] = useState(false);
  const [cancelW, setCancelW] = useState(0);
  const text = value ?? own;
  const open = focused && showCancel;

  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withSpring(open ? 1 : 0, t.spring.standard);
  }, [open, p, t.spring.standard]);
  const shift = cancelW + t.space[3];
  // The field gives up room for Cancel, which slides in from the right edge.
  const fieldAnim = useAnimatedStyle(() => ({ marginRight: p.value * shift }));
  const cancelAnim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: (1 - p.value) * shift }] }));

  const change = (s: string) => {
    if (value === undefined) setOwn(s);
    onChangeText?.(s);
  };
  const cancel = () => {
    change('');
    inner.current?.blur();
    onCancel?.();
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      <Animated.View style={[{ flex: 1 }, fieldAnim]}>
        <Input
          {...rest}
          ref={setRef}
          icon="search"
          variant="filled"
          round
          clearable
          returnKeyType="search"
          placeholder={placeholder}
          value={text}
          onChangeText={change}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        />
      </Animated.View>
      <Animated.View
        onLayout={(e) => setCancelW(e.nativeEvent.layout.width)}
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        style={[{ position: 'absolute', right: 0 }, cancelAnim]}
      >
        <Touchable onPress={cancel} pressScale={1} pressOpacity={0.5} style={{ minHeight: t.size.touch, justifyContent: 'center' }}>
          <Text tone="accent" weight="500">{cancelLabel}</Text>
        </Touchable>
      </Animated.View>
    </View>
  );
}
