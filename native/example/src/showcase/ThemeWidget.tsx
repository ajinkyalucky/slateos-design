import { useState } from 'react';
import { Platform, Settings, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Accordion, Icon, Sheet, SheetScrollView, Text, Touchable, tokens, useSlate, type StyleName } from '@ajinkyabhagwat/slateos-native';
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
  return [corners, size, cards, ...(st.controls === 'pill' ? ['Pill buttons'] : [])];
}

/** One style as a row: its name and what it changes. */
function StyleRow({ name, on, onPress }: { name: StyleName; on: boolean; onPress: () => void }) {
  const t = useSlate();
  const st = tokens.styles[name];
  const list = traits(name);
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      pressScale={0.98}
      accessibilityRole="radio"
      accessibilityLabel={`${st.label} style: ${list.join(', ')}`}
      accessibilityHint={st.tagline}
      accessibilityState={{ checked: on }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: t.space[3], minHeight: t.control.lg, paddingVertical: t.space[2], paddingHorizontal: t.space[3],
        borderRadius: t.radius.lg, borderWidth: 1.5, borderColor: on ? t.c.accentSolid : 'transparent', backgroundColor: on ? t.c.surfaceHover : 'transparent',
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label">{st.label}</Text>
        <Text variant="footnote" tone="muted">{list.join(' · ')}</Text>
      </View>
      {on && <Icon name="check" size={20} color={t.c.accent} />}
    </Touchable>
  );
}

/** Every theme control in one sheet. Changes apply to the whole showcase at once. */
function ThemePanel() {
  const t = useSlate();
  const s = useSettings();
  return (
    <View style={{ gap: t.space[5], paddingBottom: t.space[2] }}>
      <VibePicker />
      <View style={{ gap: t.space[1] }}>
        <Text variant="overline" tone="subtle" style={{ marginBottom: t.space[1] }}>Style</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Style" style={{ marginHorizontal: -t.space[2] }}>
          {styleNames.map((n) => (
            <StyleRow key={n} name={n} on={t.settings.style === n} onPress={() => s.set({ style: n, corners: undefined, density: undefined })} />
          ))}
        </View>
      </View>
      <Choice label="Appearance" value={s.scheme} onChange={(scheme) => s.set({ scheme })} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      <View style={{ gap: t.space[2] }}>
        <Text variant="overline" tone="subtle">Brand</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Brand colour" style={{ flexDirection: 'row', gap: t.space[3] }}>
          {brandSwatches.map((b) => {
            const color = b === 'default' ? tokens.colors[t.scheme].accentSolid : tokens.brands[b][t.scheme].accent;
            const on = s.brand === b;
            return (
              <Touchable
                key={b}
                onPress={() => s.set({ brand: b })}
                haptic="selection"
                pressScale={0.9}
                accessibilityRole="radio"
                accessibilityLabel={`${b} brand`}
                accessibilityState={{ checked: on }}
                style={{ width: 44, height: 44, borderRadius: t.radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? color : 'transparent' }}
              >
                <View style={{ width: 32, height: 32, borderRadius: t.radius.full, backgroundColor: color }} />
              </Touchable>
            );
          })}
        </View>
      </View>
      <Accordion>
        <Accordion.Item value="fine-tune" title="Fine-tune corners and density">
          <View style={{ gap: t.space[4] }}>
            <Text variant="footnote" tone="muted">Each style sets these for you. Change them here to override it.</Text>
            <Choice
              label="Corners"
              value={s.corners ?? 'style'}
              onChange={(v) => s.set({ corners: v === 'style' ? undefined : v })}
              options={[{ value: 'style', label: 'Style' }, { value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]}
            />
            <Choice
              label="Density"
              value={s.density ?? 'style'}
              onChange={(v) => s.set({ density: v === 'style' ? undefined : v })}
              options={[{ value: 'style', label: 'Style' }, { value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'comfortable', label: 'Roomy' }]}
            />
          </View>
        </Accordion.Item>
      </Accordion>
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
      <Sheet open={open} onOpenChange={setOpen} detents={[0.62, 0.94]} padded={false} title="Theme" description="Applies to every screen and block.">
        {/* Padding lives inside the scroll view, so the vibe carousel can run to the sheet's edges. */}
        <SheetScrollView contentContainerStyle={{ paddingHorizontal: t.space[4] }}>
          <ThemePanel />
        </SheetScrollView>
      </Sheet>
    </>
  );
}
