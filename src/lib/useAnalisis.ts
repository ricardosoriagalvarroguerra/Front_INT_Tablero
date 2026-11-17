// El análisis lo consumen varias piezas a la vez (Resumen, encabezado, pestaña
// Análisis, nota ejecutiva): una sola petición compartida. Se renueva cada 5 min,
// al refrescar (R) y cada 45 s mientras el API no tenga el análisis completo
// (base recién aprovisionada o primera ingesta en curso → se ve el respaldo).

import { useEffect, useState } from 'react';
import { api, getOrigen } from './api';
import type { Analisis } from '../types-analisis';
import type { ViewEstado } from './useView';

let cache: { t: number; p: Promise<Analisis> } | null = null;
const subs = new Set<() => void>();
export function invalidarAnalisis() {
  cache = null;
  subs.forEach((f) => f());
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

// Un solo temporizador global de reintento mientras el análisis venga del respaldo.
let timer: ReturnType<typeof setInterval> | null = null;
function vigilar() {
  if (timer) return;
  timer = setInterval(() => {
    if (getOrigen().origen === 'respaldo') invalidarAnalisis();
    else if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 45_000);
}

export function useAnalisis(): { data: Analisis | null; estado: ViewEstado } {
  const [data, setData] = useState<Analisis | null>(null);
  const [estado, setEstado] = useState<ViewEstado>('loading');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const f = () => setTick((t) => t + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  useEffect(() => {
    let vivo = true;
    cargar()
      .then((d) => {
        if (!vivo) return;
        setData(d);
        setEstado('ok');
        if (getOrigen().origen === 'respaldo') vigilar();
      })
      .catch(() => vivo && setEstado('offline'));
    return () => {
      vivo = false;
    };
  }, [tick]);
  return { data, estado };
}
