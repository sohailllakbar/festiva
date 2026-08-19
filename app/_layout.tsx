import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { FestivaProvider } from '../src/store/FestivaStore';
import { ThemeProvider, useTheme } from '../src/theme';

export default function RootLayout() {
  // Inter is the sole typeface, so hold the first paint until it's ready —
  // swapping mid-render would reflow every screen.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <FestivaProvider>
          <RootNavigator ready={fontsLoaded || !!fontError} />
        </FestivaProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * Split out so it sits *inside* ThemeProvider — the navigator needs the active
 * palette for its background and status-bar style, and a hook can't read a
 * context its own component provides.
 */
function RootNavigator({ ready }: { ready: boolean }) {
  const { colors, isDark } = useTheme();

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="festival/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="event/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="favorites" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="event/new" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
