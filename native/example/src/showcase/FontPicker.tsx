import { ScrollView, View } from 'react-native';
import { SlateProvider, Text, Touchable, tokens, useSlate, type FontName } from '@ajinkyabhagwat/slateos-native';
import { useSettings } from './settings';

const fontNames = Object.keys(tokens.fonts) as FontName[];

/** One font vibe as a chip: "Aa" in its heading face and its name in its body face. */
function FontChip({ name, on, onPress }: { name: FontName; on: boolean; onPress: () => void }) {
  const t = useSlate();
  const f = tokens.fonts[name];
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.96}
      accessibilityRole="radio"
      accessibilityLabel={`${f.label} font`}
      accessibilityState={{ checked: on }}
      style={{
        minWidth: 84, paddingVertical: t.space[2], paddingHorizontal: t.space[3], gap: 2, alignItems: 'flex-start',
        borderRadius: t.radius.lg, borderWidth: on ? 2 : 1, borderColor: on ? t.c.accentSolid : t.c.border, backgroundColor: t.c.surfaceRaised,
      }}
    >
      {/* Rendered inside its own font so the chip previews the face. */}
      <SlateProvider font={name} scheme={t.scheme} haptics={false}>
        <Text variant="title3" numberOfLines={1}>Aa</Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>{f.label}</Text>
      </SlateProvider>
    </Touchable>
  );
}

/** Font vibes, the same 15 as the web. "Style" goes back to the style's (or vibe's) own font. */
export function FontPicker() {
  const t = useSlate();
  const s = useSettings();
  const current = s.font === undefined ? undefined : t.settings.font;
  return (
    <View style={{ gap: t.space[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text variant="overline" tone="subtle">Font</Text>
        {s.font !== undefined && (
          <Touchable onPress={() => s.set({ font: undefined })} haptic="selection" pressScale={0.94} accessibilityLabel="Use the style's font">
            <Text variant="label" tone="muted">Style font</Text>
          </Touchable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        accessibilityLabel="Font"
        style={{ marginHorizontal: -t.space[4] }}
        contentContainerStyle={{ paddingHorizontal: t.space[4], gap: t.space[2] }}
      >
        {fontNames.map((n) => (
          <FontChip key={n} name={n} on={current === n || (current === undefined && t.settings.font === n)} onPress={() => s.set({ font: n })} />
        ))}
      </ScrollView>
    </View>
  );
}
