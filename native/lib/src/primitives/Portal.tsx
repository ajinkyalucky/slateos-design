import { createContext, useContext, useEffect, useId, useLayoutEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

// Overlays (sheets, dialogs, menus, toasts) render here, above the app, inside the same
// gesture and theme roots, so they need no Modal and animate like the rest of the UI.

type Entry = { key: string; node: ReactNode; order: number; modal: boolean };
type Store = { set: (key: string, node: ReactNode, modal: boolean) => void; remove: (key: string) => void };

const PortalContext = createContext<Store | null>(null);
let counter = 0;

export function PortalHost({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [store] = useState<Store>(() => ({
    set: (key, node, modal) =>
      setEntries((prev) => {
        const i = prev.findIndex((e) => e.key === key);
        if (i === -1) return [...prev, { key, node, modal, order: counter++ }];
        const next = prev.slice();
        next[i] = { ...prev[i], node, modal };
        return next;
      }),
    remove: (key) => setEntries((prev) => prev.filter((e) => e.key !== key)),
  }));
  // While a modal overlay is up, the app and any overlays beneath it are hidden from screen readers.
  const top = entries.reduce((m, e, i) => (e.modal ? i : m), -1);
  const hide = (hidden: boolean) =>
    hidden ? ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const) : {};
  return (
    <PortalContext.Provider value={store}>
      <View style={{ flex: 1 }} {...hide(top >= 0)}>
        {children}
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {entries.map((e, i) => (
          <View key={e.key} style={StyleSheet.absoluteFill} pointerEvents="box-none" {...hide(i < top)}>
            {e.node}
          </View>
        ))}
      </View>
    </PortalContext.Provider>
  );
}

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Render children above the whole app (inside SlateProvider). `modal` hides everything beneath from screen readers. */
export function Portal({ children, modal = false }: { children: ReactNode; modal?: boolean }) {
  const store = useContext(PortalContext);
  const key = useId();
  useIso(() => {
    store?.set(key, children, modal);
  });
  useEffect(() => () => store?.remove(key), [store, key]);
  if (!store) throw new Error('SlateOS: overlays need <SlateProvider> at the root of the app.');
  return null;
}
