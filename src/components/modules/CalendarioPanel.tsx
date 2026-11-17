// Vista 9 · Calendario de bancos centrales / próximos releases — rejilla mensual
// tipo calendario; clic en un día con eventos abre un pop-up con su detalle.
// Fechas reales (FRED); cero inventadas.

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import type { CalendarEvent, Tone } from '../../types';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Tag } from '../primitives/Tag';
import { EstadoVacio } from '../primitives/Estado';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const TONE_VAR: Record<string, string> = {
  accent: 'var(--accent)', info: 'var(--info)', neg: 'var(--neg)', pos: 'var(--pos)', neutral: 'var(--fg-muted)',
};
const asTone = (t: string): Tone =>
  (['accent', 'info', 'neg', 'pos', 'neutral'].includes(t) ? t : 'neutral') as Tone;

const isoUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const hoyISO = () => new Date().toISOString().slice(0, 10);

export function CalendarioPanel(_: { now: Date }) {
  const { data, estado } = useView(api.calendario);
  const eventos = useMemo(() => data ?? [], [data]);

  // Mapa fecha → eventos.
  const porDia = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of eventos) {
      if (!m.has(e.fecha)) m.set(e.fecha, []);
      m.get(e.fecha)!.push(e);
    }
    return m;
  }, [eventos]);

  // Mes mostrado: arranca en el del primer evento futuro (o el mes actual).
  const inicial = useMemo(() => {
    const hoy = hoyISO();
    const prox = eventos.map((e) => e.fecha).filter((f) => f >= hoy).sort()[0] ?? eventos[0]?.fecha;
    const base = prox ? new Date(prox + 'T00:00:00Z') : new Date();
    return { y: base.getUTCFullYear(), m: base.getUTCMonth() };
  }, [eventos]);

  const [mes, setMes] = useState(inicial);
  useEffect(() => setMes(inicial), [inicial]);
  const [sel, setSel] = useState<string | null>(null);

  // Rejilla de 6 semanas (42 celdas), empezando el lunes.
  const celdas = useMemo(() => {
    const primero = Date.UTC(mes.y, mes.m, 1);
    const offset = (new Date(primero).getUTCDay() + 6) % 7; // lunes = 0
    const inicio = primero - offset * 86_400_000;
    return Array.from({ length: 42 }, (_, i) => {
      const ms = inicio + i * 86_400_000;
      const iso = isoUTC(ms);
      const d = new Date(ms);
      return {
        iso,
        dia: d.getUTCDate(),
        enMes: d.getUTCMonth() === mes.m,
        eventos: porDia.get(iso) ?? [],
      };
    });
  }, [mes, porDia]);

  const navMes = (delta: number) =>
    setMes(({ y, m }) => {
      const t = m + delta;
      return { y: y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });

  const hoy = hoyISO();
  const selEventos = sel ? porDia.get(sel) ?? [] : [];

  if (estado !== 'ok') {
    return (
      <Panel>
        <SectionTitle id="9" title="Calendario · bancos centrales / releases" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }

  return (
    <Panel>
      <SectionTitle
        id="9"
        title="Calendario · bancos centrales / releases"
        right={
          <span className="flex items-center gap-1.5">
            <button onClick={() => navMes(-1)} className="px-1.5 h-6 surface-sunk rounded-[3px] hover:text-accent">‹</button>
            <span className="mono text-[10px] text-muted w-32 text-center">
              {MESES[mes.m]} {mes.y}
            </span>
            <button onClick={() => navMes(1)} className="px-1.5 h-6 surface-sunk rounded-[3px] hover:text-accent">›</button>
            <button onClick={() => setMes(inicial)} className="ml-1 px-2 h-6 surface-sunk rounded-[3px] hover:text-accent">hoy</button>
          </span>
        }
      />

      {/* cabecera de días */}
      <div className="grid grid-cols-7 border-b border-token">
        {DIAS.map((d) => (
          <div key={d} className="px-2 py-1 mono text-[9px] text-subtle text-center">
            {d}
          </div>
        ))}
      </div>

      {/* rejilla */}
      <div className="grid grid-cols-7">
        {celdas.map((c) => {
          const tiene = c.eventos.length > 0;
          const esHoy = c.iso === hoy;
          return (
            <div
              key={c.iso}
              onClick={tiene ? () => setSel(c.iso) : undefined}
              className={`min-h-[64px] sm:min-h-[88px] border-r border-b border-token p-1 flex flex-col gap-1 ${
                c.enMes ? '' : 'opacity-35'
              } ${tiene ? 'cursor-pointer hover:bg-[var(--bg-sunk)]' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`mono text-[11px] tabular-nums ${esHoy ? 'bg-accent text-[#0a0a0b] rounded-full w-5 h-5 flex items-center justify-center' : 'text-muted'}`}
                >
                  {c.dia}
                </span>
                {tiene && <span className="mono text-[8px] text-subtle">{c.eventos.length}</span>}
              </div>
              {/* pills de eventos (título en sm+, sólo puntos en móvil) */}
              <div className="flex flex-col gap-0.5">
                {c.eventos.slice(0, 2).map((e, i) => (
                  <div key={i} className="flex items-center gap-1 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE_VAR[e.tono] ?? 'var(--fg-muted)' }} />
                    <span className="hidden sm:block mono text-[8px] text-muted truncate leading-tight">{e.titulo}</span>
                  </div>
                ))}
                {c.eventos.length > 2 && (
                  <span className="mono text-[8px] text-subtle">+{c.eventos.length - 2} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 h-7 flex items-center gap-3 mono text-[9px] text-subtle border-t border-token">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} /> banco central</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--info)' }} /> release</span>
        <span className="ml-auto">{eventos.length} eventos · fechas oficiales FRED</span>
      </div>

      {/* pop-up del día */}
      {sel && <DiaModal fecha={sel} eventos={selEventos} onClose={() => setSel(null)} />}
    </Panel>
  );
}

function DiaModal({ fecha, eventos, onClose }: { fecha: string; eventos: CalendarEvent[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const d = new Date(fecha + 'T00:00:00Z');
  const titulo = `${DIAS[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div
        className="surface rounded-[6px] w-full max-w-md max-h-[85vh] overflow-auto scrollbar-thin shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-strong-token sticky top-0 surface">
          <span className="mono text-[12px]">{titulo}</span>
          <button onClick={onClose} aria-label="Cerrar" className="mono text-[12px] text-muted hover:text-accent px-2 h-7 surface-sunk rounded-[4px]">
            ✕ <span className="kbd ml-1">Esc</span>
          </button>
        </div>
        <div className="p-3 flex flex-col">
          {eventos.length === 0 ? (
            <div className="py-8 text-center mono text-[11px] text-subtle">Sin eventos</div>
          ) : (
            eventos.map((e, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-token last:border-0">
                <Tag tone={asTone(e.tono)}>{e.tipo}</Tag>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-snug">{e.titulo}</div>
                  <div className="mono text-[9px] text-subtle mt-0.5">{e.pais}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
