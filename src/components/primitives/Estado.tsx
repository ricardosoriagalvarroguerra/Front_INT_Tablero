// Indicadores de estado/provenance reutilizables. Materializan el guardrail
// "cero datos inventados": cuando falta el dato o la fuente cae, se muestra
// explícitamente, nunca se rellena.

import type { Estado, Provenance } from '../../types';
import type { ViewEstado } from '../../lib/useView';
import { antiguedad } from '../../lib/format';

const ESTADO_TONE: Record<Estado, { dot: string; label: string }> = {
  ok: { dot: 'var(--pos)', label: 'OK' },
  live: { dot: 'var(--accent)', label: 'LIVE' },
  lag: { dot: 'var(--accent)', label: 'LAG' },
  cold: { dot: 'var(--fg-subtle)', label: 'COLD' },
  down: { dot: 'var(--neg)', label: 'CAÍDA' },
};

/** Badge compacto de frescura: fuente + antigüedad + estado. */
export function FreshnessBadge({ prov, now }: { prov: Provenance; now: Date }) {
  const e = ESTADO_TONE[prov.estado] ?? ESTADO_TONE.cold;
  return (
    <span className="inline-flex items-center gap-1.5 mono text-[9px] uppercase tracking-wider text-subtle">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.dot }} />
      <span>{prov.fuente}</span>
      <span className="text-subtle">· {antiguedad(prov.asof, now)}</span>
    </span>
  );
}

/** Estado de un panel sin datos / fuente caída / cargando. */
export function EstadoVacio({ estado, label }: { estado: ViewEstado; label?: string }) {
  const map: Record<ViewEstado, { txt: string; cls: string }> = {
    loading: { txt: 'Conectando con la fuente…', cls: 'text-muted' },
    offline: { txt: label ?? 'Fuente caída · sin dato (s/d)', cls: 'text-neg' },
    ok: { txt: 'Sin observaciones', cls: 'text-muted' },
  };
  const s = map[estado];
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
      {estado === 'loading' ? (
        <span className="mono text-[18px] text-subtle" style={{ animation: 'spin 1.1s linear infinite' }}>
          ↻
        </span>
      ) : (
        <span className="mono text-[18px] text-subtle">{estado === 'offline' ? '⚠' : '∅'}</span>
      )}
      <span className={`mono text-[11px] ${s.cls}`}>{s.txt}</span>
    </div>
  );
}
