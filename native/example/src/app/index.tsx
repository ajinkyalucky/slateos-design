import { Fragment, useEffect } from 'react';
import { Platform, ScrollView, Settings, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text, Touchable, useSlate } from '@ajinkyabhagwat/slateos-native';
import { blockCategories, blocks } from '../blocks';
import { allPages, groups } from '../demos';

export default function Home() {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  // Docs screenshots: launching with `-slateosShot <block>` (simctl launch args) opens that block full screen.
  useEffect(() => {
    const shot = Platform.OS === 'ios' ? Settings.get('slateosShot') : null;
    if (typeof shot === 'string') router.replace(`/shot/${shot}`);
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: t.space[4], paddingTop: insets.top + t.space[6], paddingBottom: t.space[10], gap: t.space[6] }}>
      <View style={{ gap: t.space[2] }}>
        <Text variant="title1" accessibilityRole="header">SlateOS</Text>
        <Text tone="muted">The SlateOS tokens and components, built for touch.</Text>
        <Text variant="footnote" tone="subtle">{allPages.length} {allPages.length === 1 ? 'component' : 'components'} · {blocks.length} screens · the same tokens as the web</Text>
        <Text variant="footnote" tone="subtle">Tap the palette button on any screen to change the style and theme.</Text>
      </View>

      {blockCategories.map((cat) => (
        <View key={cat} style={{ gap: t.space[2] }}>
          <Text variant="overline" tone="subtle">{`Blocks · ${cat}`}</Text>
          <View style={{ backgroundColor: t.c.surfaceRaised, borderRadius: t.component.listRadius, borderWidth: 1, borderColor: t.c.border, overflow: 'hidden' }}>
            {blocks.filter((b) => b.category === cat).map((b, i) => (
              <Fragment key={b.name}>
                {i > 0 && <View style={{ height: 1, backgroundColor: t.c.borderSubtle, marginLeft: t.space[4] }} />}
                <Touchable onPress={() => router.push(`/block/${b.name}`)} pressScale={1} pressedStyle={{ backgroundColor: t.c.surfaceHover }} accessibilityRole="button" accessibilityLabel={`${b.title} screen`}>
                  <View style={{ minHeight: t.component.rowHeight, paddingHorizontal: t.space[4], paddingVertical: t.space[3], flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text>{b.title}</Text>
                      <Text variant="footnote" tone="muted" numberOfLines={2}>{b.description}</Text>
                    </View>
                    <Icon name="maximize" size={16} color={t.c.textSubtle} />
                  </View>
                </Touchable>
              </Fragment>
            ))}
          </View>
        </View>
      ))}

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
