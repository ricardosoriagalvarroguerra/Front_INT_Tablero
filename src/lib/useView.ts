// Hook genérico por panel: intenta el backend; ante fallo marca estado
// 'offline' (NO inventa datos). Cada panel decide cómo degradar visualmente
// (mostrar s/d, "fuente caída"), cumpliendo el guardrail de cero alucinación.

import { useEffect, useState, useCallback } from 'react';

export type ViewEstado = 'loading' | 'ok' | 'offline';

export interface ViewResult<T> {
  data: T | null;
  estado: ViewEstado;
  error: string | null;
  reload: () => void;
}

export function useView<T>(
  fetcher: (signal?: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): ViewResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [estado, setEstado] = useState<ViewEstado>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setEstado('loading');
    setError(null);
    (async () => {
      try {
        const d = await fetcher(ctrl.signal);
        setData(d);
        setEstado('ok');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message);
        setEstado('offline');
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, estado, error, reload };
}
