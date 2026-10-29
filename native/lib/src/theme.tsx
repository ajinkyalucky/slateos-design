import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { brandFromHex, mix, parseHex } from './color';
import { haptic as playHaptic, type HapticKind } from './haptics';
import { PortalHost } from './primitives/Portal';
import * as tk from './tokens';

export type Scheme = 'light' | 'dark';
export type Brand = 'default' | tk.BrandName | (string & {});
export type Corners = tk.CornerName;
export type Density = 'compact' | 'default' | 'comfortable';
export type StyleName = tk.StyleName;
export type VibeName = tk.VibeName;
export type FontName = tk.FontName;

export type SlateSettings = {
  /**
   * An app vibe: one choice modelled on how a well-known app feels (Coral is Airbnb-like, Cinema Netflix-like…).
   * It sets the style, brand colour, scheme, corners and density; any of those set here still win.
   */
  vibe?: VibeName;
  /** A named look (corners, sizing, surfaces, shadows), shared with the web. Default 'slate'. */
  style?: StyleName;
  /** Follow the system (default) or force a scheme. */
  scheme?: 'system' | Scheme;
  /** 'default' (black, white in dark), a preset, or any hex colour, tuned for AA contrast in each scheme. */
  brand?: Brand;
  /** Overrides the style's corners. */
  corners?: Corners;
  /** Overrides the style's density. */
  density?: Density;
  /**
   * A font vibe, the same 15 as the web (neutral, crisp, modern, editorial, terminal…), or 'system' for SF Pro / Roboto.
   * Defaults to the vibe's or style's font. Load its faces from @expo-google-fonts (tokens.fonts[name].packages);
   * a face that isn't loaded falls back to Inter, then the system font. 'inter' is an alias of 'neutral'.
   */
  font?: FontName | 'inter' | 'system';
  /** Turn every component's haptics off. */
  haptics?: boolean;
};

type Colors = { -readonly [K in tk.ColorToken]: string };
type TypeStyle = { fontSize: number; lineHeight: number; letterSpacing: number; fontWeight: '400' | '500' | '600' | '700'; fontFamily?: string };

export type Theme = {
  scheme: Scheme;
  /** The settings in use, with corners and density resolved from the style when not set. */
  settings: Required<Omit<SlateSettings, 'vibe'>> & { vibe?: VibeName };
  /** The named style and the surface choices components read from it. */
  style: { name: StyleName; card: 'outline' | 'elevated' | 'filled'; controls: 'rounded' | 'pill' | 'square'; shadows: 'soft' | 'none' };
  /** Semantic colours for the current scheme, with the brand applied. */
  c: Colors;
  space: typeof tk.space;
  radius: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number; full: number };
  size: typeof tk.size;
  type: Record<tk.TypeVariant, TypeStyle>;
  /** Control heights for the current density: sm, md (44pt by default) and lg. */
  control: { sm: number; md: number; lg: number };
  component: { -readonly [K in keyof typeof tk.component]: number };
  motion: typeof tk.motion;
  /** Spring presets (Reanimated 4 duration + dampingRatio). */
  spring: { press: SpringPreset; standard: SpringPreset; gentle: SpringPreset; bouncy: SpringPreset };
  opacity: typeof tk.opacity;
  reducedMotion: boolean;
  /** The body face for a weight; use this instead of fontWeight so Android picks the right face. */
  font: (weight: '400' | '500' | '600' | '700') => { fontFamily?: string; fontWeight: '400' | '500' | '600' | '700' };
  mono: string;
  haptic: (kind?: HapticKind) => void;
};
type SpringPreset = { duration: number; dampingRatio: number };

const WEIGHT = { '400': '400Regular', '500': '500Medium', '600': '600SemiBold', '700': '700Bold' } as const;
type Weight = keyof typeof WEIGHT;

// expo-font tells us which faces the app has loaded, so an unloaded font vibe degrades instead of warning.
let isLoaded: ((name: string) => boolean) | null = null;
try {
  isLoaded = require('expo-font').isLoaded;
} catch {}
const has = (face: string) => (isLoaded ? isLoaded(face) : true);
/** The loaded face for a family prefix and weight: the family itself, else Inter, else none (system font). */
function face(prefix: string, w: Weight): string | undefined {
  for (const p of [prefix, 'Inter']) if (has(`${p}_${WEIGHT[w]}`)) return `${p}_${WEIGHT[w]}`;
  return undefined;
}

const defaults = { style: 'slate', scheme: 'system', brand: 'default', haptics: true } as const;
const NO_SHADOW = '0 0 0 0 transparent';

export function createTheme(scheme: Scheme, options: SlateSettings = {}, reducedMotion = false): Theme {
  const given = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined)) as SlateSettings;
  // A vibe fills in whatever the caller left unset; the style then fills in what the vibe leaves unset.
  const vibe = given.vibe ? tk.vibes[given.vibe] : undefined;
  const fromVibe: SlateSettings = vibe ? {
    style: vibe.style, scheme: vibe.scheme,
    ...('corners' in vibe && { corners: vibe.corners }), ...('density' in vibe && { density: vibe.density }),
    brand: vibe.brand === 'custom' ? `vibe:${given.vibe}` : vibe.brand,
  } : {};
  const picked = { ...fromVibe, ...given };
  const st = tk.styles[picked.style ?? defaults.style] ?? tk.styles.slate;
  // Font: given > vibe > style > neutral; 'inter' is the old name for neutral.
  const fontName = (picked.font === 'inter' ? 'neutral' : picked.font) ?? (vibe && 'font' in vibe ? vibe.font : undefined) ?? st.font ?? 'neutral';
  const settings = { ...defaults, corners: 'soft', density: st.density, ...picked, font: fontName } as Theme['settings'];
  const c = { ...tk.colors[scheme] } as Colors;
  const dark = scheme === 'dark';

  // Brand colour: a preset from themes.css or a custom hex tuned for contrast, applied like the web themes.
  let accent: string | undefined, onAccent: string | undefined;
  const vibeColors = vibe && settings.brand === `vibe:${given.vibe}` ? vibe[scheme] : null;
  if (vibeColors) {
    // The app's own colour on filled controls; a version tuned for 4.5:1 for text, links and focus.
    const { solid, onSolid, text } = vibeColors;
    Object.assign(c, {
      accent: text, accentHover: mix(text, dark ? '#ffffff' : '#000000', 0.15), focusRing: text,
      accentSolid: solid, accentSolidHover: mix(solid, dark ? '#ffffff' : '#000000', 0.12), onAccent: onSolid,
      accentSoft: mix(c.bg, solid, dark ? 0.18 : 0.1), accentSoftHover: mix(c.bg, solid, dark ? 0.26 : 0.16),
      accentBorder: mix(c.bg, solid, 0.45),
    });
  } else if (settings.brand !== 'default') {
    const preset = (tk.brands as Record<string, { light: { accent: string; onAccent: string }; dark: { accent: string; onAccent: string } }>)[settings.brand];
    if (preset) ({ accent, onAccent } = preset[scheme]);
    else {
      const hex = parseHex(settings.brand);
      if (hex) { accent = brandFromHex(hex)[scheme]; onAccent = dark ? '#0a0a0a' : '#ffffff'; }
    }
  }
  if (accent && onAccent) {
    Object.assign(c, {
      accent, accentSolid: accent, focusRing: accent, onAccent,
      accentHover: mix(accent, dark ? '#ffffff' : '#000000', 0.15),
      accentSolidHover: mix(accent, dark ? '#ffffff' : '#000000', 0.15),
      accentSoft: mix(c.bg, accent, dark ? 0.18 : 0.1),
      accentSoftHover: mix(c.bg, accent, dark ? 0.26 : 0.16),
      accentBorder: mix(c.bg, accent, 0.45),
    });
  }

  if (st.shadows === 'none') Object.assign(c, { shadowXs: NO_SHADOW, shadowSm: NO_SHADOW });

  // The style sets the radius scale; an explicit corners setting replaces it.
  const corner = picked.corners ? tk.corners[picked.corners] : {};
  const radius = { ...tk.radius, ...st.radius, ...corner, full: 9999 };
  // Mobile component radii follow the corner set: they reference lg / xl / 2xl.
  const component = { ...tk.component } as Theme['component'];
  component.buttonRadius = radius.lg; component.inputRadius = radius.lg;
  component.cardRadius = radius.xl; component.listRadius = radius.xl; component.menuRadius = radius.xl;
  component.sheetRadius = radius['2xl']; component.dialogRadius = radius['2xl'];
  if (st.controls === 'pill') component.buttonRadius = radius.full;
  if (st.controls === 'square') component.badgeRadius = radius.sm;

  const dens = settings.density === 'default' ? null : tk.density[settings.density];
  const control = dens ? { sm: dens.sm, md: dens.md, lg: dens.lg } : { ...tk.control };
  if (dens) component.rowHeight = dens.rowHeight;

  // The font vibe: body text in its sans face, display and title styles in its heading face and weight.
  const fv = settings.font === 'system' ? null : tk.fonts[settings.font as FontName] ?? tk.fonts.neutral;
  const font: Theme['font'] = (w) => ({ fontFamily: fv ? face(fv.sans, w) : undefined, fontWeight: w });
  const heading = (w: Weight) => ({ fontFamily: fv ? face(fv.display, w) : undefined, fontWeight: w });
  const HEADINGS = ['display', 'title1', 'title2', 'title3'];
  const type = Object.fromEntries(
    Object.entries(tk.type).map(([k, v]) => [k, {
      ...v, ...(HEADINGS.includes(k) ? heading((fv?.displayWeight ?? v.fontWeight) as Weight) : font(v.fontWeight as Weight)),
    }]),
  ) as Theme['type'];
  const monoFace = fv && has(`${fv.mono}_400Regular`) ? `${fv.mono}_400Regular` : undefined;

  return {
    scheme, settings, c, radius, component, control, type, font, reducedMotion,
    style: { name: settings.style, card: st.card, controls: st.controls, shadows: st.shadows },
    space: tk.space, size: tk.size, motion: tk.motion, opacity: tk.opacity,
    mono: monoFace ?? Platform.select({ ios: 'Menlo', default: 'monospace' }),
    spring: {
      press: { duration: 260, dampingRatio: 0.8 },
      standard: { duration: 420, dampingRatio: 0.9 },
      gentle: { duration: 600, dampingRatio: 1 },
      bouncy: { duration: 480, dampingRatio: 0.7 },
    },
    haptic: (kind) => { if (settings.haptics) playHaptic(kind); },
  };
}

const SlateContext = createContext<Theme | null>(null);

export function SlateProvider({ children, ...settings }: SlateSettings & { children: ReactNode }) {
  const system = useColorScheme();
  const reducedMotion = useReducedMotion();
  const s = settings;
  const want = s.scheme ?? (s.vibe ? tk.vibes[s.vibe].scheme : 'system');
  const scheme: Scheme = want === 'dark' || want === 'light' ? want : system === 'dark' ? 'dark' : 'light';
  const theme = useMemo(
    () => createTheme(scheme, s, reducedMotion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scheme, s.vibe, s.style, s.scheme, s.brand, s.corners, s.density, s.font, s.haptics, reducedMotion],
  );
  return (
    <SlateContext.Provider value={theme}>
      <PortalHost>{children}</PortalHost>
    </SlateContext.Provider>
  );
}

const fallback = createTheme('light');

/** The current SlateOS theme. Works outside a provider too (light, defaults). */
export function useSlate(): Theme {
  return useContext(SlateContext) ?? fallback;
}
