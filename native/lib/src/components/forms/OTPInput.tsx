import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { Platform, StyleSheet, TextInput, View, type StyleProp, type TextInputInstance, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { Field } from './Field';
import { boxStyle, mergeRefs } from './shared';

export type OTPInputProps = {
  value: string;
  onChangeText?: (value: string) => void;
  /** Called once every box is filled, by typing, paste or SMS autofill. */
  onComplete?: (code: string) => void;
  /** Number of boxes. Default 6. */
  length?: number;
  /** 'numeric' (default) keeps digits only; 'alphanumeric' keeps letters and digits, upper-cased. */
  type?: 'numeric' | 'alphanumeric';
  label?: string;
  hint?: string;
  /** Turns the boxes red and shakes them once; a message shows underneath. */
  error?: string | boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  ref?: Ref<TextInputInstance>;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** One-time code entry: N boxes over one hidden field, so SMS autofill and paste fill every box at once. */
export function OTPInput({
  value, onChangeText, onComplete, length = 6, type = 'numeric', label, hint, error, disabled, autoFocus, ref, accessibilityLabel, style,
}: OTPInputProps) {
  const t = useSlate();
  const inner = useRef<TextInputInstance>(null);
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref]);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  const change = (raw: string) => {
    const clean = (type === 'numeric' ? raw.replace(/\D/g, '') : raw.replace(/[^a-z0-9]/gi, '').toUpperCase()).slice(0, length);
    onChangeText?.(clean);
    if (clean.length === length && value.length !== length) onComplete?.(clean);
  };

  // A short horizontal shake on each new error: an underdamped spring, skipped under Reduce Motion.
  const shake = useSharedValue(0);
  useEffect(() => {
    if (!error) return;
    t.haptic('error');
    shake.value = withSequence(withTiming(t.space[2], { duration: t.motion.duration.instant }), withSpring(0, { duration: 520, dampingRatio: 0.22 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
  const shakeAnim = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Field label={label} hint={hint} error={error} disabled={disabled} labelledControl style={style}>
      <Animated.View style={[{ alignSelf: 'stretch' }, shakeAnim]}>
        <View style={{ flexDirection: 'row', gap: t.space[2] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length }, (_, i) => (
            <Cell key={i} char={value[i]} active={focused && !disabled && i === active} caret={value.length < length} error={!!error} disabled={disabled} />
          ))}
        </View>
        <TextInput
          ref={setRef}
          value={value}
          onChangeText={change}
          editable={!disabled}
          autoFocus={autoFocus}
          keyboardType={type === 'numeric' ? 'number-pad' : 'default'}
          autoCapitalize="characters"
          autoCorrect={false}
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          caretHidden
          selectionColor="transparent"
          accessibilityLabel={accessibilityLabel ?? label ?? 'Verification code'}
          accessibilityHint={(typeof error === 'string' && error) || hint || `${length} characters`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          // Covers the boxes so a tap anywhere focuses it and a long press offers Paste; its own text is invisible.
          style={[StyleSheet.absoluteFill, { color: 'transparent', backgroundColor: 'transparent', fontSize: t.type.body.fontSize }]}
        />
      </Animated.View>
    </Field>
  );
}

function Cell({ char, active, caret, error, disabled }: { char?: string; active: boolean; caret: boolean; error: boolean; disabled?: boolean }) {
  const t = useSlate();
  const blink = useSharedValue(1);
  const steady = t.reducedMotion;
  const showCaret = active && caret && !char;

  useEffect(() => {
    cancelAnimation(blink);
    blink.value = 1;
    // The caret is a functional cue, so it blinks like the system one; Reduce Motion keeps it solid.
    if (showCaret && !steady) {
      blink.value = withRepeat(
        withSequence(withDelay(500, withTiming(0, { duration: 120 })), withDelay(380, withTiming(1, { duration: 120 }))),
        -1,
      );
    }
  }, [showCaret, steady, blink]);
  const caretAnim = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View
      style={[
        {
          flex: 1,
          height: t.control.lg,
          borderRadius: t.component.inputRadius,
          alignItems: 'center',
          justifyContent: 'center',
        },
        boxStyle(t, { focused: active, error, disabled }),
        !!char && !active && !error && { borderColor: t.c.borderStrong },
      ]}
    >
      {char ? (
        <Text variant="title3" tabular tone={disabled ? 'disabled' : 'default'}>{char}</Text>
      ) : showCaret ? (
        <Animated.View style={[{ width: t.space['0_5'], height: t.type.title3.lineHeight, borderRadius: 1, backgroundColor: t.c.accent }, caretAnim]} />
      ) : null}
    </View>
  );
}
