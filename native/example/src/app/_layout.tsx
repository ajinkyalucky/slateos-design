import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SlateProvider, useSlate } from '@ajinkyabhagwat/slateos-native';
import { SettingsProvider } from '../showcase/settings';
import { ThemeWidget } from '../showcase/ThemeWidget';

export default function RootLayout() {
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
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
        <Stack.Screen name="[slug]" options={{ title: '' }} />
        <Stack.Screen name="block/[name]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="shot/[name]" options={{ headerShown: false, animation: 'none' }} />
      </Stack>
      {/* Block screens are native modals above this, so they mount their own copy. */}
      <ThemeWidget />
    </>
  );
}
