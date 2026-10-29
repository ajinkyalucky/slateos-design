import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SlateSettings } from '@ajinkyabhagwat/slateos-native';

// corners and density are unset until picked, so the style's own values show.
type Settings = Required<Pick<SlateSettings, 'style' | 'scheme' | 'brand'>> & Pick<SlateSettings, 'corners' | 'density'>;
type Ctx = Settings & { set: (patch: Partial<Settings>) => void };

const SettingsContext = createContext<Ctx | null>(null);

/** The showcase's live theme controls; the app root passes these to SlateProvider. */
export function SettingsProvider({ children }: { children: (s: Settings) => ReactNode }) {
  const [s, setS] = useState<Settings>({ style: 'slate', scheme: 'system', brand: 'default' });
  return (
    <SettingsContext.Provider value={{ ...s, set: (patch) => setS((prev) => ({ ...prev, ...patch })) }}>
      {children(s)}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside SettingsProvider');
  return ctx;
}
