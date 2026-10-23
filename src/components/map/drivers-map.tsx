import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { LngLat, NearbyDriver } from '@/api/types';
import { CarMarker, PickupDot } from '@/components/map/car-marker';
import { StylisedMap } from '@/components/map/stylised-map';
import { useI18n } from '@/i18n';

/**
 * Google Maps on Android renders blank without a valid key: in Expo Go (SDK 57
 * ships an expired one — expo/expo#49323) and in any build made without
 * GOOGLE_MAPS_ANDROID_API_KEY (app.config.ts). Those get the drawn map; iOS
 * uses Apple Maps and needs no key.
 */
const GOOGLE_MAPS_UNAVAILABLE =
  Platform.OS === 'android' &&
  (Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    !Constants.expoConfig?.extra?.googleMapsAndroid);

export type DriversMapProps = {
  center: LngLat;
  drivers: NearbyDriver[];
  /** show the pickup dot at `center` */
  showPickup?: boolean;
};

/** Low-contrast map style so the green cars carry the screen (Google provider only). */
const QUIET_STYLE = [
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#E9EFE9' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#D7EADC' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7A847E' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F3F2EC' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE3EA' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const DELTA = 0.025; // ~2.5 km across — the nearby-driver search radius fits comfortably

/** Live map of available drivers around the pickup point. */
export function DriversMap(props: DriversMapProps) {
  if (GOOGLE_MAPS_UNAVAILABLE) return <StylisedMap {...props} />;
  return <NativeMap {...props} />;
}

function NativeMap({ center, drivers, showPickup = true }: DriversMapProps) {
  const { t } = useI18n();
  const ref = useRef<MapView>(null);

  useEffect(() => {
    ref.current?.animateToRegion(
      { latitude: center.lat, longitude: center.lng, latitudeDelta: DELTA, longitudeDelta: DELTA },
      400,
    );
  }, [center.lat, center.lng]);

  return (
    <MapView
      ref={ref}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={QUIET_STYLE}
      initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: DELTA, longitudeDelta: DELTA }}
      showsPointsOfInterests={false}
      showsCompass={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      accessibilityLabel={t('home.mapA11y', { count: drivers.length })}>
      {showPickup ? (
        <Marker coordinate={{ latitude: center.lat, longitude: center.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <PickupDot />
        </Marker>
      ) : null}
      {drivers.map((d, i) => (
        <Marker
          key={`${i}-${d.lat}-${d.lng}`}
          coordinate={{ latitude: d.lat, longitude: d.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          tracksViewChanges={false}>
          <CarMarker heading={d.heading} />
        </Marker>
      ))}
    </MapView>
  );
}
