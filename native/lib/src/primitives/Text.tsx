import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useSlate } from '../theme';
import type { TypeVariant } from '../tokens';

export type TextTone = 'default' | 'muted' | 'subtle' | 'disabled' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'onAccent' | 'inverse';

export type TextProps = RNTextProps & {
  /** Type style from the mobile scale. Default: body. */
  variant?: TypeVariant;
  tone?: TextTone;
  weight?: '400' | '500' | '600' | '700';
  align?: TextStyle['textAlign'];
  /** Tabular, lining numerals (level digits even in old-style serifs), for counters, prices and timers. */
  tabular?: boolean;
  mono?: boolean;
};

const toneKey = {
  default: 'text', muted: 'textMuted', subtle: 'textSubtle', disabled: 'textDisabled', accent: 'accent',
  success: 'success', warning: 'warning', danger: 'danger', info: 'info', onAccent: 'onAccent', inverse: 'onInverse',
} as const;

/** Text on the SlateOS type scale. Scales with Dynamic Type up to 2x so layouts hold. */
export function Text({ variant = 'body', tone = 'default', weight, align, tabular, mono, style, ...rest }: TextProps) {
  const t = useSlate();
  const v = t.type[variant];
  return (
    <RNText
      maxFontSizeMultiplier={variant === 'display' || variant.startsWith('title') ? 1.4 : 2}
      {...rest}
      style={[
        v,
        weight && t.font(weight),
        { color: t.c[toneKey[tone]] },
        variant === 'overline' && { textTransform: 'uppercase' },
        align && { textAlign: align },
        tabular && { fontVariant: ['lining-nums', 'tabular-nums'] },
        mono && { fontFamily: t.mono, fontWeight: '400', letterSpacing: 0 },
        style,
      ]}
    />
  );
}
