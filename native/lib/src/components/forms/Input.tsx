import { useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import {
  Pressable, TextInput, type StyleProp, type TextInputInstance, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { Icon, type IconName } from '../../primitives/Icon';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Field } from './Field';
import { boxStyle, mergeRefs } from './shared';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled';

export type InputProps = Omit<TextInputProps, 'style' | 'editable' | 'ref' | 'secureTextEntry'> & {
  ref?: Ref<TextInputInstance>;
  label?: string;
  hint?: string;
  /** A message shows under the field; `true` only turns the border red. */
  error?: string | boolean;
  required?: boolean;
  optional?: boolean;
  size?: InputSize;
  /** 'outline' (default) or 'filled', a borderless grey field. */
  variant?: InputVariant;
  /** Leading icon. */
  icon?: IconName;
  /** Trailing icon, or any element such as a unit label or a button. */
  trailing?: IconName | ReactNode;
  /** Show a clear button while there is text. */
  clearable?: boolean;
  /** Hide the text, with an eye button to reveal it. */
  secure?: boolean;
  disabled?: boolean;
  /** Pill-shaped ends, as in search fields. */
  round?: boolean;
  /** Style for the TextInput itself. */
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

/** A single-line text field with label, hint and error, icons, and clear and reveal buttons. 44pt by default. */
export function Input({
  ref, label, hint, error, required, optional, size = 'md', variant = 'outline', icon, trailing, clearable, secure, disabled, round,
  inputStyle, style, value, defaultValue, onChangeText, onFocus, onBlur, placeholder, accessibilityLabel, accessibilityHint, ...rest
}: InputProps) {
  const t = useSlate();
  const inner = useRef<TextInputInstance>(null);
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref]);
  const [own, setOwn] = useState(defaultValue ?? '');
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const text = value ?? own;
  const message = typeof error === 'string' && error ? error : undefined;
  const h = t.control[size];
  const type = size === 'sm' ? t.type.callout : t.type.body;
  const iconSize = size === 'sm' ? 16 : 20;

  const change = (s: string) => {
    if (value === undefined) setOwn(s);
    onChangeText?.(s);
  };
  const accessory = (name: IconName, label: string, onPress: () => void) => (
    <Touchable onPress={onPress} accessibilityLabel={label} hitSlop={(t.size.touch - iconSize) / 2} pressScale={0.88} haptic="selection">
      <Icon name={name} size={iconSize} color={t.c.textSubtle} />
    </Touchable>
  );

  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional} disabled={disabled} labelledControl style={style}>
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={() => inner.current?.focus()}
        style={[
          {
            minHeight: h,
            borderRadius: round ? h / 2 : t.component.inputRadius,
            paddingHorizontal: { sm: t.space['2_5'], md: t.space[3], lg: t.space[4] }[size],
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.space[2],
          },
          boxStyle(t, { focused, error: !!error, disabled, filled: variant === 'filled' }),
        ]}
      >
        {icon && <Icon name={icon} size={iconSize} color={t.c.textSubtle} />}
        <TextInput
          {...rest}
          ref={setRef}
          value={value}
          defaultValue={defaultValue}
          onChangeText={change}
          editable={!disabled}
          secureTextEntry={secure && !reveal}
          placeholder={placeholder}
          placeholderTextColor={t.c.textSubtle}
          selectionColor={t.c.accent}
          cursorColor={t.c.accent}
          maxFontSizeMultiplier={2}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityHint={accessibilityHint ?? message ?? hint}
          accessibilityState={{ disabled: !!disabled }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[
            {
              flex: 1,
              alignSelf: 'stretch',
              paddingVertical: 0,
              paddingHorizontal: 0,
              fontSize: type.fontSize,
              letterSpacing: type.letterSpacing,
              fontFamily: type.fontFamily,
              fontWeight: type.fontWeight,
              color: disabled ? t.c.textDisabled : t.c.text,
            },
            inputStyle,
          ]}
        />
        {clearable && !disabled && text.length > 0 &&
          accessory('x-circle', 'Clear text', () => {
            inner.current?.clear();
            change('');
          })}
        {secure && !disabled && accessory(reveal ? 'eye-off' : 'eye', reveal ? 'Hide password' : 'Show password', () => setReveal((r) => !r))}
        {typeof trailing === 'string' ? <Icon name={trailing as IconName} size={iconSize} color={t.c.textSubtle} /> : trailing}
      </Pressable>
    </Field>
  );
}
