import { ScrollView, View } from 'react-native';
import { Badge, Button, SlateProvider, Text, Touchable, tokens, useSlate, type VibeName } from '@ajinkyabhagwat/slateos-native';
import { useSettings } from './settings';

const vibeNames = Object.keys(tokens.vibes) as VibeName[];

/** A live sample of one app vibe, rendered inside its own provider (and its own scheme). */
function VibeTile({ name, on, onPress }: { name: VibeName; on: boolean; onPress: () => void }) {
  const t = useSlate();
  const v = tokens.vibes[name];
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.97}
      accessibilityRole="radio"
      accessibilityLabel={`${v.label}, ${v.like} style`}
      accessibilityHint={v.tagline}
      accessibilityState={{ checked: on }}
      style={{ width: 152, gap: t.space[2] }}
    >
      <View
        pointerEvents="none"
        style={{ borderRadius: t.radius.xl, borderWidth: on ? 2 : 1, borderColor: on ? t.c.accentSolid : t.c.border, overflow: 'hidden' }}
      >
        <SlateProvider vibe={name} haptics={false}>
          <Sample />
        </SlateProvider>
      </View>
      <View style={{ gap: 2, paddingHorizontal: t.space[1] }}>
        <Text variant="label">{v.label}</Text>
        <Text variant="caption" tone="muted">{`${v.like}-style`}</Text>
      </View>
    </Touchable>
  );
}

function Sample() {
  const t = useSlate();
  return (
    <View style={{ backgroundColor: t.c.bg, padding: t.space[3], gap: t.space[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="label" numberOfLines={1}>Tonight</Text>
        <Badge tone="accent" size="sm">New</Badge>
      </View>
      <View style={{ height: 36, borderRadius: t.component.cardRadius, backgroundColor: t.c.surfaceHover }} />
      <Button size="sm" block>Continue</Button>
    </View>
  );
}

/**
 * App vibes: one tap sets the style, brand colour, scheme and dials of a well-known app's feel.
 * Picking one clears the single dials so the whole vibe shows; changing a dial afterwards overrides it.
 */
export function VibePicker() {
  const t = useSlate();
  const s = useSettings();
  const pick = (vibe: VibeName | undefined) =>
    s.set(vibe
      ? { vibe, style: undefined, corners: undefined, density: undefined, scheme: tokens.vibes[vibe].scheme, brand: tokens.vibes[vibe].brand === 'custom' ? `vibe:${vibe}` : tokens.vibes[vibe].brand }
      : { vibe: undefined, style: undefined, corners: undefined, density: undefined, scheme: 'system', brand: 'default' });
  return (
    <View style={{ gap: t.space[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text variant="overline" tone="subtle">App vibe</Text>
        {s.vibe && (
          <Touchable onPress={() => pick(undefined)} haptic="selection" pressScale={0.94} accessibilityLabel="Clear app vibe">
            <Text variant="label" tone="muted">Clear</Text>
          </Touchable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        accessibilityLabel="App vibe"
        style={{ marginHorizontal: -t.space[4] }}
        contentContainerStyle={{ paddingHorizontal: t.space[4], gap: t.space[3] }}
      >
        {vibeNames.map((n) => (
          <VibeTile key={n} name={n} on={s.vibe === n} onPress={() => pick(n)} />
        ))}
      </ScrollView>
      {s.vibe && <Text variant="footnote" tone="muted">{tokens.vibes[s.vibe].tagline}</Text>}
    </View>
  );
}
