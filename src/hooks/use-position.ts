import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import type { LngLat } from '@/api/types';

/** Central Kigali (Kigali Convention Centre), used until — or instead of — a GPS fix. */
export const KIGALI_CENTER: LngLat = { lat: -1.9545, lng: 30.0934 };

/**
 * The device's position, once. Falls back to central Kigali when permission
 * is refused or no fix arrives, so the map always has somewhere to look.
 */
export function usePosition() {
  const [position, setPosition] = useState<LngLat | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        setGranted(perm.granted);
        if (!perm.granted) return;
        const fix =
          (await Location.getLastKnownPositionAsync({ maxAge: 60_000 })) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!cancelled) setPosition({ lat: fix.coords.latitude, lng: fix.coords.longitude });
      } catch {
        if (!cancelled) setGranted(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { position, granted, center: position ?? KIGALI_CENTER };
}
