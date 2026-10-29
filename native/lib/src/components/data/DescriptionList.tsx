import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';
import { IconButton } from '../general/Button';

export type DescriptionItem = {
  label: string;
  value: ReactNode;
  /** Show a copy button for this row. Needs `onCopy` on the list. */
  copyable?: boolean;
  /** Monospaced value, for IDs and codes. */
  mono?: boolean;
  /** The text to copy when value is not a string. */
  copyText?: string;
};

export type DescriptionListProps = {
  items: DescriptionItem[];
  /** 'row' puts label and value side by side; 'stacked' puts the value under the label. */
  layout?: 'row' | 'stacked';
  /** Called with the row's text; write it to the clipboard (e.g. expo-clipboard). */
  onCopy?: (text: string, item: DescriptionItem) => void;
  style?: StyleProp<ViewStyle>;
};

/** Label and value pairs for detail screens: an order, a transaction, an account. */
export function DescriptionList({ items, layout = 'row', onCopy, style }: DescriptionListProps) {
  const t = useSlate();
  const [copied, setCopied] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (i: number, item: DescriptionItem) => {
    const text = item.copyText ?? (typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value) : '');
    onCopy?.(text, item);
    t.haptic('success');
    setCopied(i);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1400);
  };
  const stacked = layout === 'stacked';
  return (
    <View style={style}>
      {items.map((item, i) => {
        const text = typeof item.value === 'string' || typeof item.value === 'number';
        return (
          <View
            key={`${item.label}-${i}`}
            style={{
              minHeight: t.component.rowHeight,
              flexDirection: stacked ? 'column' : 'row',
              alignItems: stacked ? 'stretch' : 'center',
              justifyContent: 'center',
              gap: stacked ? t.space['0_5'] : t.space[4],
              paddingVertical: t.space[stacked ? 3 : 2],
              borderTopWidth: i ? 1 : 0,
              borderTopColor: t.c.borderSubtle,
            }}
          >
            <Text variant={stacked ? 'footnote' : 'callout'} tone="muted" style={stacked ? undefined : { flexShrink: 0, maxWidth: '45%' }}>
              {item.label}
            </Text>
            <View style={{ flex: stacked ? undefined : 1, flexDirection: 'row', alignItems: 'center', justifyContent: stacked ? 'flex-start' : 'flex-end', gap: t.space[1] }}>
              {text ? (
                <Text variant="callout" weight="500" mono={item.mono} selectable align={stacked ? 'left' : 'right'} style={{ flexShrink: 1 }}>
                  {item.value}
                </Text>
              ) : (
                item.value
              )}
              {item.copyable && onCopy && (
                <IconButton
                  icon={copied === i ? 'check' : 'copy'}
                  size="sm"
                  haptic={false}
                  accessibilityLabel={copied === i ? `${item.label} copied` : `Copy ${item.label}`}
                  onPress={() => copy(i, item)}
                  style={{ marginRight: -t.space[2], marginVertical: -t.space[1] }}
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
