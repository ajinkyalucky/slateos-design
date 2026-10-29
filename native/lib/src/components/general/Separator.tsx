import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '../../primitives/Text';
import { useSlate } from '../../theme';

export type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical';
  /** Indent from the leading edge: true = t.space[4], or a number (e.g. to line up with list text). */
  inset?: boolean | number;
  /** A centred word in the line, such as "or". Horizontal only. */
  label?: string;
  /** Use the stronger border colour. */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** A hairline between groups of content, optionally inset or labelled. */
export function Separator({ orientation = 'horizontal', inset, label, strong, style }: SeparatorProps) {
  const t = useSlate();
  const color = strong ? t.c.borderStrong : t.c.border;
  const indent = inset === true ? t.space[4] : inset || 0;
  if (orientation === 'vertical')
    return <View accessibilityElementsHidden importantForAccessibility="no" style={[{ width: 1, alignSelf: 'stretch', backgroundColor: color, marginVertical: indent }, style]} />;
  if (label)
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], marginLeft: indent }, style]}>
        <View style={{ flex: 1, height: 1, backgroundColor: color }} />
        <Text variant="caption" tone="subtle">{label}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: color }} />
      </View>
    );
  return <View accessibilityElementsHidden importantForAccessibility="no" style={[{ height: 1, alignSelf: 'stretch', backgroundColor: color, marginLeft: indent }, style]} />;
}
