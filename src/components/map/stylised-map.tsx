import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { CarMarker, PickupDot } from '@/components/map/car-marker';
import { useI18n } from '@/i18n';
import type { DriversMapProps } from '@/components/map/drivers-map';

/**
 * A drawn street grid with driver positions projected around the pickup
 * point. Used where a real map can't render: on web (react-native-maps has no
 * web renderer) and in Expo Go on Android (its bundled Google Maps key is
 * expired in SDK 57 — expo/expo#49323).
 */
/** degrees shown across the frame — just over the 1.5 km nearby-driver radius each way */
const SPAN = 0.032;

export function StylisedMap({ center, drivers, showPickup = true }: DriversMapProps) {
  const { t } = useI18n();
  const toPct = (lat: number, lng: number) => ({
    left: `${50 + ((lng - center.lng) / SPAN) * 100}%` as const,
    top: `${50 - ((lat - center.lat) / SPAN) * 100}%` as const,
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.base]} accessibilityLabel={t('home.mapA11y', { count: drivers.length })}>
      <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        <Rect width={400} height={400} fill="#F3F2EC" />
        <Path d="M250 0 C300 80 330 120 400 140 V0 Z" fill="#D7EADC" />
        <Path d="M0 300 C60 280 90 320 120 400 H0 Z" fill="#D7EADC" />
        {[60, 150, 240, 330].map((y) => (
          <Rect key={`h${y}`} x={0} y={y} width={400} height={y === 150 ? 14 : 8} fill={Colors.surface} />
        ))}
        {[80, 190, 300].map((x) => (
          <Rect key={`v${x}`} x={x} y={0} width={x === 190 ? 14 : 8} height={400} fill={Colors.surface} />
        ))}
        <Path d="M0 210 C120 190 220 260 400 230" stroke={Colors.surface} strokeWidth={12} fill="none" />
        <Path d="M0 380 C100 360 160 390 260 330 S360 300 400 310" stroke="#CFE3EA" strokeWidth={18} fill="none" />
      </Svg>
      {drivers.map((d, i) => {
        const p = toPct(d.lat, d.lng);
        return (
          <View key={i} style={[styles.pin, { left: p.left, top: p.top }]}>
            <CarMarker heading={d.heading} />
          </View>
        );
      })}
      {showPickup ? (
        <View style={[styles.pin, styles.pickupPin, { left: '50%', top: '50%' }]}>
          <PickupDot />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden', backgroundColor: '#F3F2EC' },
  pin: { position: 'absolute', transform: [{ translateX: -15 }, { translateY: -15 }] },
  pickupPin: { transform: [{ translateX: -11 }, { translateY: -11 }] },
});
