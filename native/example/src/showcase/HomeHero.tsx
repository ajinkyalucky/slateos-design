import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_700Bold_Italic, PlayfairDisplay_900Black_Italic } from '@expo-google-fonts/playfair-display';
import { Icon, SlateProvider, Text, mix, tokens, useSlate } from '@ajinkyabhagwat/slateos-native';
import { blocks } from '../blocks';
import { allPages } from '../demos';
import { useSettings } from './settings';

const PETALS = 9;
const HEIGHT = 440;

/**
 * The home screen's opening card: an abstract bloom on a dark stage, drawn from the current theme. Petals take the
 * brand colour and the style's corners (round for Pebble, shards for Flint), the vibe or style name is scattered
 * around it, and it re-blooms whenever the theme changes. Still under Reduce Motion.
 */
export function HomeHero() {
  const { set: _set, ...settings } = useSettings();
  const t = useSlate();
  const name = t.settings.vibe ? tokens.vibes[t.settings.vibe].label : tokens.styles[t.settings.style].label;
  // Keyed by the look, so a new pick plays the bloom again from closed.
  const key = [t.settings.vibe, t.settings.style, t.settings.brand, t.settings.font].join('|');
  return (
    <SlateProvider {...settings} scheme="dark" haptics={false}>
      <Stage key={key} name={name} />
    </SlateProvider>
  );
}

function Stage({ name }: { name: string }) {
  const t = useSlate();
  const { width: screenW } = useWindowDimensions();
  const [fontsReady] = useFonts({ PlayfairDisplay_900Black_Italic, PlayfairDisplay_700Bold_Italic });
  const W = screenW - t.space[4] * 2;
  const cx = W * 0.62, baseY = HEIGHT * 0.56;

  const p = useSharedValue(t.reducedMotion ? 0.85 : 0);
  useEffect(() => {
    if (t.reducedMotion) return;
    const ease = Easing.inOut(Easing.cubic);
    p.value = withRepeat(
      withSequence(withTiming(1, { duration: 4800, easing: ease }), withDelay(1600, withTiming(0.2, { duration: 4200, easing: ease })), withDelay(600, withTiming(0.2, { duration: 0 }))),
      -1,
    );
  }, [p, t.reducedMotion]);

  const accent = t.c.accentSolid, bg = t.c.bg;
  const sway = useAnimatedStyle(() => ({ transform: [{ rotate: `${interpolate(p.value, [0, 1], [-4, 3])}deg` }] }));
  const vibe = t.settings.vibe ? tokens.vibes[t.settings.vibe] : null;
  const face = (n: string) => n.replace(/([a-z])([A-Z])/g, '$1 $2');
  const credits: [string, string][] = [
    ['Shape', tokens.styles[t.settings.style].label],
    ['Letters', face(tokens.fonts[t.settings.font as keyof typeof tokens.fonts]?.display ?? 'Inter')],
    ['Feel', vibe ? `${vibe.like}-style` : tokens.styles[t.settings.style].tagline.split(/[.,]/)[0]],
  ];
  const logo = (size: number, weight: '900' | '700') =>
    fontsReady ? { fontFamily: weight === '900' ? 'PlayfairDisplay_900Black_Italic' : 'PlayfairDisplay_700Bold_Italic', fontSize: size } : { fontSize: size, fontStyle: 'italic' as const, fontWeight: weight };

  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`SlateOS. Now showing ${name}.`}
      style={{ height: HEIGHT, borderRadius: t.radius['2xl'], backgroundColor: bg, overflow: 'hidden' }}
    >
      {/* Stem, then the bloom swaying gently about its base. */}
      <View style={{ position: 'absolute', left: cx - 0.5, top: baseY, width: 1, height: HEIGHT * 0.2, backgroundColor: mix(bg, accent, 0.5) }} />
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: W, height: HEIGHT, transformOrigin: `${cx}px ${baseY}px` }, sway]}>
        {Array.from({ length: PETALS }, (_, i) => i)
          // Back petals first: odd ones sit behind and are darker.
          .sort((a, b) => (b % 2) - (a % 2))
          .map((i) => <Petal key={i} i={i} p={p} cx={cx} baseY={baseY} color={accent} fill={i % 2 ? 0.1 : 0.22} />)}
        <Core p={p} cx={cx} baseY={baseY} color={mix(accent, '#ffffff', 0.25)} />
      </Animated.View>

      <Letters word={name} cx={cx} />

      <View style={{ position: 'absolute', top: t.space[5], left: t.space[5], right: t.space[5], flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" weight="600" style={{ color: accent }} tabular>{`No. ${String(allPages.length).padStart(2, '0')}`}</Text>
        <Text variant="caption" weight="600" style={{ color: accent, letterSpacing: 2 }}>{vibe ? vibe.like.toUpperCase() : 'NATIVE'}</Text>
      </View>

      <View style={{ position: 'absolute', left: t.space[5], bottom: t.space[5], gap: t.space[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={[{ color: accent, letterSpacing: -1, lineHeight: 52 }, logo(48, '900')]}>Slate</Text>
          <View style={{ marginTop: 8, marginLeft: 4, gap: 2 }}>
            <Icon name="sparkles" size={16} color={accent} />
            <Text variant="caption" weight="700" style={{ color: accent, fontSize: 11, letterSpacing: 3 }}>OS</Text>
          </View>
        </View>
        <View style={{ gap: 2 }}>
          {credits.map(([k, v]) => (
            <Text key={k} variant="caption" style={{ color: mix(bg, accent, 0.75), fontSize: 11 }} numberOfLines={1}>
              {k} <Text variant="caption" weight="600" style={{ color: accent, fontSize: 11 }}>{v}</Text>
            </Text>
          ))}
        </View>
      </View>

      <View style={{ position: 'absolute', right: t.space[5], bottom: t.space[5], alignItems: 'flex-end', gap: 2 }}>
        <Text variant="caption" style={{ color: mix(bg, accent, 0.75), fontSize: 11 }}>{`${allPages.length} components · ${blocks.length} screens`}</Text>
        <Text variant="caption" weight="600" style={{ color: accent, fontSize: 11, letterSpacing: 6 }}>B L O O M</Text>
      </View>
    </View>
  );
}

/** One petal, pivoting on its base: closed it stands nearly upright, open it fans out to its own angle. */
function Petal({ i, p, cx, baseY, color, fill }: { i: number; p: SharedValue<number>; cx: number; baseY: number; color: string; fill: number }) {
  const t = useSlate();
  const w = 60, h = 184;
  // The style shapes the petal: round styles grow teardrops, crisp ones kites, Flint hard shards.
  const r = t.radius.lg;
  const d = r === 0
    ? `M${w / 2} ${h} L${w} ${h * 0.42} L${w * 0.62} 0 L0 ${h * 0.3} Z`
    : r <= 6
      ? `M${w / 2} ${h} L${w} ${h * 0.38} L${w / 2} 0 L0 ${h * 0.38} Z`
      : `M${w / 2} ${h} C${w * 1.15} ${h * 0.62} ${w} ${h * 0.12} ${w / 2} 0 C0 ${h * 0.12} ${-w * 0.15} ${h * 0.62} ${w / 2} ${h} Z`;
  const open = -82 + (i * 164) / (PETALS - 1);
  const closed = (i - (PETALS - 1) / 2) * 3;
  const lag = Math.abs(i - (PETALS - 1) / 2) * 0.04;
  const style = useAnimatedStyle(() => {
    const q = Math.min(1, Math.max(0, (p.value - lag) / (1 - lag)));
    return { transform: [{ rotate: `${closed + (open - closed) * q}deg` }, { scaleY: 0.82 + 0.2 * q }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - w / 2, top: baseY - h, width: w, height: h, transformOrigin: 'bottom center' }, style]}>
      <Svg width={w} height={h} viewBox={`-6 -2 ${w + 12} ${h + 4}`}>
        <Path d={d} fill={color} fillOpacity={fill} stroke={color} strokeOpacity={0.85} strokeWidth={1} />
      </Svg>
    </Animated.View>
  );
}

/** A small fan of seeds that appears once the bloom is mostly open. */
function Core({ p, cx, baseY, color }: { p: SharedValue<number>; cx: number; baseY: number; color: string }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.5, 0.9], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.5, 1], [0.6, 1], 'clamp') }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - 40, top: baseY - 70, width: 80, height: 70, transformOrigin: 'bottom center' }, style]}>
      {Array.from({ length: 9 }, (_, k) => {
        const a = ((k - 4) * 16 * Math.PI) / 180, r = 34 + (k % 2) * 12;
        return <View key={k} style={{ position: 'absolute', left: 40 + Math.sin(a) * r - 4, top: 70 - Math.cos(a) * r - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
      })}
    </Animated.View>
  );
}

/** The name, one letter at a time, zigzagging down beside the bloom like a credit sequence. */
function Letters({ word, cx }: { word: string; cx: number }) {
  const letters = word.toUpperCase().replace(/\s+/g, '').split('');
  const top = HEIGHT * 0.1, step = Math.min(36, (HEIGHT * 0.5) / Math.max(1, letters.length - 1));
  return (
    <>
      {letters.map((ch, i) => (
        <Letter key={`${ch}${i}`} ch={ch} i={i} x={cx + (i % 2 ? 1 : -1) * (46 + (i % 3) * 16)} y={top + i * step} />
      ))}
    </>
  );
}

function Letter({ ch, i, x, y }: { ch: string; i: number; x: number; y: number }) {
  const t = useSlate();
  const o = useSharedValue(t.reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!t.reducedMotion) o.value = withDelay(500 + i * 90, withTiming(1, { duration: 500 }));
  }, [i, o, t.reducedMotion]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: (1 - o.value) * 6 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - 8, top: y, width: 16, alignItems: 'center' }, style]}>
      <Text variant="label" style={{ color: t.c.text }}>{ch}</Text>
    </Animated.View>
  );
}
