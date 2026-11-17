// El análisis lo consumen varias piezas a la vez (Resumen, encabezado, pestaña
// Análisis, nota ejecutiva): una sola petición compartida, renovada cada 5 min
// o al refrescar (R).

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Analisis } from '../types-analisis';
import type { ViewEstado } from './useView';

let cache: { t: number; p: Promise<Analisis> } | null = null;
export function invalidarAnalisis() {
  cache = null;
}
function cargar(): Promise<Analisis> {
  if (!cache || Date.now() - cache.t > 5 * 60_000) {
    const p = api.analisis();
    cache = { t: Date.now(), p };
    p.catch(() => {
      if (cache?.p === p) cache = null;
    });
  }
  return cache.p;
}

export function useAnalisis(): { data: Analisis | null; estado: ViewEstado } {
  const [data, setData] = useState<Analisis | null>(null);
  const [estado, setEstado] = useState<ViewEstado>('loading');
  useEffect(() => {
    let vivo = true;
    cargar()
      .then((d) => vivo && (setData(d), setEstado('ok')))
      .catch(() => vivo && setEstado('offline'));
    return () => {
      vivo = false;
    };
  }, []);
  return { data, estado };
}
