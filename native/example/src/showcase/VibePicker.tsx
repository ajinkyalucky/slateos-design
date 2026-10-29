import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { Badge, Button, Icon, Progress, SlateProvider, Text, Touchable, tokens, useSlate, type IconName, type VibeName } from '@ajinkyabhagwat/slateos-native';
import { useSettings } from './settings';

const vibeNames = Object.keys(tokens.vibes) as VibeName[];

const CARD_H = 248;

/** A live sample of one app vibe: a tiny screen of that kind of app, in its own provider (and scheme). */
function VibeTile({ name, on, onPress, width }: { name: VibeName; on: boolean; onPress: () => void; width: number }) {
  const t = useSlate();
  const v = tokens.vibes[name];
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.98}
      accessibilityRole="radio"
      accessibilityLabel={`${v.label}, ${v.like} style`}
      accessibilityHint={v.tagline}
      accessibilityState={{ checked: on }}
      style={{ width, gap: t.space[2] }}
    >
      <View
        pointerEvents="none"
        style={{ height: CARD_H, borderRadius: t.radius.xl, borderWidth: on ? 2 : 1, borderColor: on ? t.c.accentSolid : t.c.border, overflow: 'hidden' }}
      >
        <SlateProvider vibe={name} haptics={false}>
          <Sample name={name} />
        </SlateProvider>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2], paddingHorizontal: t.space[1] }}>
        <Text variant="label">{v.label}</Text>
        <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>{`${v.like}-style`}</Text>
      </View>
    </Touchable>
  );
}

/** A placeholder photo: the brand tint with an icon, in the vibe's own corner radius. */
function Photo({ height, icon = 'image', radius }: { height: number; icon?: IconName; radius?: number }) {
  const t = useSlate();
  return (
    <View style={{ height, borderRadius: radius ?? t.component.cardRadius, backgroundColor: t.c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={20} color={t.c.accent} />
    </View>
  );
}

function Row({ icon, title, meta, trailing }: { icon?: IconName; title: string; meta?: string; trailing?: ReactNode }) {
  const t = useSlate();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
      {icon && <Icon name={icon} size={16} color={t.c.textMuted} />}
      <View style={{ flex: 1 }}>
        <Text variant="footnote" weight="500" numberOfLines={1}>{title}</Text>
        {meta && <Text variant="caption" tone="muted" numberOfLines={1}>{meta}</Text>}
      </View>
      {trailing}
    </View>
  );
}

// One small screen per vibe, written to feel like the kind of app it evokes.
function Sample({ name }: { name: VibeName }) {
  const t = useSlate();
  const pad = { flex: 1, backgroundColor: t.c.bg, padding: t.space[3], gap: t.space[2] } as const;
  switch (name) {
    case 'coral':
      return (
        <View style={pad}>
          <View>
            <Photo height={100} icon="home" />
            <View style={{ position: 'absolute', top: 8, right: 8 }}><Icon name="heart" size={16} color={t.c.accent} /></View>
          </View>
          <Row title="Cabin in Big Sur" meta="★ 4.92 · Ocean view" />
          <Text variant="footnote"><Text variant="footnote" weight="600">$248</Text> night</Text>
          <View style={{ flex: 1 }} />
          <Button size="sm" block>Reserve</Button>
        </View>
      );
    case 'cinema':
      return (
        <View style={pad}>
          <Text variant="label">Trending now</Text>
          <View style={{ flexDirection: 'row', gap: t.space['1_5'] }}>
            {[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, height: 92, borderRadius: t.radius.sm, backgroundColor: i === 0 ? t.c.accentSolid : t.c.surfaceHover }} />)}
          </View>
          <Row title="Dark Waters" meta="98% match · 2026 · 2 seasons" />
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', gap: t.space[2] }}>
            <Button size="sm" icon="play" style={{ flex: 1 }}>Play</Button>
            <Button size="sm" variant="secondary" icon="plus" style={{ flex: 1 }}>List</Button>
          </View>
        </View>
      );
    case 'pinboard':
      return (
        <View style={pad}>
          <View style={{ flexDirection: 'row', gap: t.space[2], flex: 1 }}>
            <View style={{ flex: 1, gap: t.space[2] }}><Photo height={96} icon="image" /><Photo height={52} icon="heart" /></View>
            <View style={{ flex: 1, gap: t.space[2] }}><Photo height={60} icon="star" /><Photo height={88} icon="palette" /></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="footnote" weight="600">Kitchen ideas</Text>
            <Button size="sm">Save</Button>
          </View>
        </View>
      );
    case 'groove':
      return (
        <View style={pad}>
          <View style={{ flexDirection: 'row', gap: t.space[2], alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: t.radius.md, backgroundColor: t.c.accentSolid, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="activity" size={24} color={t.c.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label" numberOfLines={1}>Daily Mix 2</Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>Made for you · 50 songs</Text>
            </View>
          </View>
          <Row title="Midnight City" meta="M83" trailing={<Icon name="heart" size={16} color={t.c.accent} />} />
          <Progress value={42} accessibilityLabel="Playback" />
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.space[4] }}>
            <Icon name="arrow-left" size={20} color={t.c.textMuted} />
            <View style={{ width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: t.c.accentSolid, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={16} color={t.c.onAccent} />
            </View>
            <Icon name="arrow-right" size={20} color={t.c.textMuted} />
          </View>
        </View>
      );
    case 'streak':
      return (
        <View style={pad}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge tone="warning" icon="zap">12 day streak</Badge>
            <Icon name="star" size={16} color={t.c.warning} />
          </View>
          <Text variant="headline">Basics 2</Text>
          <Text variant="caption" tone="muted">Lesson 3 of 5 · 10 XP each</Text>
          <Progress value={60} size="md" accessibilityLabel="Lesson progress" />
          <View style={{ flex: 1 }} />
          <Row icon="target" title="Next: Food and drink" meta="5 new words · 4 min" />
          <Button size="sm" block>Continue</Button>
        </View>
      );
    case 'nightshift':
      return (
        <View style={pad}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="label">My issues</Text>
            <Badge size="sm">4</Badge>
          </View>
          {[
            ['ENG-142', 'Fix offline sync', 'In progress', 'accent'],
            ['ENG-139', 'Keyboard shortcuts', 'Todo', 'neutral'],
            ['ENG-131', 'Ship new onboarding', 'Done', 'success'],
            ['ENG-128', 'Audit colour tokens', 'Todo', 'neutral'],
          ].map(([id, title, status, tone]) => (
            <Row key={id} title={title} meta={id} trailing={<Badge size="sm" tone={tone as 'accent' | 'neutral' | 'success'}>{status}</Badge>} />
          ))}
        </View>
      );
    case 'paper':
      return (
        <View style={pad}>
          <Text variant="caption" tone="muted">Docs / Product</Text>
          <Text variant="title3">Launch plan</Text>
          <View style={{ gap: 6 }}>
            {[1, 0.86, 0.64].map((w) => <View key={w} style={{ height: 6, width: `${w * 100}%`, borderRadius: 3, backgroundColor: t.c.surfaceHover }} />)}
          </View>
          {[['Write the brief', true], ['Review with design', true], ['Share with the team', false]].map(([label, done]) => (
            <View key={label as string} style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
              <View style={{ width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: done ? t.c.accentSolid : t.c.borderStrong, backgroundColor: done ? t.c.accentSolid : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Icon name="check" size={16} color={t.c.onAccent} /> : null}
              </View>
              <Text variant="footnote" tone={done ? 'muted' : 'default'}>{label as string}</Text>
            </View>
          ))}
        </View>
      );
    case 'ride':
    default:
      return (
        <View style={pad}>
          <Text variant="headline">Where to?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2], height: 36, paddingHorizontal: t.space[3], borderRadius: t.component.inputRadius, backgroundColor: t.c.surfaceHover }}>
            <Icon name="search" size={16} color={t.c.textMuted} />
            <Text variant="footnote" tone="muted">Enter destination</Text>
          </View>
          <Row icon="clock" title="Home" meta="221 Baker Street" />
          <Row icon="map-pin" title="Office" meta="5 min · 2.1 km" />
          <View style={{ flex: 1 }} />
          <Button size="sm" block>Request ride</Button>
        </View>
      );
  }
}

/**
 * App vibes: one tap sets the style, brand colour, scheme and dials of a well-known app's feel.
 * Picking one clears the single dials so the whole vibe shows; changing a dial afterwards overrides it.
 */
export function VibePicker() {
  const t = useSlate();
  const s = useSettings();
  const { width: screenW } = useWindowDimensions();
  // About 1.7 cards across: one in full and most of the next, so the row reads as a carousel.
  const gap = t.space[3];
  const cardW = Math.round((screenW - t.space[4] * 2 - gap) / 1.7);
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
        decelerationRate="fast"
        snapToInterval={cardW + gap}
        snapToAlignment="start"
        style={{ marginHorizontal: -t.space[4] }}
        contentContainerStyle={{ paddingHorizontal: t.space[4], gap }}
      >
        {vibeNames.map((n) => (
          <VibeTile key={n} name={n} width={cardW} on={s.vibe === n} onPress={() => pick(n)} />
        ))}
      </ScrollView>
      {s.vibe && <Text variant="footnote" tone="muted">{tokens.vibes[s.vibe].tagline}</Text>}
    </View>
  );
}
