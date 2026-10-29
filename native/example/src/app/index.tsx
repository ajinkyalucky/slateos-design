import { Fragment } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text, Touchable, tokens, useSlate } from '@ajinkyabhagwat/slateos-native';
import { allPages, groups } from '../demos';
import { useSettings } from '../showcase/settings';

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const t = useSlate();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: t.c.surfaceHover, borderRadius: t.radius.lg, padding: 2 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Touchable
            key={o.value}
            onPress={() => onChange(o.value)}
            haptic="selection"
            pressScale={0.96}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1, height: t.control.sm, alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.md,
              backgroundColor: on ? t.c.surfaceRaised : 'transparent', boxShadow: on ? t.c.shadowSm : undefined,
            }}
          >
            <Text variant="label" tone={on ? 'default' : 'muted'}>{o.label}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}

const brandSwatches = ['default', 'blue', 'violet', 'green', 'orange', 'rose'] as const;

export default function Home() {
  const t = useSlate();
  const s = useSettings();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ padding: t.space[4], paddingTop: insets.top + t.space[6], paddingBottom: t.space[10], gap: t.space[6] }}>
      <View style={{ gap: t.space[2] }}>
        <Text variant="title1" accessibilityRole="header">SlateOS</Text>
        <Text tone="muted">The SlateOS tokens and components, built for touch.</Text>
        <Text variant="footnote" tone="subtle">{allPages.length} {allPages.length === 1 ? 'component' : 'components'} · the same tokens as the web</Text>
      </View>

      <View style={{ gap: t.space[3] }}>
        <Text variant="overline" tone="subtle">Theme</Text>
        <Choice value={s.scheme} onChange={(scheme) => s.set({ scheme })} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <Choice value={s.corners} onChange={(corners) => s.set({ corners })} options={[{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]} />
        <Choice value={s.density} onChange={(density) => s.set({ density })} options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'comfortable', label: 'Roomy' }]} />
        <View style={{ flexDirection: 'row', gap: t.space[3], paddingTop: t.space[1] }}>
          {brandSwatches.map((b) => {
            const color = b === 'default' ? tokens.colors[t.scheme].accentSolid : tokens.brands[b][t.scheme].accent;
            const on = s.brand === b;
            return (
              <Touchable
                key={b}
                onPress={() => s.set({ brand: b })}
                haptic="selection"
                pressScale={0.9}
                accessibilityLabel={`${b} brand`}
                accessibilityState={{ selected: on }}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? color : 'transparent' }}
              >
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color }} />
              </Touchable>
            );
          })}
        </View>
      </View>

      {groups.map((g) => {
        const pages = allPages.filter((p) => p.group === g);
        if (!pages.length) return null;
        return (
          <View key={g} style={{ gap: t.space[2] }}>
            <Text variant="overline" tone="subtle">{g}</Text>
            <View style={{ backgroundColor: t.c.surfaceRaised, borderRadius: t.component.listRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden' }}>
              {pages.map((p, i) => (
                <Fragment key={p.slug}>
                  {i > 0 && <View style={{ height: 1, backgroundColor: t.c.borderSubtle, marginLeft: t.space[4] }} />}
                  <Touchable
                    onPress={() => router.push(`/${p.slug}`)}
                    pressScale={1}
                    pressedStyle={{ backgroundColor: t.c.surfaceHover }}
                  >
                    <View style={{ minHeight: t.component.rowHeight, paddingHorizontal: t.space[4], flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
                      <Text style={{ flex: 1 }}>{p.name}</Text>
                      <Text variant="footnote" tone="subtle">{p.demos.length}</Text>
                      <Icon name="chevron-right" size={16} color={t.c.textSubtle} />
                    </View>
                  </Touchable>
                </Fragment>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
