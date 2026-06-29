// Health-check (§5.F): estado, latencia y última verificación de cada fuente.
// Cuando el API no responde, lo dice explícitamente (no inventa estados).

import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { antiguedad } from '../../lib/format';
import type { Estado } from '../../types';

const DOT: Record<Estado, string> = {
  ok: 'var(--pos)',
  live: 'var(--accent)',
  lag: 'var(--accent)',
  cold: 'var(--fg-subtle)',
  down: 'var(--neg)',
};

export function HealthFooter({ now }: { now: Date }) {
  const { data, estado } = useView(api.fuentes);

  return (
    <footer className="border-t border-strong-token surface mt-3">
      <div className="flex items-center gap-3 px-3 sm:px-4 h-9 overflow-x-auto scrollbar-thin">
        <span className="mono text-[9px] uppercase tracking-wider text-subtle shrink-0">
          Fuentes
        </span>
        {estado === 'offline' && (
          <span className="mono text-[10px] text-neg shrink-0">
            ⚠ API sin conexión · datos en estado s/d
          </span>
        )}
        {estado === 'loading' && (
          <span className="mono text-[10px] text-muted shrink-0">verificando…</span>
        )}
        {estado === 'ok' &&
          (data ?? []).map((f) => (
            <span key={f.id} className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: DOT[f.estado] }} />
              <span className="mono text-[10px] text-muted">{f.nombre}</span>
              <span className="mono text-[9px] text-subtle">
                {antiguedad(f.ultimaVerificacion, now)}
              </span>
            </span>
          ))}
        <span className="mono text-[9px] text-subtle ml-auto shrink-0 pl-4">
          cero datos inventados · provenance por cifra
        </span>
      </div>
    </footer>
  );
}
