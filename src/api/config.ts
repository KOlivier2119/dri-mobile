import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the DRI API lives. Release builds must set `EXPO_PUBLIC_API_URL`
 * (see eas.json). In development we fall back to the machine running Metro on
 * port 3000, so a phone on the same Wi-Fi reaches the local backend without
 * any configuration.
 */
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (!__DEV__) {
    // a release build without a URL would quietly talk to nothing; make it obvious in logs
    console.error('EXPO_PUBLIC_API_URL is not set for this build — the app cannot reach the DRI API.');
  }

  if (Platform.OS === 'web') return 'http://localhost:3000';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3000`;
}

export const API_BASE_URL = resolveBaseUrl();
export const API_URL = `${API_BASE_URL}/api/v1`;
