// Lógica de color direccional de los indicadores.
//
// Cada indicador tiene una POLARIDAD (de dim_indicator): si lo "bueno" es que
// SUBA ('up'), que BAJE ('down'), o si es neutral ('none'). El color del delta
// y de la tendencia se calcula a partir de la polaridad + el signo del cambio:
//   inflación que baja   → verde   ·  inflación que sube → rojo
//   crecimiento que sube → verde   ·  spread que baja    → verde
//   desempleo que baja   → verde   ·  reservas que suben → verde
//
// Es conocimiento de dominio estable; vive en el cliente (presentación).

import type { Sentiment } from './types';

export type Polarity = 'up' | 'down' | 'none'; // 'up' = más alto es mejor

/** Color del delta puntual según hacia dónde se movió. */
export function deltaTone(polarity: Polarity, delta: number | null): Sentiment {
  if (polarity === 'none' || delta == null || delta === 0) return 'neutral';
  const favorable = polarity === 'up' ? delta > 0 : delta < 0;
  return favorable ? 'pos' : 'neg';
}

/** Color de la tendencia (serie completa: último vs primero). */
export function trendTone(polarity: Polarity, serie: number[] | undefined): Sentiment {
  if (polarity === 'none' || !serie || serie.length < 2) return 'neutral';
  const change = serie[serie.length - 1] - serie[0];
  if (change === 0) return 'neutral';
  const favorable = polarity === 'up' ? change > 0 : change < 0;
  return favorable ? 'pos' : 'neg';
}
