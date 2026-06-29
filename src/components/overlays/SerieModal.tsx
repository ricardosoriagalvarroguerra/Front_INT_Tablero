// Modal de serie histórica. Se abre al clickear cualquier valor (vía useSerie).
// Muestra el gráfico de línea + selector de rango + último valor, variación y
// provenance. Cierra con Esc, clic en el backdrop o el botón ✕.

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useSerie, type SerieSpec } from '../../lib/serie';
import type { SerieDetalle } from '../../types';
import { LineChart } from '../charts/LineChart';
import { num, pct, SD } from '../../lib/format';

const RANGOS: { label: string; dias: number }[] = [
  { label: '1M', dias: 31 },
  { label: '6M', dias: 183 },
  { label: '1A', dias: 366 },
  { label: 'Máx', dias: Infinity },
];

const COLOR: Record<string, string> = {
  pos: 'var(--pos)', neg: 'var(--neg)', accent: 'var(--accent)', neutral: 'var(--fg-muted)',
};

function fechaLab(iso: string): string {
  return new Date(iso + 'T00:00:00Z')
    .toLocaleDateString('es', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .replace('.', '');
}

function ModalInner({ spec, onClose }: { spec: SerieSpec; onClose: () => void }) {
  const [rango, setRango] = useState('Máx');
  const { data, estado } = useView<SerieDetalle>(
    (signal) =>
      spec.tipo === 'mercado'
        ? api.serieMercado(spec.symbol, signal)
        : api.serieIndicador(spec.iso3, spec.codigo, signal),
    [spec.tipo === 'mercado' ? spec.symbol : `${spec.iso3}:${spec.codigo}`],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const puntos = data?.puntos ?? [];
  const dias = RANGOS.find((r) => r.label === rango)?.dias ?? Infinity;
  let shown = puntos;
  if (Number.isFinite(dias) && puntos.length) {
    const corte = new Date(puntos[puntos.length - 1].fecha).getTime() - dias * 86_400_000;
    const filt = puntos.filter((p) => new Date(p.fecha).getTime() >= corte);
    shown = filt.length >= 2 ? filt : puntos;
  }

  const last = shown[shown.length - 1]?.valor ?? null;
  const first = shown[0]?.valor ?? null;
  const delta = last != null && first != null ? last - first : null;
  const deltaPct = delta != null && first ? (delta / Math.abs(first)) * 100 : null;
  const valores = shown.map((p) => p.valor);
  const mn = valores.length ? Math.min(...valores) : null;
  const mx = valores.length ? Math.max(...valores) : null;
  const color = COLOR[spec.sentiment ?? (delta == null ? 'accent' : delta >= 0 ? 'pos' : 'neg')] ?? COLOR.accent;
  const unidad = data?.unidad ?? '';

  const idx = shown.length
    ? [0, Math.floor(shown.length / 3), Math.floor((2 * shown.length) / 3), shown.length - 1]
    : [];
  const xLabels = [...new Set(idx)].map((i) => fechaLab(shown[i].fecha));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="surface rounded-[6px] w-full max-w-2xl max-h-[90vh] overflow-auto scrollbar-thin shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-strong-token sticky top-0 surface z-10">
          <div className="mono text-[12px] truncate pr-2">
            {spec.titulo ?? data?.nombre ?? 'Serie histórica'}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="mono text-[12px] text-muted hover:text-accent px-2 h-7 surface-sunk rounded-[4px] shrink-0"
          >
            ✕ <span className="kbd ml-1">Esc</span>
          </button>
        </div>

        {estado !== 'ok' || !data ? (
          <div className="py-16 text-center mono text-[12px] text-muted">
            {estado === 'offline' ? '⚠ Fuente caída · s/d' : 'Cargando serie…'}
          </div>
        ) : puntos.length < 2 ? (
          <div className="py-16 text-center mono text-[12px] text-subtle">
            ∅ Sin histórico suficiente para graficar
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            {/* headline */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="mono text-[26px] tabular-nums leading-none">{num(last, 2)}</span>
                <span className="mono text-[11px] text-subtle">{unidad}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="mono text-[13px] tabular-nums"
                  style={{ color: delta == null ? 'var(--fg-subtle)' : delta >= 0 ? 'var(--pos)' : 'var(--neg)' }}
                >
                  {delta != null ? `${delta >= 0 ? '▲' : '▼'} ${num(Math.abs(delta), 2)}` : SD}
                  {deltaPct != null ? `  (${pct(deltaPct, 1, true)})` : ''}
                </span>
              </div>
            </div>

            {/* gráfico */}
            <LineChart
              series={[{ id: data.id, color, puntos: shown.map((p, i) => ({ x: i, y: p.valor })) }]}
              xLabels={xLabels}
              yUnit={unidad === '%' ? '%' : ''}
              height={240}
            />

            {/* rangos + min/max */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center surface-sunk rounded-[4px] p-0.5 gap-0.5">
                {RANGOS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setRango(r.label)}
                    className={`mono text-[10px] px-2 py-0.5 rounded-[3px] ${
                      rango === r.label ? 'bg-accent text-[#0a0a0b]' : 'text-muted hover:text-[var(--fg)]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="mono text-[10px] text-subtle flex gap-3">
                <span>mín {num(mn, 2)}</span>
                <span>máx {num(mx, 2)}</span>
                <span>{shown.length} obs</span>
              </div>
            </div>

            {/* provenance */}
            <div className="mono text-[9px] text-subtle border-t border-token pt-2 flex items-center justify-between">
              <span>Fuente: {data.fuente || SD}</span>
              <span>corte: {puntos[puntos.length - 1]?.fecha ?? SD}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SerieModal() {
  const { spec, cerrar } = useSerie();
  if (!spec) return null;
  return <ModalInner spec={spec} onClose={cerrar} />;
}
