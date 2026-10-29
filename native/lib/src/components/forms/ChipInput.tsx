import { useMemo, useRef, useState, type Ref } from 'react';
import { Pressable, TextInput, type StyleProp, type TextInputInstance, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Icon } from '../../primitives/Icon';
import { Text } from '../../primitives/Text';
import { Touchable } from '../../primitives/Touchable';
import { useSlate } from '../../theme';
import { Field } from './Field';
import { boxStyle, mergeRefs } from './shared';

export type ChipInputProps = Omit<TextInputProps, 'value' | 'defaultValue' | 'onChangeText' | 'style' | 'editable' | 'ref' | 'multiline'> & {
  value: string[];
  onValueChange?: (chips: string[]) => void;
  label?: string;
  hint?: string;
  error?: string | boolean;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  /** Most chips allowed. */
  max?: number;
  ref?: Ref<TextInputInstance>;
  style?: StyleProp<ViewStyle>;
};

/** Type and press return (or a comma) to add a chip; tap a chip's × to remove it. For tags, emails or keywords. */
export function ChipInput({
  value, onValueChange, label, hint, error, required, optional, disabled, max, ref, style, placeholder, onFocus, onBlur,
  onSubmitEditing, onKeyPress, accessibilityLabel, ...rest
}: ChipInputProps) {
  const t = useSlate();
  const inner = useRef<TextInputInstance>(null);
  const setRef = useMemo(() => mergeRefs(inner, ref), [ref]);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  // First backspace on an empty field selects the last chip; the second removes it.
  const [armed, setArmed] = useState(false);
  const full = max != null && value.length >= max;
  const chipH = t.size.controlSm;
  const message = typeof error === 'string' && error ? error : undefined;

  const add = (raw: string) => {
    const next = [...value];
    for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (max != null && next.length >= max) break;
      if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part);
    }
    setText('');
    if (next.length !== value.length) {
      t.haptic('selection');
      onValueChange?.(next);
    }
  };
  const remove = (i: number) => {
    t.haptic('selection');
    setArmed(false);
    onValueChange?.(value.filter((_, j) => j !== i));
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} optional={optional} disabled={disabled} labelledControl style={style}>
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={() => inner.current?.focus()}
        style={[
          {
            minHeight: t.control.md,
            borderRadius: t.component.inputRadius,
            paddingHorizontal: t.space[2],
            paddingVertical: Math.max(t.space[1], (t.control.md - 2 - chipH) / 2),
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: t.space['1_5'],
          },
          boxStyle(t, { focused, error: !!error, disabled }),
        ]}
      >
        {value.map((chip, i) => {
          const hot = armed && i === value.length - 1;
          return (
            <Animated.View
              key={chip}
              entering={FadeIn.duration(t.motion.duration.base)}
              exiting={FadeOut.duration(t.motion.duration.fast)}
              layout={LinearTransition.springify().duration(t.spring.standard.duration).dampingRatio(t.spring.standard.dampingRatio)}
              style={{
                height: chipH,
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space['0_5'],
                paddingLeft: t.space['2_5'],
                paddingRight: t.space[1],
                borderRadius: t.radius.md,
                backgroundColor: hot ? t.c.accentSolid : t.c.surfaceActive,
              }}
            >
              <Text variant="callout" weight="500" numberOfLines={1} style={{ color: hot ? t.c.onAccent : t.c.text, flexShrink: 1 }}>{chip}</Text>
              {!disabled && (
                <Touchable onPress={() => remove(i)} pressScale={0.85} hitSlop={t.space[2]} accessibilityLabel={`Remove ${chip}`}>
                  <Icon name="x" size={16} color={hot ? t.c.onAccent : t.c.textMuted} strokeWidth={1.75} />
                </Touchable>
              )}
            </Animated.View>
          );
        })}
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          {...rest}
          ref={setRef}
          value={text}
          editable={!disabled}
          submitBehavior="submit"
          placeholder={value.length ? undefined : placeholder}
          placeholderTextColor={t.c.textSubtle}
          selectionColor={t.c.accent}
          cursorColor={t.c.accent}
          maxFontSizeMultiplier={2}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityHint={message ?? hint ?? (full ? `Limit of ${max} reached` : 'Press return to add')}
          accessibilityState={{ disabled: !!disabled }}
          onChangeText={(s) => {
            setArmed(false);
            if (s.includes(',')) add(s);
            else setText(s);
          }}
          onSubmitEditing={(e) => {
            add(text);
            onSubmitEditing?.(e);
          }}
          onKeyPress={(e) => {
            if (e.nativeEvent.key === 'Backspace' && text === '' && value.length) {
              if (armed) remove(value.length - 1);
              else setArmed(true);
            }
            onKeyPress?.(e);
          }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); setArmed(false); onBlur?.(e); }}
          style={{
            flexGrow: 1,
            minWidth: t.space[10],
            height: chipH,
            paddingVertical: 0,
            paddingHorizontal: t.space[1],
            fontSize: t.type.body.fontSize,
            letterSpacing: t.type.body.letterSpacing,
            fontFamily: t.type.body.fontFamily,
            fontWeight: t.type.body.fontWeight,
            color: disabled ? t.c.textDisabled : t.c.text,
          }}
        />
      </Pressable>
    </Field>
  );
}
