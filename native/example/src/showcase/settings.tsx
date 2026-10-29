import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SlateSettings } from '@ajinkyabhagwat/slateos-native';

type Settings = Required<Pick<SlateSettings, 'scheme' | 'brand' | 'corners' | 'density'>>;
type Ctx = Settings & { set: (patch: Partial<Settings>) => void };

const SettingsContext = createContext<Ctx | null>(null);

/** The showcase's live theme controls; the app root passes these to SlateProvider. */
export function SettingsProvider({ children }: { children: (s: Settings) => ReactNode }) {
  const [s, setS] = useState<Settings>({ scheme: 'system', brand: 'default', corners: 'soft', density: 'default' });
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
