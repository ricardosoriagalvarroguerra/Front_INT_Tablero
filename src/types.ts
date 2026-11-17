// ─────────────────────────────────────────────────────────────────────
// Tipos de dominio · Tablero Inteligente INT (internacional).
// Mapean 1:1 al backend API (Fastify) y al esquema dimensional PostgreSQL
// (`internacional`): dim_country × dim_indicator × fact_timeseries / fact_market
// / fact_geo_events. Bilingüe ES/EN en etiquetas; cero datos inventados: todo
// valor lleva provenance (fuente + fecha de corte + estado de frescura).
// ─────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light';

export type Sentiment = 'pos' | 'neg' | 'neutral' | 'accent';
export type Tone = 'neutral' | 'accent' | 'pos' | 'neg' | 'info';

// ─── Catálogo geográfico (dim_country) ────────────────────────────────
export type Region =
  | 'LatAm'
  | 'Norteamérica'
  | 'Europa'
  | 'Asia'
  | 'África'
  | 'Oceanía'
  | 'Medio Oriente';

export type Grupo = 'G7' | 'G20' | 'EM' | 'avanzada' | 'LatAm';

export interface Country {
  iso3: string; // ISO-3166 alfa-3 (clave natural)
  iso2: string;
  m49: number; // código numérico UN (Comtrade)
  nombreEs: string;
  nombreEn: string;
  region: Region;
  grupos: Grupo[];
}

// ─── Provenance · obligatorio en toda cifra (guardrail §1/§8) ──────────
/** Estado de frescura/disponibilidad de un dato o fuente. */
export type Estado = 'ok' | 'lag' | 'live' | 'cold' | 'down';

export interface Provenance {
  fuente: string; // proveedor (World Bank, IMF, GDELT, …)
  asof: string | null; // fecha de corte del dato (ISO) · null = s/d
  estado: Estado;
  url?: string;
}

/** Valor numérico que puede faltar; null = "sin dato", se renderiza s/d. */
export type Maybe = number | null;

// ─── Catálogo de indicadores (dim_indicator) ──────────────────────────
export type Frecuencia = 'diaria' | 'mensual' | 'trimestral' | 'anual';

export interface Indicator {
  codigo: string; // clave interna (p.ej. 'gdp_growth', 'cpi_yoy', 'policy_rate')
  nombreEs: string;
  nombreEn: string;
  unidad: string;
  frecuencia: Frecuencia;
  fuente: string;
  /** 'up' = más alto es mejor; 'down' = más bajo es mejor; 'none' = neutral. */
  polaridad: 'up' | 'down' | 'none';
  descripcion: string;
}

export interface SeriePunto {
  fecha: string; // ISO
  valor: number;
}

/** Serie histórica para el modal de detalle (clic en un valor). */
export interface SerieDetalle {
  id: string;
  nombre: string;
  unidad: string;
  fuente: string;
  puntos: SeriePunto[];
  /** Proyecciones (FMI WEO) posteriores al año en curso, si las hay. */
  proyeccion?: SeriePunto[];
}

// ─── Vista 1 · Pulso global (qué cambió hoy) ──────────────────────────
export interface PulsoItem {
  id: string;
  titulo: string; // "Brasil · spread soberano +38 pb"
  detalle: string;
  iso3?: string;
  categoria: 'macro' | 'mercado' | 'spread' | 'fx' | 'commodity' | 'geopolitica';
  valor: Maybe;
  delta: Maybe;
  deltaLabel: string;
  sentiment: Sentiment;
  spark?: number[];
  prov: Provenance;
}

// ─── Vista 2 · Heatmap macro (países × indicadores) ───────────────────
export interface HeatCell {
  iso3: string;
  indicador: string; // codigo de dim_indicator
  valor: Maybe;
  /** z-score (o desviación vs objetivo) usado para el color; null = s/d. */
  z: Maybe;
  asof: string | null;
}

export interface HeatmapData {
  indicadores: Indicator[];
  paises: Country[];
  celdas: HeatCell[];
  prov: Provenance;
}

// ─── Vista 3 · Riesgo soberano ────────────────────────────────────────
export interface CurvaPunto {
  plazo: string; // '2A', '5A', '10A'
  yield: Maybe;
}

export interface RiesgoSoberano {
  iso3: string;
  pais: string;
  yield10y: Maybe;
  yield2y: Maybe;
  /** Pendiente 10A-2A en pb. */
  pendiente: Maybe;
  /** Spread soberano vs benchmark (pb). */
  spread: Maybe;
  spreadDelta: Maybe;
  curva: CurvaPunto[];
  /** Scorecard 0-100 combinando macro + spread + intensidad de conflicto. */
  score: Maybe;
  scoreComponentes?: { macro: Maybe; mercado: Maybe; conflicto: Maybe };
  rating?: string;
  prov: Provenance;
}

// ─── Vista 4 · FX & commodities ───────────────────────────────────────
export interface MercadoSerie {
  id: string; // 'WTI', 'BRENT', 'GOLD', 'COPPER', 'VIX', 'DXY', 'USDBRL', …
  nombre: string;
  clase: 'fx' | 'commodity' | 'indice' | 'volatilidad';
  valor: Maybe;
  varDiaria: Maybe; // %
  spark: number[];
  prov: Provenance;
}

export interface CorrelacionCelda {
  a: string;
  b: string;
  rho: Maybe; // -1..1
}

export interface FxCommoditiesData {
  series: MercadoSerie[];
  correlaciones: CorrelacionCelda[];
  /** Régimen risk-on / risk-off derivado de VIX/DXY. */
  regimen: 'risk-on' | 'risk-off' | 'neutral';
  prov: Provenance;
}

// ─── Vista 5 · Inflación y tasas reales ───────────────────────────────
export interface TasaRealRow {
  iso3: string;
  pais: string;
  inflacion: Maybe; // CPI i/a %
  tasaPolitica: Maybe; // %
  tasaReal: Maybe; // política - inflación (ex-post)
  prov: Provenance;
}

// ─── Vista 6 · Comercio y flujos ──────────────────────────────────────
export interface Socio {
  iso3: string | null;
  nombre: string;
  valor: number; // USD
  share: number; // % del total
  flujo: 'X' | 'M';
}

export interface ComercioRow {
  iso3: string;
  pais: string;
  exportTotal: Maybe;
  importTotal: Maybe;
  balanza: Maybe;
  cuentaCorriente: Maybe; // % PIB
  sociosTop: Socio[];
  periodo: string;
  prov: Provenance;
}

// ─── Vista 7 · Conflictos / geopolítica ───────────────────────────────
export interface GeoEvento {
  fecha: string;
  iso3: string;
  pais: string;
  tipo: string; // protesta, conflicto, crisis…
  /** Intensidad (volumen de cobertura GDELT o fatalities ACLED). */
  intensidad: Maybe;
  /** Tono medio (negativo = tensión). */
  tono: Maybe;
  fuente: string;
}

export interface ConflictoRanking {
  iso3: string;
  pais: string;
  intensidad: Maybe;
  tono: Maybe;
  tendencia: number[]; // serie reciente de intensidad
  prov: Provenance;
}

// ─── Vista 9 · Calendario ─────────────────────────────────────────────
export interface CalendarEvent {
  fecha: string;
  pais: string;
  iso3?: string;
  tipo: 'banco-central' | 'release' | 'deuda' | 'politico';
  titulo: string;
  tono: Tone;
}

// ─── Health-check (dim_source) ────────────────────────────────────────
export interface Fuente {
  id: string;
  nombre: string;
  url: string;
  estado: Estado;
  latenciaMs: Maybe;
  ultimaVerificacion: string | null;
  /** Fecha del dato más reciente que aportó la fuente. */
  ultimoDato?: string | null;
  periodicidad?: 'diaria' | 'semanal' | 'mensual' | 'anual' | null;
  licencia: string;
}

// ─── Muro de medios (§6) ──────────────────────────────────────────────
export interface MediaChannel {
  id: string;
  nombre: string;
  channelId: string; // YouTube channelId
  handle?: string;
  categoria: 'financiero' | 'politico';
  /** Si es el canal destacado (Bloomberg en vivo). */
  destacado?: boolean;
}

export interface LiveResolucion {
  channelId: string;
  videoId: string | null; // null → degradar a placeholder
  estado: 'live' | 'fallback' | 'offline';
  resueltoVia: 'page' | 'api' | 'embed-channel';
}

// ─── Origen de datos (frescura global) ────────────────────────────────
export type DataSource = 'api' | 'offline' | 'loading';
