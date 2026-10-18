import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import '@/global.css';
import { ThemeProvider, DarkTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashOverlay } from '@/components/brand/splash-overlay';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/store/session';

SplashScreen.setOptions({ fade: true, duration: 320 });
SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.mint,
    background: Colors.ink,
    card: Colors.ink,
    text: Colors.warm,
    border: Colors.inkBorder,
    notification: Colors.mint,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <Shell />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

function Shell() {
  const { session, hydrate } = useSession();
  const [fontsLoaded] = useFonts({
    Geist_400: Geist_400Regular,
    Geist_500: Geist_500Medium,
    Geist_600: Geist_600SemiBold,
    Geist_700: Geist_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const ready = fontsLoaded && session.hydrated;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.ink },
          animation: 'fade_from_bottom',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="role/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/phone" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/otp" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="driver/apply/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="client/home" options={{ animation: 'fade' }} />
        <Stack.Screen name="driver/home" options={{ animation: 'fade' }} />
      </Stack>
      <SplashOverlay ready={ready} />
    </ThemeProvider>
  );
}
