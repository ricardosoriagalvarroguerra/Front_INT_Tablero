// Contexto del modal de serie histórica. Cualquier panel llama abrir(spec) al
// clickear un valor; el SerieModal (montado en App) lo lee y muestra el gráfico.

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Sentiment, PulsoItem } from '../types';

export type SerieSpec =
  | { tipo: 'mercado'; symbol: string; titulo?: string; sentiment?: Sentiment }
  | { tipo: 'indicador'; iso3: string; codigo: string; titulo?: string; sentiment?: Sentiment };

/** El id del pulso codifica su origen: mkt_{symbol} · macro_{iso3}_{codigo} · geo_{iso3}. */
export function specDePulso(it: PulsoItem): SerieSpec | null {
  if (it.id.startsWith('mkt_')) return { tipo: 'mercado', symbol: it.id.slice(4), titulo: it.titulo, sentiment: it.sentiment };
  if (it.id.startsWith('macro_')) {
    const rest = it.id.slice(6);
    const i = rest.indexOf('_');
    if (i > 0) return { tipo: 'indicador', iso3: rest.slice(0, i), codigo: rest.slice(i + 1), titulo: it.titulo };
  }
  return null;
}

interface SerieCtx {
  spec: SerieSpec | null;
  abrir: (s: SerieSpec) => void;
  cerrar: () => void;
}

const Ctx = createContext<SerieCtx | null>(null);

export function SerieProvider({ children }: { children: ReactNode }) {
  const [spec, setSpec] = useState<SerieSpec | null>(null);
  return (
    <Ctx.Provider value={{ spec, abrir: setSpec, cerrar: () => setSpec(null) }}>{children}</Ctx.Provider>
  );
}

export function useSerie(): SerieCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSerie fuera de SerieProvider');
  return v;
}
