import { useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, type TextInputInstance } from 'react-native';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { Field } from './Field';
import type { InputProps } from './Input';
import { boxStyle, mergeRefs } from './shared';

export type TextareaProps = Omit<InputProps, 'icon' | 'trailing' | 'clearable' | 'secure' | 'size' | 'round' | 'variant' | 'multiline'> & {
  /** Rows shown when empty. Default 3. */
  minRows?: number;
  /** Rows it grows to before scrolling. Default 8. */
  maxRows?: number;
  /** Show "used/max" under the field when `maxLength` is set. Default true. */
  showCount?: boolean;
};

/** Multi-line text that grows with its content between minRows and maxRows, with an optional character count. */
export function Textarea({
  ref, label, hint, error, required, optional, disabled, minRows = 3, maxRows = 8, maxLength, showCount = true,
  inputStyle, style, value, defaultValue, onChangeText, onFocus, onBlur, onContentSizeChange, placeholder,
  accessibilityLabel, accessibilityHint, ...rest
}: TextareaProps) {
  const t = useSlate();
  const inner = useRef<TextInputInstance>(null);
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref]);
  const [own, setOwn] = useState(defaultValue ?? '');
  const [focused, setFocused] = useState(false);
  const [contentH, setContentH] = useState(0);
  const message = typeof error === 'string' && error ? error : undefined;

  const type = t.type.body;
  const lineH = type.lineHeight;
  const padV = Math.max(t.space[2], (t.control.md - lineH) / 2);
  const maxH = maxRows * lineH;
  const height = Math.min(maxH, Math.max(minRows * lineH, contentH));

  const len = (value ?? own).length;
  const left = maxLength != null ? maxLength - len : 0;
  const near = maxLength != null && left <= Math.max(5, Math.ceil(maxLength * 0.1));
  const counter = maxLength != null && showCount ? (
    <Text variant="footnote" tabular tone={near ? 'warning' : 'subtle'} accessibilityLabel={`${left} characters left`}>
      {len}/{maxLength}
    </Text>
  ) : null;

  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional} disabled={disabled} counter={counter} labelledControl style={style}>
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={() => inner.current?.focus()}
        style={[
          { borderRadius: t.component.inputRadius, paddingHorizontal: t.space[3], paddingVertical: padV },
          boxStyle(t, { focused, error: !!error, disabled }),
        ]}
      >
        <TextInput
          {...rest}
          ref={setRef}
          multiline
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          scrollEnabled={contentH > maxH}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={t.c.textSubtle}
          selectionColor={t.c.accent}
          cursorColor={t.c.accent}
          maxFontSizeMultiplier={2}
          textAlignVertical="top"
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityHint={accessibilityHint ?? message ?? hint}
          accessibilityState={{ disabled: !!disabled }}
          onChangeText={(s) => {
            if (value === undefined) setOwn(s);
            onChangeText?.(s);
          }}
          onContentSizeChange={(e) => {
            setContentH(e.nativeEvent.contentSize.height);
            onContentSizeChange?.(e);
          }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[
            {
              height,
              padding: 0,
              fontSize: type.fontSize,
              lineHeight: lineH,
              letterSpacing: type.letterSpacing,
              fontFamily: type.fontFamily,
              fontWeight: type.fontWeight,
              color: disabled ? t.c.textDisabled : t.c.text,
            },
            inputStyle,
          ]}
        />
      </Pressable>
    </Field>
  );
}
