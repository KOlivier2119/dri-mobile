import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** Top-down car used to mark an available driver; rotated to their heading. */
export function CarMarker({ heading, size = 30 }: { heading?: number | null; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: `${heading ?? 0}deg` }],
      }}>
      <Svg width={size * 0.62} height={size} viewBox="0 0 20 32">
        <Rect x={1} y={1} width={18} height={30} rx={6} fill={Colors.surface} stroke={Colors.text} strokeOpacity={0.15} />
        <Rect x={2.5} y={2.5} width={15} height={27} rx={5} fill={Colors.primary} />
        <Path d="M4.5 9.5 Q10 6.5 15.5 9.5 L14.5 13 H5.5 Z" fill={Colors.primaryTint} />
        <Path d="M5.5 23 H14.5 L15.5 26 Q10 28 4.5 26 Z" fill={Colors.primaryTint} opacity={0.85} />
      </Svg>
    </View>
  );
}

/** "You are here" dot for the pickup point. */
export function PickupDot() {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.text,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 3,
      }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.text }} />
    </View>
  );
}
