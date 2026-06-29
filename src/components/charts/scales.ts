// Escalas de color tematizadas para los charts D3. La codificación es por
// FAVORABILIDAD (no por z crudo): un z alto en inflación es "malo" (rojo) y un z
// alto en crecimiento es "bueno" (verde), según la polaridad del indicador.

import { interpolateRdYlGn, scaleLinear } from 'd3';

export type Polaridad = 'up' | 'down' | 'none';

/** Signo de favorabilidad: +1 si más alto es mejor, -1 si peor, 0 neutral. */
export function signo(pol: Polaridad): number {
  return pol === 'up' ? 1 : pol === 'down' ? -1 : 0;
}

/**
 * Color de una celda de heatmap a partir de z-score + polaridad.
 * fav = z * signo(pol); fav>0 → verde (favorable), fav<0 → rojo (estrés).
 * z se recorta a [-2.5, 2.5]. Indicadores neutrales → gris suave.
 */
export function heatColor(z: number | null, pol: Polaridad): string {
  if (z == null || Number.isNaN(z)) return 'transparent';
  if (pol === 'none') return 'var(--bg-sunk)';
  const fav = Math.max(-2.5, Math.min(2.5, z * signo(pol)));
  // fav ∈ [-2.5,2.5] → t ∈ [0,1] → RdYlGn (0=rojo, 1=verde)
  const t = (fav + 2.5) / 5;
  return interpolateRdYlGn(t);
}

/** Escala lineal genérica [domainMin,max] → [0,1] (para barras/áreas). */
export function unit(min: number, max: number) {
  return scaleLinear().domain([min, max]).range([0, 1]).clamp(true);
}

/** Color divergente para correlaciones [-1,1] (rojo neg ↔ verde pos). */
export function corrColor(rho: number | null): string {
  if (rho == null || Number.isNaN(rho)) return 'transparent';
  return interpolateRdYlGn((rho + 1) / 2);
}

/** Texto legible (negro/blanco) sobre un fondo dado, por luminancia aprox. */
export function sobre(bg: string): string {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(bg);
  if (!m) return 'var(--fg)';
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0a0a0b' : '#fafafa';
}
