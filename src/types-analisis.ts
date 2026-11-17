// Tipos de la capa analítica (GET /api/analisis) y del histórico por país.
// Espejo del payload de Back_INT_Tablero/src/analisis.ts y repo.historico().

export type Nivel = 'verde' | 'ambar' | 'rojo' | 'sd';
export type Severidad = 'alta' | 'media' | 'info';
export type TipoDato = 'obs' | 'est' | 'proy';

export interface Alerta {
  id: string;
  nivel: Severidad;
  categoria: string;
  titulo: string;
  detalle: string;
  tab: string;
}

export interface SemaforoItem {
  id: string;
  dimension: string;
  nivel: Nivel;
  valor: string;
  lectura: string;
  tab: string;
}

export interface Riesgo {
  id: string;
  titulo: string;
  sesgo: 'bajista' | 'alcista';
  evidencia: string;
}

export interface AggPunto {
  anio: number;
  tipo: TipoDato;
  crecimiento: number | null;
  inflacion: number | null;
  deuda: number | null;
}

export interface Ciclo {
  anioBase: number;
  agregados: { codigo: string; nombre: string; serie: AggPunto[] }[];
  mundo: { crecimiento: number | null; anterior: number | null; siguiente: number | null; promedio1519: number | null };
  enContraccion: { codigo: string; nombre: string; crecimiento: number | null; siguiente: number | null }[];
  lecturas: string[];
}

export interface Inflacion {
  anioBase: number;
  mundo: number | null;
  mundoAnterior: number | null;
  mediana: number | null;
  acelera: number;
  desacelera: number;
  sobre5: number;
  filas: { iso3: string; pais: string; inflacion: number | null; anterior: number | null; siguiente: number | null; cambio: number | null }[];
  lecturas: string[];
}

export interface BancoCentral {
  iso3: string;
  pais: string;
  tasa: number | null;
  fecha: string;
  desactualizada: boolean;
  var3m: number | null;
  var12m: number | null;
  ultimaDecision: { fecha: string; cambio: number } | null;
  inflacion: number | null;
  real: number | null;
  postura: 'restrictiva' | 'neutral' | 'expansiva' | 'sd';
  serie: { fecha: string; valor: number }[];
}

export interface Monetario {
  corte: string;
  bancos: number;
  recortaron12: number;
  subieron12: number;
  subas3: number;
  recortes3: number;
  fase: string;
  filas: BancoCentral[];
  difusion: { mes: string; subas: number; recortes: number; sinCambio: number; neto: number }[];
  lecturas: string[];
}

export interface IndicadorFin {
  id: string;
  nombre: string;
  unidad: string;
  valor: number | null;
  fecha: string | null;
  var1m: number | null;
  var1mTipo: 'abs' | 'pct';
  percentil: number | null;
  desde: string | null;
  altoEsEstres: boolean;
  spark: number[];
}

export interface Condiciones {
  indice: number | null;
  estado: string;
  indicadores: IndicadorFin[];
  curva: {
    y3m: number | null;
    y2: number | null;
    y10: number | null;
    pend10y2y: number | null;
    pend10y3m: number | null;
    real10: number | null;
    breakeven: number | null;
    pctl10: number | null;
    max10Desde: string | null;
    serie: { fecha: string; y10: number | null; y2: number | null; pend: number | null }[];
  };
  usd3m: number | null;
  lecturas: string[];
}

export interface DeudaFila {
  iso3: string;
  pais: string;
  deuda: number | null;
  deudaHorizonte: number | null;
  horizonte: number | null;
  cambio: number | null;
  balance: number | null;
  crecNominal: number | null;
  yield10: number | null;
  rg: number | null;
  balanceEstabilizador: number | null;
  brecha: number | null;
  trayectoria: 'creciente' | 'decreciente' | 'estable' | 'sd';
}

export interface ExternoFila {
  iso3: string;
  pais: string;
  region: string;
  fiscal: number | null;
  cuentaCorriente: number | null;
  cuadrante: 'deficits-gemelos' | 'superavits-gemelos' | 'deficit-externo' | 'deficit-fiscal';
  peso: number | null;
}

export interface FxFila {
  par: string;
  iso3: string;
  pais: string;
  valor: number | null;
  fecha: string | null;
  var1m: number | null;
  var3m: number | null;
  var1a: number | null;
  vol3m: number | null;
  carry: number | null;
  carryVol: number | null;
}

export interface CommodityFila {
  id: string;
  nombre: string;
  valor: number | null;
  fecha: string | null;
  var1m: number | null;
  var1a: number | null;
  percentil2a: number | null;
  max6m: number | null;
  max6mFecha: string | null;
  desdeMax: number | null;
  exportadores: string[];
  spark: number[];
}

export interface VulnFila {
  iso3: string;
  pais: string;
  region: string;
  score: number;
  componentes: Record<string, number | null>;
  cobertura: number;
  principales: string[];
  tasaReal: number | null;
}

export interface Analisis {
  generado: string;
  corte: { mercados: string | null; monetario: string; weo: string };
  tesis: { titular: string; focos: string; apoyos: string; puntos: string[] };
  semaforo: SemaforoItem[];
  alertas: Alerta[];
  riesgos: Riesgo[];
  ciclo: Ciclo;
  inflacion: Inflacion;
  monetario: Monetario;
  condiciones: Condiciones;
  deuda: { anioBase: number; filas: DeudaFila[]; preocupantes: string[]; lecturas: string[] };
  externo: { anioBase: number; filas: ExternoFila[]; lecturas: string[] };
  fx: { filas: FxFila[]; mediana3m: number | null; lecturas: string[] };
  commodities: { filas: CommodityFila[]; lecturas: string[] };
  geopolitica: { filas: { iso3: string; pais: string; fecha: string; intensidad: number; tono: number | null; cambio: number | null }[]; lecturas: string[]; disponible: boolean };
  vulnerabilidad: { pesos: { clave: string; nombre: string; peso: number }[]; filas: VulnFila[]; lecturas: string[] };
}

export interface HistoricoIndicador {
  codigo: string;
  nombre: string;
  unidad: string;
  polaridad: 'up' | 'down' | 'none';
  fuentes: string[];
  serie: { anio: number; valor: number; tipo: TipoDato }[];
}

export interface Historico {
  iso3: string;
  pais: string;
  region: string;
  anioBase: number;
  indicadores: HistoricoIndicador[];
  tasaPolitica: { fecha: string; valor: number }[];
  yield10: { fecha: string; valor: number }[];
}

export interface Agregado {
  codigo: string;
  nombre: string;
  indicadores: Record<string, { anio: number; valor: number }[]>;
}

export interface IngestaEstado {
  enCurso: boolean;
  jobs: { job: string; inicio: string; fin: string | null; filas: number; estado: string; error: string | null; disparador: string }[];
}
