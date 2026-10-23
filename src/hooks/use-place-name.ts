import { useEffect, useState } from 'react';

import { Places } from '@/api/endpoints';
import type { LngLat } from '@/api/types';

/**
 * Street address for a GPS fix via GET /places/reverse. The label becomes the
 * booking's `pickupName`, which the driver reads, so on failure this returns
 * null rather than a placeholder and the rider picks the place by search.
 */
export function usePlaceName(position: LngLat | null) {
  const [name, setName] = useState<{ key: string; label: string | null } | null>(null);
  const key = position ? `${position.lat.toFixed(5)},${position.lng.toFixed(5)}` : null;

  useEffect(() => {
    if (!position || !key) return;
    let cancelled = false;
    Places.reverse(position)
      .then((p) => !cancelled && setName({ key, label: p.label?.trim() || null }))
      .catch(() => !cancelled && setName({ key, label: null }));
    return () => {
      cancelled = true;
    };
    // the key captures the position's identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const resolved = name && name.key === key ? name : null;
  return { label: resolved?.label ?? null, loading: Boolean(key) && !resolved, failed: resolved?.label === null };
}
