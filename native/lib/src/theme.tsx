import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { brandFromHex, mix, parseHex } from './color';
import { haptic as playHaptic, type HapticKind } from './haptics';
import { PortalHost } from './primitives/Portal';
import * as tk from './tokens';

export type Scheme = 'light' | 'dark';
export type Brand = 'default' | tk.BrandName | (string & {});
export type Corners = 'soft' | tk.CornerName;
export type Density = 'compact' | 'default' | 'comfortable';

export type SlateSettings = {
  /** Follow the system (default) or force a scheme. */
  scheme?: 'system' | Scheme;
  /** 'default' (black, white in dark), a preset, or any hex colour, tuned for AA contrast in each scheme. */
  brand?: Brand;
  corners?: Corners;
  density?: Density;
  /** 'inter' expects the Inter_400Regular…Inter_700Bold faces to be loaded; 'system' uses SF Pro / Roboto. */
  font?: 'inter' | 'system';
  /** Turn every component's haptics off. */
  haptics?: boolean;
};

type Colors = { -readonly [K in tk.ColorToken]: string };
type TypeStyle = { fontSize: number; lineHeight: number; letterSpacing: number; fontWeight: '400' | '500' | '600' | '700'; fontFamily?: string };

export type Theme = {
  scheme: Scheme;
  settings: Required<SlateSettings>;
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
  /** Fonts for a weight; use this instead of fontWeight so Android picks the right Inter face. */
  font: (weight: '400' | '500' | '600' | '700') => { fontFamily?: string; fontWeight: '400' | '500' | '600' | '700' };
  mono: string;
  haptic: (kind?: HapticKind) => void;
};
type SpringPreset = { duration: number; dampingRatio: number };

const INTER = { '400': 'Inter_400Regular', '500': 'Inter_500Medium', '600': 'Inter_600SemiBold', '700': 'Inter_700Bold' } as const;

const defaults: Required<SlateSettings> = {
  scheme: 'system', brand: 'default', corners: 'soft', density: 'default', font: 'inter', haptics: true,
};

export function createTheme(scheme: Scheme, settings: Required<SlateSettings>, reducedMotion = false): Theme {
  const c = { ...tk.colors[scheme] } as Colors;
  const dark = scheme === 'dark';

  // Brand colour: a preset from themes.css or a custom hex tuned for contrast, applied like the web themes.
  let accent: string | undefined, onAccent: string | undefined;
  if (settings.brand !== 'default') {
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

  const corner = settings.corners === 'soft' ? {} : tk.corners[settings.corners];
  const radius = { ...tk.radius, ...corner, full: 9999 };
  // Mobile component radii follow the corner set: they reference lg / xl / 2xl.
  const component = { ...tk.component } as Theme['component'];
  component.buttonRadius = radius.lg; component.inputRadius = radius.lg;
  component.cardRadius = radius.xl; component.listRadius = radius.xl; component.menuRadius = radius.xl;
  component.sheetRadius = radius['2xl']; component.dialogRadius = radius['2xl'];

  const dens = settings.density === 'default' ? null : tk.density[settings.density];
  const control = dens ? { sm: dens.sm, md: dens.md, lg: dens.lg } : { ...tk.control };
  if (dens) component.rowHeight = dens.rowHeight;

  const inter = settings.font === 'inter';
  const font: Theme['font'] = (w) => (inter ? { fontFamily: INTER[w], fontWeight: w } : { fontWeight: w });
  const type = Object.fromEntries(
    Object.entries(tk.type).map(([k, v]) => [k, { ...v, ...font(v.fontWeight as TypeStyle['fontWeight']) }]),
  ) as Theme['type'];

  return {
    scheme, settings, c, radius, component, control, type, font, reducedMotion,
    space: tk.space, size: tk.size, motion: tk.motion, opacity: tk.opacity,
    mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
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
  const s = { ...defaults, ...Object.fromEntries(Object.entries(settings).filter(([, v]) => v !== undefined)) } as Required<SlateSettings>;
  const scheme: Scheme = s.scheme === 'system' ? (system === 'dark' ? 'dark' : 'light') : s.scheme;
  const theme = useMemo(
    () => createTheme(scheme, s, reducedMotion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scheme, s.scheme, s.brand, s.corners, s.density, s.font, s.haptics, reducedMotion],
  );
  return (
    <SlateContext.Provider value={theme}>
      <PortalHost>{children}</PortalHost>
    </SlateContext.Provider>
  );
}

const fallback = createTheme('light', defaults);

/** The current SlateOS theme. Works outside a provider too (light, defaults). */
export function useSlate(): Theme {
  return useContext(SlateContext) ?? fallback;
}
