// Formateadores de presentación. Bilingüe: se usa el locale es por defecto,
// con etiquetas técnicas (EN) aceptadas. Toda cifra faltante → "s/d".

export const SD = 's/d';

/** Número con N decimales (coma decimal) o "s/d" si falta. */
export function num(v: number | null | undefined, dec = 1): string {
  if (v == null || Number.isNaN(v)) return SD;
  return v.toLocaleString('es', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Porcentaje con signo opcional. */
export function pct(v: number | null | undefined, dec = 1, signed = false): string {
  if (v == null || Number.isNaN(v)) return SD;
  const s = signed && v > 0 ? '+' : '';
  return `${s}${num(v, dec)}%`;
}

/** Puntos básicos (spreads). */
export function bps(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return SD;
  const s = v > 0 ? '+' : '';
  return `${s}${Math.round(v)} pb`;
}

/** USD compacto (1.2 B, 880 M). */
export function usd(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return SD;
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${num(v / 1e12, 2)} B`; // billón (10^12)
  if (abs >= 1e9) return `$${num(v / 1e9, 1)} MM`; // mil millones
  if (abs >= 1e6) return `$${num(v / 1e6, 0)} M`;
  return `$${num(v, 0)}`;
}

/** Fecha corta es (DD MMM). */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return SD;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return SD;
  return d
    .toLocaleDateString('es', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .replace('.', '')
    .toUpperCase();
}

/** Antigüedad legible de una fecha de corte. */
export function antiguedad(iso: string | null | undefined, now: Date): string {
  if (!iso) return SD;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return SD;
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 31) return `hace ${days}d`;
  if (days < 365) return `hace ${Math.floor(days / 30)}m`;
  return `hace ${Math.floor(days / 365)}a`;
}
