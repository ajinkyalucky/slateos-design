# SlateOS Native

React Native / Expo version of SlateOS. npm workspaces: `lib/` is the published package
`@ajinkyabhagwat/slateos-native` (ships TypeScript source; no build step), `example/` is the Expo
showcase app (Expo Router, bundle `com.ajinkya.slateos`).

## Commands (run in `native/`)

- `npm run tokens`: regenerate `lib/src/tokens.ts` and `lib/src/icons.ts` from `../tokens/tokens.json`,
  `../tokens/mobile.json`, `../src/themes.css` and `../src/icons.json`. Never edit those two files by hand.
- `npm run typecheck`: tokens + `tsc` over the kit and the showcase.
- `npm run ios`: build and run the showcase in the simulator (`expo run:ios`). `example/ios` is generated; never edit it.

## Stack (check installed versions; APIs changed recently)

Expo SDK 58, React 19 (ref is a normal prop, no `forwardRef`), RN 0.88 (New Architecture: `boxShadow`
strings work), Reanimated 4 + react-native-worklets (`scheduleOnRN`, not `runOnJS`), Gesture Handler **3**
(hook API: `usePanGesture({...})`, `useTapGesture`, `useSimultaneousGestures`, then `<GestureDetector gesture={g}>`;
events are flat: `e.translationY`, `e.velocityY`), react-native-svg, expo-haptics (optional peer).

## Component rules

- Read `lib/src/components/general/Button.tsx` first; it is the reference for structure and naming.
- Every value comes from `useSlate()`: colours `t.c.*`, spacing `t.space[n]`, radii `t.radius.*` and
  `t.component.*Radius`, heights `t.control.sm|md|lg` (md = 44pt) and `t.component.rowHeight`, type via
  `<Text variant>` or `t.type.*`, springs `t.spring.press|standard|gentle|bouncy`. No raw hex, no magic sizes
  except hairlines (1) and icon sizes (16/20/24).
- Touch targets are at least 44pt (use `hitSlop` when the visual is smaller). Every interactive element
  has `accessibilityRole`, `accessibilityState` and a label where there is no visible text. Text uses
  `<Text>` (Dynamic Type capped at 2x).
- Press feedback goes through `<Touchable>` (spring scale + optional haptic). Haptics through `t.haptic(kind)`,
  which respects the provider's `haptics` setting: `selection` for picks and toggles, `light` for primary
  actions, `success|warning|error` for outcomes. Do not buzz on scroll or on every frame.
- Motion: Reanimated springs, transform and opacity only, 60fps on the UI thread. Never capture the theme
  object `t` inside a worklet (it holds functions); copy the numbers/colours you need into consts first.
  Restraint: motion explains state changes; no decorative loops, edge fades or gradients.
- Overlays render through `<Portal>` (hosted by `SlateProvider`), not `Modal`.
- Props: controlled `value` + `onValueChange` (or `onChange` for text), `disabled`, `style` last.
  Variants are string unions. Export the props type with the component.
- Each group has a barrel `lib/src/components/<group>/index.ts`; `lib/src/index.ts` re-exports the groups.

## Showcase

Each group has `example/src/demos/<group>.tsx` exporting `pages: DemoPage[]`; each demo has `render()`
and the `code` a reader would copy (keep it identical to what `render` shows, minus local state plumbing).
