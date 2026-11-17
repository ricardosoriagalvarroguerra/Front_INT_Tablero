// Piezas de UI compartidas por la capa analítica.

import type { ReactNode } from 'react';
import type { Nivel, Severidad } from '../../types-analisis';

export const NIVEL_COLOR: Record<Nivel, string> = {
  verde: 'var(--pos)',
  ambar: 'var(--accent)',
  rojo: 'var(--neg)',
  sd: 'var(--fg-subtle)',
};
export const NIVEL_TXT: Record<Nivel, string> = { verde: 'Favorable', ambar: 'Atención', rojo: 'Riesgo', sd: 'Sin dato' };
export const SEV_COLOR: Record<Severidad, string> = { alta: 'var(--neg)', media: 'var(--accent)', info: 'var(--info)' };

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: color }} />;
}

/** Encabezado de sección de la capa analítica (formato oración, sin mayúsculas). */
export function Seccion({ titulo, sub, right, children, className = '' }: { titulo: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`surface rounded-[6px] overflow-hidden ${className}`}>
      <header className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 border-b border-token">
        <div>
          <h2 className="text-[13px] font-semibold leading-tight">{titulo}</h2>
          {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
        </div>
        {right && <div className="text-[11px] text-subtle shrink-0">{right}</div>}
      </header>
      {children}
    </section>
  );
}

/** Lecturas generadas por reglas (texto plano, una por línea). */
export function Lecturas({ items, className = '' }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={`flex flex-col gap-1.5 px-4 py-3 text-[12px] leading-relaxed ${className}`}>
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-subtle select-none">—</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Barra de percentil 0-100 (más alto = más estrés si altoEsEstres). */
export function PctlBar({ p, altoEsEstres = true }: { p: number | null; altoEsEstres?: boolean }) {
  if (p == null) return <span className="text-subtle text-[10px]">s/d</span>;
  const malo = altoEsEstres ? p : 100 - p;
  const color = malo >= 80 ? 'var(--neg)' : malo >= 60 ? 'var(--accent)' : 'var(--fg-muted)';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative w-16 h-1.5 rounded-full surface-sunk overflow-hidden border-0">
        <span className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${p}%`, background: color }} />
      </span>
      <span className="tabular-nums text-[10px] w-6 text-right" style={{ color }}>{p}</span>
    </span>
  );
}

export function Th({ children, left = false, title }: { children?: ReactNode; left?: boolean; title?: string }) {
  return (
    <th title={title} className={`${left ? 'text-left' : 'text-right'} px-2 h-7 font-normal text-[10px] text-subtle border-b border-token whitespace-nowrap`}>
      {children}
    </th>
  );
}

/** Celda numérica coloreada por signo (polaridad: +1 si positivo es bueno). */
export function Num({ v, d = 1, signo = 0, suf = '', bold = false }: { v: number | null | undefined; d?: number; signo?: 1 | -1 | 0; suf?: string; bold?: boolean }) {
  if (v == null || Number.isNaN(v)) return <span className="text-subtle">s/d</span>;
  const color = signo === 0 || v === 0 ? undefined : v * signo > 0 ? 'var(--pos)' : 'var(--neg)';
  const txt = `${signo !== 0 && v > 0 ? '+' : ''}${v.toLocaleString('es', { minimumFractionDigits: d, maximumFractionDigits: d })}${suf}`;
  return <span className={`tabular-nums ${bold ? 'font-medium' : ''}`} style={{ color }}>{txt}</span>;
}

export const fmtMes = (iso: string) => {
  const [y, m] = iso.split('-');
  const mes = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(m) - 1];
  return `${mes} ${y.slice(2)}`;
};
export const fmtFecha = (iso: string | null | undefined) => {
  if (!iso) return 's/d';
  const [y, m, d] = iso.split('-');
  return d ? `${Number(d)} ${fmtMes(`${y}-${m}`)}` : fmtMes(iso);
};
