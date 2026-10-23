import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { errorMessage } from '@/components/ui/form-error';
import { Drivers } from '@/api/endpoints';
import { tr } from '@/i18n';

const BEAT_MS = 15_000;

/**
 * Driver availability heartbeat (PATCH /drivers/location). Dispatch treats a
 * stale position as no position, so while `online` the current GPS fix is sent
 * every 15 s; going offline sends one final `available: false`.
 */
export function useHeartbeat(online: boolean) {
  const [error, setError] = useState<string | null>(null);
  const [lastBeat, setLastBeat] = useState<Date | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const beat = async (available: boolean) => {
      try {
        const pos =
          (await Location.getLastKnownPositionAsync({ maxAge: BEAT_MS })) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        await Drivers.heartbeat({ lng: pos.coords.longitude, lat: pos.coords.latitude }, available, pos.coords.heading);
        if (!stopped) {
          setError(null);
          setLastBeat(new Date());
        }
      } catch (e) {
        if (!stopped) setError(errorMessage(e));
      }
    };

    void (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        if (!stopped) setError(tr('hub.locationNeeded'));
        return;
      }
      if (stopped) return;
      await beat(online);
      if (online && !stopped) timer = setInterval(() => void beat(true), BEAT_MS);
    })();

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [online]);

  return { error, lastBeat };
}
