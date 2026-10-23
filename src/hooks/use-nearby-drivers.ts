import { useEffect, useRef, useState } from 'react';

import { ApiError } from '@/api/client';
import { Drivers } from '@/api/endpoints';
import type { LngLat, NearbyDriver } from '@/api/types';

const REFRESH_MS = 10_000;

/**
 * Available drivers around `center`, refreshed every 10 s while mounted.
 * `supported` turns false when the backend doesn't have GET /drivers/nearby
 * yet, so the UI can simply show the map without cars.
 */
export function useNearbyDrivers(center: LngLat, enabled = true) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [supported, setSupported] = useState(true);
  const unsupported = useRef(false);
  const { lat, lng } = center;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      if (unsupported.current) return;
      try {
        const next = await Drivers.nearby({ lat, lng });
        if (!cancelled) setDrivers(next.filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng)));
      } catch (e) {
        if (e instanceof ApiError && e.missing) {
          unsupported.current = true;
          if (!cancelled) setSupported(false);
        }
      }
    };
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [lat, lng, enabled]);

  return { drivers, supported };
}
