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
// Por ruta: una sección puede venir del respaldo (API caído, o API vivo pero sin
// datos todavía: base recién aprovisionada o primera ingesta en curso).
export type Origen = 'api' | 'respaldo' | 'desconocido';
interface SnapshotFile {
  generado: string;
  rutas: Record<string, unknown>;
}
let apiVivo = false;
const respaldoRutas = new Set<string>();
let snapshotMeta: { generado: string } | null = null;
interface EstadoOrigen {
  origen: Origen;
  snapshot: { generado: string } | null;
  rutasRespaldo: number;
}
let estadoOrigen: EstadoOrigen = { origen: 'desconocido', snapshot: null, rutasRespaldo: 0 };
const subs = new Set<() => void>();
function publicar() {
  const origen: Origen = respaldoRutas.size ? 'respaldo' : apiVivo ? 'api' : 'desconocido';
  if (origen !== estadoOrigen.origen || respaldoRutas.size !== estadoOrigen.rutasRespaldo || snapshotMeta !== estadoOrigen.snapshot) {
    estadoOrigen = { origen, snapshot: snapshotMeta, rutasRespaldo: respaldoRutas.size };
    subs.forEach((f) => f());
  }
}
export const getOrigen = () => estadoOrigen;
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

/** ¿La respuesta del API viene sin datos útiles? (entonces se prefiere el respaldo) */
function vacia(path: string, d: unknown): boolean {
  if (d == null) return true;
  if (Array.isArray(d)) {
    if (path === '/api/riesgo-soberano') return !d.some((r) => (r as { score: unknown }).score != null);
    return d.length === 0 && path !== '/api/alertas';
  }
  const o = d as Record<string, unknown>;
  if (path === '/api/analisis') return o.completo === false || !(o.ciclo as { agregados?: unknown[] })?.agregados?.length;
  if (path === '/api/heatmap-macro') return !(o.celdas as unknown[])?.length;
  if (path === '/api/fx-commodities') return !(o.series as unknown[])?.length;
  if (path.startsWith('/api/historico/')) return !(o.indicadores as unknown[])?.length;
  return false;
}

async function desdeRespaldo<T>(path: string): Promise<T | undefined> {
  const snap = await cargarSnapshot();
  const hit = snap?.rutas[path];
  if (hit === undefined) return undefined;
  respaldoRutas.add(path);
  publicar();
  return hit as T;
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  let json: T;
  try {
    const res = await fetch(`${BASE}${path}`, { signal });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    json = (await res.json()) as T;
    apiVivo = true;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    const r = await desdeRespaldo<T>(path);
    if (r !== undefined) return r;
    throw err;
  }
  if (vacia(path, json)) {
    const r = await desdeRespaldo<T>(path);
    if (r !== undefined) return r;
  }
  respaldoRutas.delete(path);
  publicar();
  return json;
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
