// Cliente del backend (Fastify). Centraliza y tipa los fetch a /api/*.
// En dev, Vite proxya /api → http://localhost:5176. Sin VITE_API_URL usa rutas
// relativas (mismo origen / proxy).
//
// Respaldo embebido: si el API no responde, se usa la última foto real de la
// ingesta (src/data/snapshot.json, generada con `npm run snapshot` desde el API
// local). Se carga bajo demanda (chunk aparte) y la UI avisa en el encabezado
// que está en modo respaldo con su fecha de corte. Nunca se inventa: si una
// ruta no está en la foto, el panel queda en s/d.

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
import type { Analisis, Alerta, Historico, Agregado, IngestaEstado } from '../types-analisis';

// VITE_API_URL (build-time) manda. Si no se define: en producción se usa el
// backend de Railway como fallback; en dev queda '' para el proxy de Vite.
const BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? 'https://backinttablero-production.up.railway.app' : '');

// ── Origen de los datos (api en vivo / respaldo embebido) ─────────────────
export type Origen = 'api' | 'respaldo' | 'desconocido';
interface SnapshotFile {
  generado: string;
  rutas: Record<string, unknown>;
}
let origen: Origen = 'desconocido';
let snapshotMeta: { generado: string } | null = null;
const subs = new Set<() => void>();
function setOrigen(o: Origen) {
  if (o === origen) return;
  // 'api' gana: con que una ruta responda en vivo, el tablero está en línea.
  if (origen === 'api' && o === 'respaldo') return;
  origen = o;
  subs.forEach((f) => f());
}
export const getOrigen = () => ({ origen, snapshot: snapshotMeta });
export function subscribeOrigen(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

let snapshot: Promise<SnapshotFile | null> | null = null;
function cargarSnapshot(): Promise<SnapshotFile | null> {
  return (snapshot ??= import('../data/snapshot.json')
    .then((m) => (m.default ?? m) as unknown as SnapshotFile)
    .then((s) => {
      snapshotMeta = { generado: s.generado };
      return s;
    })
    .catch(() => null));
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    const json = (await res.json()) as T;
    setOrigen('api');
    return json;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    const snap = await cargarSnapshot();
    const hit = snap?.rutas[path];
    if (hit !== undefined) {
      setOrigen('respaldo');
      return hit as T;
    }
    throw err;
  }
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
  // Capa analítica
  analisis: (signal?: AbortSignal) => get<Analisis>('/api/analisis', signal),
  alertas: (signal?: AbortSignal) => get<Alerta[]>('/api/alertas', signal),
  agregados: (signal?: AbortSignal) => get<Agregado[]>('/api/agregados', signal),
  historico: (iso3: string, signal?: AbortSignal) => get<Historico>(`/api/historico/${iso3}`, signal),
  ingesta: (signal?: AbortSignal) => get<IngestaEstado>('/api/ingesta', signal),
  // Muro de medios: el backend resuelve el live actual del canal.
  live: (channelId: string, signal?: AbortSignal) =>
    get<LiveResolucion>(`/api/media/live/${channelId}`, signal),
  // Series históricas para el modal de detalle.
  serieMercado: (symbol: string, signal?: AbortSignal) =>
    get<SerieDetalle>(`/api/serie/mercado/${encodeURIComponent(symbol)}`, signal),
  serieIndicador: (iso3: string, codigo: string, signal?: AbortSignal) =>
    get<SerieDetalle>(`/api/serie/indicador/${iso3}/${codigo}`, signal),
};

/** Rutas que se congelan en el respaldo embebido (ver scripts/snapshot.mjs). */
export const RUTAS_SNAPSHOT = [
  '/api/paises', '/api/pulso', '/api/heatmap-macro', '/api/riesgo-soberano', '/api/fx-commodities',
  '/api/tasas-reales', '/api/comercio', '/api/conflictos', '/api/conflictos/eventos', '/api/calendario',
  '/api/fuentes', '/api/analisis', '/api/alertas', '/api/agregados',
];
