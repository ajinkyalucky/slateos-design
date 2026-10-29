import { useState, type ReactNode } from 'react';
import { Platform, ScrollView, Settings, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Accordion, Icon, Sheet, SheetScrollView, SlateProvider, Text, Touchable, tokens, useSlate, type FontName, type IconName, type StyleName } from '@ajinkyabhagwat/slateos-native';
import { useSettings } from './settings';
import { VibePicker } from './VibePicker';

const brandSwatches = ['default', 'blue', 'violet', 'green', 'orange', 'rose'] as const;
const styleNames = Object.keys(tokens.styles) as StyleName[];
const SIZE = 48;
// Where the button rests, shared by every screen's copy so it stays put as you navigate.
const spot = { side: 1 as -1 | 1, y: 0.62 };

function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const t = useSlate();
  return (
    <View style={{ gap: t.space[2] }}>
      <Text variant="overline" tone="subtle">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', backgroundColor: t.c.surfaceHover, borderRadius: t.radius.lg, padding: 2 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Touchable
              key={o.value}
              onPress={() => onChange(o.value)}
              haptic="selection"
              pressScale={0.96}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
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
    </View>
  );
}

// What a style changes, in plain words, read from its tokens.
function traits(name: StyleName) {
  const st = tokens.styles[name];
  const r = st.radius.lg;
  const corners = r === 0 ? 'Square corners' : r <= 6 ? 'Crisp corners' : r <= 8 ? 'Soft corners' : 'Round corners';
  const size = st.density === 'compact' ? 'Compact' : st.density === 'comfortable' ? 'Roomy' : 'Regular spacing';
  const cards = st.card === 'elevated' ? 'Raised cards' : st.card === 'filled' ? 'Filled cards' : st.shadows === 'none' ? 'Flat cards' : 'Outlined cards';
  const f = tokens.fonts[st.font];
  const face = (n: string) => n.replace(/([a-z])([A-Z])/g, '$1 $2');
  const font = f.sans === f.display ? face(f.sans) : `${face(f.display)} headings`;
  return [font, corners, size, cards, ...(st.controls === 'pill' ? ['Pill buttons'] : [])];
}

const fontNames = Object.keys(tokens.fonts) as FontName[];
const brandNames: Record<(typeof brandSwatches)[number], string> = { default: 'Ink', blue: 'Blue', violet: 'Violet', green: 'Green', orange: 'Orange', rose: 'Rose' };
const pickOne = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** A friendly section: a colourful icon bubble, a title and one line on what to do. */
function Section({ icon, tint, title, hint, aside, children }: { icon: IconName; tint: string; title: string; hint: string; aside?: ReactNode; children: ReactNode }) {
  const t = useSlate();
  return (
    <View style={{ gap: t.space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <View style={{ width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: `${tint}26`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline" accessibilityRole="header">{title}</Text>
          <Text variant="footnote" tone="muted">{hint}</Text>
        </View>
        {aside}
      </View>
      {children}
    </View>
  );
}

/** A round "selected" mark that pops onto whatever is picked. */
function Picked({ color, on }: { color: string; on: string }) {
  return (
    <View style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={16} color={on} />
    </View>
  );
}

/** One style as a big tile, drawn in that style: its corners, surface, font and button shape are the real thing. */
function StyleCard({ name, on, onPress, width }: { name: StyleName; on: boolean; onPress: () => void; width: number }) {
  const t = useSlate();
  const s = useSettings();
  const st = tokens.styles[name];
  const list = traits(name);
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.95}
      accessibilityRole="radio"
      accessibilityLabel={`${st.label} style: ${list.join(', ')}`}
      accessibilityHint={st.tagline}
      accessibilityState={{ checked: on }}
      style={{ width, padding: 3, borderRadius: st.radius.xl + 3, borderWidth: 2, borderColor: on ? t.c.accentSolid : 'transparent' }}
    >
      <View pointerEvents="none">
        <SlateProvider style={name} scheme={t.scheme} brand={s.brand} haptics={false}>
          <StyleSample name={name} lines={list.slice(1, 3)} />
        </SlateProvider>
      </View>
      {on && <Picked color={t.c.accentSolid} on={t.c.onAccent} />}
    </Touchable>
  );
}

function StyleSample({ name, lines }: { name: StyleName; lines: string[] }) {
  const t = useSlate();
  const card = t.style.card;
  return (
    <View
      style={{
        height: 136, padding: t.space[3], gap: t.space[1], justifyContent: 'space-between',
        borderRadius: t.component.cardRadius, backgroundColor: card === 'filled' ? t.c.surfaceHover : t.c.surfaceRaised,
        borderWidth: card === 'filled' ? 0 : 1, borderColor: card === 'elevated' ? t.c.borderSubtle : t.c.border,
        boxShadow: card === 'elevated' ? t.c.shadowMd : undefined,
      }}
    >
      <View style={{ gap: 2 }}>
        <Text variant="title3">{tokens.styles[name].label}</Text>
        {lines.map((l) => <Text key={l} variant="caption" tone="muted">{l}</Text>)}
      </View>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: t.space[3], height: 28, justifyContent: 'center', borderRadius: Math.min(t.component.buttonRadius, 14), backgroundColor: t.c.accentSolid }}>
        <Text variant="caption" weight="600" style={{ color: t.c.onAccent }}>Button</Text>
      </View>
    </View>
  );
}

/** Day, night or follow the phone: little skies in the real light and dark colours. */
function SkyTile({ mode, on, onPress }: { mode: 'system' | 'light' | 'dark'; on: boolean; onPress: () => void }) {
  const t = useSlate();
  const L = tokens.colors.light, D = tokens.colors.dark;
  const label = mode === 'system' ? 'Auto' : mode === 'light' ? 'Day' : 'Night';
  const half = (c: { surfaceHover: string; text: string }, icon: IconName, bg: string) => (
    <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={20} color={c.text} />
    </View>
  );
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.94}
      accessibilityRole="radio"
      accessibilityLabel={mode === 'system' ? 'Follow the phone' : `${label} mode`}
      accessibilityState={{ checked: on }}
      style={{ flex: 1, gap: t.space['1_5'], alignItems: 'center' }}
    >
      <View style={{ alignSelf: 'stretch', height: 64, flexDirection: 'row', borderRadius: t.radius.xl, overflow: 'hidden', borderWidth: on ? 2 : 1, borderColor: on ? t.c.accentSolid : t.c.border }}>
        {mode !== 'dark' && half(L, 'sun', L.surfaceHover)}
        {mode !== 'light' && half(D, 'moon', D.bg)}
      </View>
      <Text variant="label" tone={on ? 'default' : 'muted'}>{label}</Text>
    </Touchable>
  );
}

/** A big "Aa" in one font, with its name. */
function FontTile({ name, on, onPress }: { name: FontName; on: boolean; onPress: () => void }) {
  const t = useSlate();
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.94}
      accessibilityRole="radio"
      accessibilityLabel={`${tokens.fonts[name].label} font`}
      accessibilityState={{ checked: on }}
      style={{ width: 92, height: 104, alignItems: 'center', justifyContent: 'center', gap: t.space[1], borderRadius: t.radius.xl, borderWidth: on ? 2 : 1, borderColor: on ? t.c.accentSolid : t.c.border, backgroundColor: t.c.surfaceRaised }}
    >
      <SlateProvider font={name} scheme={t.scheme} haptics={false}>
        <Text variant="title1">Aa</Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>{tokens.fonts[name].label}</Text>
      </SlateProvider>
    </Touchable>
  );
}

/** Every theme control as a playground: big things to tap, and the whole app changes as you play. */
function ThemePanel() {
  const t = useSlate();
  const s = useSettings();
  const { width: W } = useWindowDimensions();
  const tileW = (W - t.space[4] * 2 - t.space[3]) / 2;
  const tints = [t.c.chart1, t.c.chart2, t.c.chart3, t.c.chart4, t.c.chart5, t.c.chart6];
  const fontNow = s.font === undefined ? undefined : t.settings.font;

  const surprise = () => {
    s.set({
      vibe: undefined, corners: undefined, density: undefined,
      style: pickOne(styleNames), brand: pickOne(brandSwatches), font: pickOne(fontNames), scheme: pickOne(['light', 'dark'] as const),
    });
    t.haptic('success');
  };

  return (
    <View style={{ gap: t.space[8], paddingBottom: t.space[4] }}>
      <Touchable
        onPress={surprise}
        pressScale={0.96}
        accessibilityRole="button"
        accessibilityLabel="Surprise me"
        accessibilityHint="Picks a random style, colour, font and light or dark"
        style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3], padding: t.space[4], borderRadius: t.radius['2xl'], backgroundColor: t.c.accentSolid }}
      >
        <View style={{ width: 44, height: 44, borderRadius: t.radius.lg, backgroundColor: `${t.c.onAccent}26`, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={24} color={t.c.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ color: t.c.onAccent }}>Surprise me</Text>
          <Text variant="footnote" style={{ color: t.c.onAccent, opacity: 0.8 }}>Shuffle the style, colour and letters</Text>
        </View>
        <Icon name="refresh" size={20} color={t.c.onAccent} />
      </Touchable>

      <VibePicker
        renderHeader={(clear) => (
          <Section icon="zap" tint={tints[3]} title="Vibes" hint="Dress the app like an app you love" aside={clear}>
            {null}
          </Section>
        )}
      />

      <Section icon="palette" tint={tints[2]} title="Colour" hint="Your brand colour, and day or night">
        <View accessibilityRole="radiogroup" accessibilityLabel="Brand colour" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {brandSwatches.map((b) => {
            const pair = b === 'default' ? { accent: tokens.colors[t.scheme].accentSolid, onAccent: tokens.colors[t.scheme].onAccent } : tokens.brands[b][t.scheme];
            const on = s.brand === b;
            return (
              <Touchable
                key={b}
                onPress={() => s.set({ brand: b })}
                haptic="selection"
                pressScale={0.88}
                accessibilityRole="radio"
                accessibilityLabel={`${brandNames[b]} colour`}
                accessibilityState={{ checked: on }}
                style={{ alignItems: 'center', gap: t.space[1] }}
              >
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: pair.accent, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 3 : 0, borderColor: t.c.surfaceRaised, boxShadow: on ? `0 0 0 2px ${pair.accent}` : undefined }}>
                  {on && <Icon name="check" size={20} color={pair.onAccent} />}
                </View>
                <Text variant="caption" tone={on ? 'default' : 'muted'}>{brandNames[b]}</Text>
              </Touchable>
            );
          })}
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel="Light or dark" style={{ flexDirection: 'row', gap: t.space[3] }}>
          {(['system', 'light', 'dark'] as const).map((m) => <SkyTile key={m} mode={m} on={s.scheme === m} onPress={() => s.set({ scheme: m })} />)}
        </View>
      </Section>

      <Section icon="layers" tint={tints[1]} title="Shape" hint="How corners, cards and buttons look">
        <View accessibilityRole="radiogroup" accessibilityLabel="Style" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[3] }}>
          {styleNames.map((n) => (
            <StyleCard key={n} name={n} width={tileW} on={t.settings.style === n} onPress={() => s.set({ style: n, corners: undefined, density: undefined, font: undefined })} />
          ))}
        </View>
      </Section>

      <Section
        icon="type"
        tint={tints[4]}
        title="Letters"
        hint={s.font === undefined ? 'Each shape brings its own. Pick one to swap it.' : 'Your pick, over the shape’s own font'}
        aside={s.font !== undefined ? (
          <Touchable onPress={() => s.set({ font: undefined })} haptic="selection" pressScale={0.94} hitSlop={12} accessibilityRole="button" accessibilityLabel="Use the shape's font">
            <Text variant="label" tone="muted">Reset</Text>
          </Touchable>
        ) : undefined}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup" accessibilityLabel="Font" style={{ marginHorizontal: -t.space[4] }} contentContainerStyle={{ paddingHorizontal: t.space[4], gap: t.space[2] }}>
          {fontNames.map((n) => <FontTile key={n} name={n} on={(fontNow ?? t.settings.font) === n} onPress={() => s.set({ font: n })} />)}
        </ScrollView>
      </Section>

      <Section icon="sliders" tint={tints[5]} title="Tinker" hint="Each shape sets these. Change them if you like.">
        <Accordion>
          <Accordion.Item value="tinker" title="Corners and spacing">
            <View style={{ gap: t.space[4] }}>
              <Choice
                label="Corners"
                value={s.corners ?? 'style'}
                onChange={(v) => s.set({ corners: v === 'style' ? undefined : v })}
                options={[{ value: 'style', label: 'Shape' }, { value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]}
              />
              <Choice
                label="Spacing"
                value={s.density ?? 'style'}
                onChange={(v) => s.set({ density: v === 'style' ? undefined : v })}
                options={[{ value: 'style', label: 'Shape' }, { value: 'compact', label: 'Tight' }, { value: 'default', label: 'Normal' }, { value: 'comfortable', label: 'Roomy' }]}
              />
            </View>
          </Accordion.Item>
        </Accordion>
      </Section>
    </View>
  );
}

/**
 * The showcase's floating theme button. Tap to change style, appearance, corners, density and brand for
 * everything on screen; drag it up or down either edge to get it out of the way.
 */
export function ThemeWidget() {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  // Launching with `-slateosTheme 1` (simctl launch args) opens the sheet, for screenshots.
  const [open, setOpen] = useState(() => Platform.OS === 'ios' && String(Settings.get('slateosTheme')) === '1');
  // Docs screenshots (`-slateosShot <block>`) leave the button out of the picture.
  const hidden = Platform.OS === 'ios' && Settings.get('slateosShot') != null;

  const margin = t.space[3];
  const minY = insets.top + t.component.headerHeight;
  const maxY = H - insets.bottom - SIZE - t.space[6];
  const edgeX = (side: number) => (side < 0 ? margin : W - SIZE - margin);
  const x = useSharedValue(edgeX(spot.side));
  const y = useSharedValue(Math.min(maxY, Math.max(minY, H * spot.y)));
  const sx = useSharedValue(0), sy = useSharedValue(0), held = useSharedValue(0);
  const spring = t.spring.standard;
  const leftX = edgeX(-1), rightX = edgeX(1);

  const remember = (side: -1 | 1, atY: number) => { spot.side = side; spot.y = atY / H; };
  const pan = usePanGesture({
    minDistance: 6,
    onActivate: () => { sx.value = x.value; sy.value = y.value; held.value = withSpring(1, spring); },
    onUpdate: (e) => {
      x.value = sx.value + e.translationX;
      y.value = Math.min(maxY, Math.max(minY, sy.value + e.translationY));
    },
    onDeactivate: (e) => {
      const side = x.value + e.velocityX * 0.15 + SIZE / 2 < W / 2 ? -1 : 1;
      x.value = withSpring(side < 0 ? leftX : rightX, { ...spring, velocity: e.velocityX });
      held.value = withSpring(0, spring);
      scheduleOnRN(remember, side, y.value);
    },
  });
  const tap = useTapGesture({ onActivate: () => { scheduleOnRN(setOpen, true); } });
  const gesture = useCompetingGestures(pan, tap);

  const pos = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 + held.value * 0.08 }],
  }));

  if (hidden) return null;
  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Theme"
          accessibilityHint="Change style, appearance, corners, density and brand"
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={() => setOpen(true)}
          style={[
            {
              position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, borderRadius: t.radius.full,
              alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.surfaceRaised,
              borderWidth: 1, borderColor: t.c.border, boxShadow: t.c.shadowLg,
            },
            pos,
          ]}
        >
          <Icon name="palette" size={20} color={t.c.text} />
          <View style={{ position: 'absolute', right: 9, bottom: 9, width: 10, height: 10, borderRadius: t.radius.full, backgroundColor: t.c.accentSolid, borderWidth: 2, borderColor: t.c.surfaceRaised }} />
        </Animated.View>
      </GestureDetector>
      <Sheet open={open} onOpenChange={setOpen} detents={[0.62, 0.94]} padded={false} title="Playground" description="Tap anything. The whole app changes as you play.">
        {/* Padding lives inside the scroll view, so the vibe carousel can run to the sheet's edges. */}
        <SheetScrollView contentContainerStyle={{ paddingHorizontal: t.space[4] }}>
          <ThemePanel />
        </SheetScrollView>
      </Sheet>
    </>
  );
}
