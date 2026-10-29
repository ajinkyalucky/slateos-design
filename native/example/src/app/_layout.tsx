import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SlateProvider, useSlate } from '@ajinkyabhagwat/slateos-native';
import { pageBySlug } from '../demos';
import { showcaseFonts } from '../showcase/fonts';
import { SettingsProvider } from '../showcase/settings';
import { ThemeWidget } from '../showcase/ThemeWidget';

// Set by expo-router on a route opened from a Link.AppleZoom source (iOS 18+).
const ZOOM_SOURCE = '__internal_expo_router_zoom_transition_source_id';
const zoomable = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 18;

export default function RootLayout() {
  const [loaded] = useFonts(showcaseFonts);
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          {(s) => (
            <SlateProvider {...s}>
              <Navigator />
            </SlateProvider>
          )}
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigator() {
  const t = useSlate();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(t.c.bg);
  }, [t.c.bg]);
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: t.c.text,
          headerTitleStyle: { color: t.c.text },
          headerLargeTitleStyle: { color: t.c.text },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: t.c.bg },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: t.c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'SlateOS', headerShown: false }} />
        {/* The title is known at push time, so it travels with the push; the large title folds into the bar on scroll. */}
        <Stack.Screen
          name="[slug]"
          options={({ route }) => ({
            title: pageBySlug[(route.params as { slug?: string } | undefined)?.slug ?? '']?.name ?? '',
            headerLargeTitleEnabled: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: { backgroundColor: t.c.bg },
          })}
        />
        {/* Opened from its home card, a block is presented full screen so iOS can zoom the card into the whole screen
            (and shrink it back into the card on a drag down). Opened any other way it is a sheet, which still swipes away. */}
        <Stack.Screen
          name="block/[name]"
          options={({ route }) => ({
            headerShown: false,
            presentation: zoomable && (route.params as Record<string, unknown> | undefined)?.[ZOOM_SOURCE] ? 'fullScreenModal' : 'modal',
          })}
        />
        <Stack.Screen name="shot/[name]" options={{ headerShown: false, animation: 'none' }} />
      </Stack>
      {/* Block screens are native modals above this, so they mount their own copy. */}
      <ThemeWidget />
    </>
  );
}
