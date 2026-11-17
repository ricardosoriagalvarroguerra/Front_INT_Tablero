// Pie de fuentes: estado de la última ingesta y FRESCURA del dato de cada
// fuente según su periodicidad (verde = al día, ámbar = atrasado, rojo =
// vencido o fuente caída). Si el API no responde, lo dice explícitamente.

import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useOrigen } from '../../lib/useOrigen';
import { antiguedad } from '../../lib/format';
import type { Fuente } from '../../types';

/** Días de tolerancia por periodicidad antes de pasar a ámbar (rojo = 2×). */
const TOLERANCIA: Record<string, number> = { diaria: 5, semanal: 12, mensual: 50, anual: 550 };

export function frescura(f: Fuente, now: Date): { color: string; txt: string } {
  if (f.estado === 'down') return { color: 'var(--neg)', txt: 'fuente caída en la última corrida' };
  const ref = f.ultimoDato ?? f.ultimaVerificacion;
  if (!ref || !f.periodicidad) return { color: 'var(--fg-subtle)', txt: 'sin dato' };
  const dias = (now.getTime() - Date.parse(ref)) / 86_400_000;
  const tol = TOLERANCIA[f.periodicidad] ?? 30;
  if (dias <= tol) return { color: 'var(--pos)', txt: 'al día' };
  if (dias <= tol * 2) return { color: 'var(--accent)', txt: 'atrasado' };
  return { color: 'var(--neg)', txt: 'vencido' };
}

export function HealthFooter({ now }: { now: Date }) {
  const { data, estado } = useView(api.fuentes);
  const { origen, snapshot } = useOrigen();

  return (
    <footer className="border-t border-strong-token surface mt-3">
      <div className="flex items-center gap-4 px-3 sm:px-4 h-9 overflow-x-auto scrollbar-thin">
        <span className="text-[10px] text-subtle shrink-0">Fuentes</span>
        {estado === 'offline' && <span className="text-[11px] text-neg shrink-0">API sin conexión · datos en s/d</span>}
        {estado === 'loading' && <span className="text-[11px] text-muted shrink-0">verificando…</span>}
        {origen === 'respaldo' && snapshot && (
          <span className="text-[11px] text-accent shrink-0">respaldo embebido del {new Date(snapshot.generado).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        )}
        {estado === 'ok' &&
          (data ?? []).map((f) => {
            const fr = frescura(f, now);
            return (
              <span key={f.id} className="flex items-center gap-1.5 shrink-0" title={`${f.nombre} · ${fr.txt} · último dato ${f.ultimoDato ?? 's/d'} · verificada ${antiguedad(f.ultimaVerificacion, now)}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: fr.color }} />
                <span className="text-[11px] text-muted">{f.nombre.replace(/ \(.*\)$/, '')}</span>
                <span className="text-[10px] text-subtle">{f.ultimoDato ? antiguedad(f.ultimoDato, now) : antiguedad(f.ultimaVerificacion, now)}</span>
              </span>
            );
          })}
        <span className="text-[10px] text-subtle ml-auto shrink-0 pl-4">cero datos inventados · fuente y fecha en cada cifra</span>
      </div>
    </footer>
  );
}
