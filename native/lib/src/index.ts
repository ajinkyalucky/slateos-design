// SlateOS Native: the SlateOS tokens and components for React Native and Expo.

export * from './theme';
export * from './color';
export { haptic, type HapticKind } from './haptics';
export * as tokens from './tokens';
export type { BrandName, ColorToken, CornerName, TypeVariant } from './tokens';

export * from './primitives/Text';
export * from './primitives/Icon';
export { iconShapes } from './icons';
export * from './primitives/Touchable';
export * from './primitives/Portal';
export * from './primitives/Crossfade';

export * from './components/general';
export * from './components/forms';
export * from './components/feedback';
export * from './components/navigation';
export * from './components/overlays';
export * from './components/data';

// Helpers the components share. Exported so that a component copied from the docs compiles against the package.
export * from './components/general/tone';
export * from './components/feedback/tone';
export * from './components/forms/shared';
export * from './components/overlays/shared';
export * from './components/data/chart';
export { space, motion } from './tokens';
