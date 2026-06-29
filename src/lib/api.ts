// Cliente del backend (Fastify). Centraliza y tipa los fetch a /api/*.
// En dev, Vite proxya /api → http://localhost:5176. Sin VITE_API_URL usa rutas
// relativas (mismo origen / proxy). Cero datos inventados: si una ruta falla,
// el hook que la consume marca estado 'offline' y la UI muestra s/d.

import type {
  PulsoItem,
  HeatmapData,
  RiesgoSoberano,
  FxCommoditiesData,
  TasaRealRow,
  ComercioRow,
  ConflictoRanking,
  GeoEvento,
  CalendarEvent,
  Fuente,
  Country,
  LiveResolucion,
  SerieDetalle,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  paises: (signal?: AbortSignal) => get<Country[]>('/api/paises', signal),
  pulso: (signal?: AbortSignal) => get<PulsoItem[]>('/api/pulso', signal),
  heatmap: (signal?: AbortSignal) => get<HeatmapData>('/api/heatmap-macro', signal),
  riesgo: (signal?: AbortSignal) => get<RiesgoSoberano[]>('/api/riesgo-soberano', signal),
  fx: (signal?: AbortSignal) => get<FxCommoditiesData>('/api/fx-commodities', signal),
  tasasReales: (signal?: AbortSignal) => get<TasaRealRow[]>('/api/tasas-reales', signal),
  comercio: (signal?: AbortSignal) => get<ComercioRow[]>('/api/comercio', signal),
  conflictos: (signal?: AbortSignal) => get<ConflictoRanking[]>('/api/conflictos', signal),
  eventos: (signal?: AbortSignal) => get<GeoEvento[]>('/api/conflictos/eventos', signal),
  calendario: (signal?: AbortSignal) => get<CalendarEvent[]>('/api/calendario', signal),
  fuentes: (signal?: AbortSignal) => get<Fuente[]>('/api/fuentes', signal),
  // Muro de medios: el backend resuelve el live actual del canal.
  live: (channelId: string, signal?: AbortSignal) =>
    get<LiveResolucion>(`/api/media/live/${channelId}`, signal),
  // Series históricas para el modal de detalle.
  serieMercado: (symbol: string, signal?: AbortSignal) =>
    get<SerieDetalle>(`/api/serie/mercado/${encodeURIComponent(symbol)}`, signal),
  serieIndicador: (iso3: string, codigo: string, signal?: AbortSignal) =>
    get<SerieDetalle>(`/api/serie/indicador/${iso3}/${codigo}`, signal),
};
