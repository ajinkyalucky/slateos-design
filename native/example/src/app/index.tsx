import { Fragment, useEffect } from 'react';
import { Platform, ScrollView, Settings, View, useWindowDimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text, Touchable, useSlate } from '@ajinkyabhagwat/slateos-native';
import { blockCategories, blocks } from '../blocks';
import { allPages, groups } from '../demos';
import { HomeHero } from '../showcase/HomeHero';

export default function Home() {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Two cards per row inside the screen padding.
  const tile = Math.floor((width - t.space[4] * 2 - t.space[3]) / 2);
  // Docs screenshots: launching with `-slateosShot <block>` (simctl launch args) opens that block full screen.
  useEffect(() => {
    const shot = Platform.OS === 'ios' ? Settings.get('slateosShot') : null;
    if (typeof shot === 'string') router.replace(`/shot/${shot}`);
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: t.space[4], paddingTop: insets.top + t.space[2], paddingBottom: t.space[10], gap: t.space[6] }}>
      <View style={{ gap: t.space[3] }}>
        <HomeHero />
        <Text variant="footnote" tone="subtle">Tap the palette button on any screen to change the look. The bloom follows it.</Text>
      </View>

      {blockCategories.map((cat) => (
        <View key={cat} style={{ gap: t.space[2] }}>
          <Text variant="overline" tone="subtle">{`Blocks · ${cat}`}</Text>
          {/* Each block is a card with room around it: on iOS 18+ the screen zooms out of its card and,
              pulled down, lands back into the same rounded shape without covering its neighbours. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
            {blocks.filter((b) => b.category === cat).map((b) => (
              <Link key={b.name} href={`/block/${b.name}`} asChild>
                <Link.AppleZoom>
                  <Touchable
                    pressScale={0.97}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.title} screen`}
                    style={{
                      width: tile,
                      aspectRatio: 1,
                      padding: t.space[4],
                      justifyContent: 'space-between',
                      backgroundColor: t.c.surfaceRaised,
                      borderRadius: t.component.cardRadius,
                      borderCurve: 'continuous',
                      borderWidth: 1,
                      borderColor: t.c.border,
                    }}
                  >
                    <Icon name="maximize" size={16} color={t.c.textSubtle} />
                    <View style={{ gap: t.space[1] }}>
                      <Text variant="headline" numberOfLines={1}>{b.title}</Text>
                      <Text variant="footnote" tone="muted" numberOfLines={3}>{b.description}</Text>
                    </View>
                  </Touchable>
                </Link.AppleZoom>
              </Link>
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
