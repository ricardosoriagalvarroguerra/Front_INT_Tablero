// Tesis, semáforo, alertas y balance de riesgos — la lectura de 30 segundos.

import type { Analisis, Alerta } from '../../types-analisis';
import { Dot, NIVEL_COLOR, NIVEL_TXT, SEV_COLOR, Seccion, fmtFecha } from './ui';

export function Tesis({ a }: { a: Analisis }) {
  return (
    <section className="surface rounded-[6px] px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-subtle mb-2">
        <span>Tesis del día</span>
        <span>· mercados al {fmtFecha(a.corte.mercados)}</span>
        <span>· tasas de política a {fmtFecha(a.corte.monetario)}</span>
        <span>· {a.corte.weo}</span>
      </div>
      <p className="text-[17px] sm:text-[19px] leading-snug font-semibold tracking-tight">{a.tesis.titular}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-[12px]">
        <span style={{ color: 'var(--neg)' }}>{a.tesis.focos}</span>
        <span style={{ color: 'var(--pos)' }}>{a.tesis.apoyos}</span>
      </div>
      <ol className="mt-3 grid md:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] leading-relaxed text-muted list-decimal pl-4 marker:text-subtle">
        {a.tesis.puntos.map((p, i) => (
          <li key={i} className="pl-1">
            <span style={{ color: 'var(--fg)' }}>{p}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[10px] text-subtle">
        Texto generado por reglas a partir de los datos de la BDR (FMI, BIS, FRED, BCE, Yahoo, GDELT): si cambia el dato, cambia la lectura.
      </p>
    </section>
  );
}

export function Semaforo({ a, onGoto, compacto = false }: { a: Analisis; onGoto?: (t: string) => void; compacto?: boolean }) {
  return (
    <div className={`grid gap-2 ${compacto ? 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-9' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {a.semaforo.map((s) => (
        <button
          key={s.id}
          onClick={onGoto ? () => onGoto(s.tab) : undefined}
          title={compacto ? s.lectura : undefined}
          className="surface rounded-[6px] text-left px-3 py-2.5 hover:ring-accent transition-shadow flex flex-col gap-1"
          style={{ borderLeft: `3px solid ${NIVEL_COLOR[s.nivel]}` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`${compacto ? 'text-[10px]' : 'text-[12px]'} font-medium leading-tight`}>{s.dimension}</span>
            {!compacto && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: NIVEL_COLOR[s.nivel] }}>
                <Dot color={NIVEL_COLOR[s.nivel]} size={6} />
                {NIVEL_TXT[s.nivel]}
              </span>
            )}
          </div>
          <span className={`${compacto ? 'text-[11px]' : 'text-[15px]'} font-semibold tabular-nums`} style={{ color: NIVEL_COLOR[s.nivel] }}>
            {s.valor}
          </span>
          {!compacto && <span className="text-[11px] text-muted leading-snug line-clamp-4">{s.lectura}</span>}
        </button>
      ))}
    </div>
  );
}

export function ListaAlertas({ alertas, onGoto, max }: { alertas: Alerta[]; onGoto?: (t: string) => void; max?: number }) {
  const xs = max ? alertas.slice(0, max) : alertas;
  if (!xs.length) return <p className="px-4 py-3 text-[12px] text-muted">Sin alertas activas con las reglas vigentes.</p>;
  return (
    <ul className="divide-y divide-[color:var(--border)]">
      {xs.map((al) => (
        <li key={al.id}>
          <button onClick={onGoto ? () => onGoto(al.tab) : undefined} className="w-full text-left flex gap-3 px-4 py-2 row-hover">
            <span className="mt-1.5"><Dot color={SEV_COLOR[al.nivel]} /></span>
            <span className="flex-1 min-w-0">
              <span className="text-[12px] font-medium">{al.titulo}</span>
              <span className="block text-[11px] text-muted leading-snug">{al.detalle}</span>
            </span>
            <span className="text-[10px] text-subtle shrink-0 mt-0.5">{al.categoria}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Tira horizontal de alertas (Resumen). */
export function TiraAlertas({ alertas, onGoto }: { alertas: Alerta[]; onGoto?: (t: string) => void }) {
  const xs = alertas.filter((a) => a.nivel !== 'info');
  if (!xs.length) return null;
  return (
    <div className="surface rounded-[6px] flex items-stretch overflow-x-auto scrollbar-thin">
      <span className="px-3 flex items-center text-[11px] font-medium shrink-0 border-r border-token">Alertas · {xs.length}</span>
      {xs.map((al) => (
        <button
          key={al.id}
          onClick={onGoto ? () => onGoto(al.tab) : undefined}
          title={al.detalle}
          className="flex items-center gap-2 px-3 py-2 text-[11px] whitespace-nowrap row-hover border-r border-token"
        >
          <Dot color={SEV_COLOR[al.nivel]} size={7} />
          {al.titulo}
        </button>
      ))}
    </div>
  );
}

export function BalanceRiesgos({ a }: { a: Analisis }) {
  const baj = a.riesgos.filter((r) => r.sesgo === 'bajista');
  const alc = a.riesgos.filter((r) => r.sesgo === 'alcista');
  const Col = ({ titulo, xs, color }: { titulo: string; xs: typeof baj; color: string }) => (
    <div className="flex-1 min-w-[260px]">
      <h3 className="px-4 pt-3 text-[11px] font-medium" style={{ color }}>{titulo}</h3>
      {xs.length === 0 ? (
        <p className="px-4 py-2 text-[11px] text-muted">Ninguno activado por las reglas.</p>
      ) : (
        <ul className="px-4 py-2 flex flex-col gap-2">
          {xs.map((r) => (
            <li key={r.id} className="text-[12px] leading-snug">
              <span className="font-medium">{r.titulo}</span>
              <span className="block text-[11px] text-muted">{r.evidencia}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <Seccion titulo="Balance de riesgos" sub="Riesgos activados por las reglas, con la evidencia que los dispara">
      <div className="flex flex-wrap pb-2">
        <Col titulo="A la baja" xs={baj} color="var(--neg)" />
        <Col titulo="Al alza" xs={alc} color="var(--pos)" />
      </div>
    </Seccion>
  );
}
