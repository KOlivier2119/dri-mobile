import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import '@/global.css';
import { ThemeProvider, DefaultTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SplashOverlay } from '@/components/brand/splash-overlay';
import { PageTitle } from '@/components/page-title';
import { Colors } from '@/constants/theme';
import { I18nProvider } from '@/i18n';
import { SessionProvider, useSession } from '@/store/session';

SplashScreen.setOptions({ fade: true, duration: 320 });
SplashScreen.preventAutoHideAsync();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.bg,
    card: Colors.bg,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <SessionProvider>
          <Shell />
        </SessionProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}

function Shell() {
  const { session } = useSession();
  const [fontsLoaded] = useFonts({
    Geist_400: Geist_400Regular,
    Geist_500: Geist_500Medium,
    Geist_600: Geist_600SemiBold,
    Geist_700: Geist_700Bold,
  });

  const ready = fontsLoaded && session.hydrated;

  return (
    <ThemeProvider value={theme}>
      <PageTitle title="DRI" />
      <StatusBar style="dark" />
      {/* screens guard on the session, so mounting them before it loads would redirect deep links away */}
      {session.hydrated ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'fade_from_bottom',
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="role/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/sign-in" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/register" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/verify" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/reset" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="customer/request" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="customer/booking" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="driver/apply/index" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="driver/fee" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="driver/status" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="driver/trip" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="customer/home" options={{ animation: 'fade' }} />
          <Stack.Screen name="driver/home" options={{ animation: 'fade' }} />
        </Stack>
      ) : null}
      <SplashOverlay ready={ready} />
    </ThemeProvider>
  );
}
