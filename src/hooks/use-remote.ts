import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage } from '@/components/ui/form-error';

/**
 * Load a resource and keep it fresh. `reload` refetches without blanking the
 * current data, so live refreshes (socket hints, polling) never flash a spinner.
 */
export function useRemote<T>(load: (() => Promise<T>) | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(load));
  const loader = useRef(load);
  // declared before the load effect below, so it always sees the latest loader
  useEffect(() => {
    loader.current = load;
  });
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const fn = loader.current;
    if (!fn) return;
    const mine = ++seq.current;
    try {
      const next = await fn();
      if (mine !== seq.current) return;
      setData(next);
      setError(null);
    } catch (e) {
      if (mine === seq.current) setError(errorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(Boolean(loader.current));
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}
