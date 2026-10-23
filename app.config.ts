import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Set only when publishing an update for testers who open DRI in Expo Go
 * (no Apple developer account needed). Expo Go runs updates stamped with its
 * own runtime, `exposdk:<sdk>`; store/EAS builds are never affected.
 */
const forExpoGo = process.env.DRI_EXPO_GO_UPDATE === '1';

/**
 * Extends app.json with build-time secrets. Google Maps keys come from the
 * environment (EAS env vars or a local shell) so they are never committed.
 * Android needs one for the driver map; iOS uses Apple Maps unless a key is set.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  ...(forExpoGo
    ? {
        runtimeVersion: `exposdk:${config.sdkVersion ?? '57.0.0'}`,
        updates: { url: `https://u.expo.dev/${config.extra?.eas?.projectId}` },
      }
    : {}),
  extra: {
    ...config.extra,
    // read by the map: without a key, Google Maps on Android renders blank
    googleMapsAndroid: Boolean(process.env.GOOGLE_MAPS_ANDROID_API_KEY),
  },
  plugins: [
    ...(config.plugins ?? []).filter((p) => (Array.isArray(p) ? p[0] : p) !== 'react-native-maps'),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
      },
    ],
  ],
});
