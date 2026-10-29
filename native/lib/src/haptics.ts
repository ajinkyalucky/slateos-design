// Haptics through expo-haptics when it is installed; a silent no-op when it is not.

type Haptics = typeof import('expo-haptics');
let H: Haptics | null = null;
try {
  H = require('expo-haptics');
} catch {}

export type HapticKind = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function haptic(kind: HapticKind = 'selection') {
  if (!H) return;
  switch (kind) {
    case 'selection': return void H.selectionAsync().catch(() => {});
    case 'light': return void H.impactAsync(H.ImpactFeedbackStyle.Light).catch(() => {});
    case 'medium': return void H.impactAsync(H.ImpactFeedbackStyle.Medium).catch(() => {});
    case 'heavy': return void H.impactAsync(H.ImpactFeedbackStyle.Heavy).catch(() => {});
    case 'success': return void H.notificationAsync(H.NotificationFeedbackType.Success).catch(() => {});
    case 'warning': return void H.notificationAsync(H.NotificationFeedbackType.Warning).catch(() => {});
    case 'error': return void H.notificationAsync(H.NotificationFeedbackType.Error).catch(() => {});
  }
}
