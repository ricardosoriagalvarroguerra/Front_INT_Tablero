// Pantalla inicial · cockpit Resumen. Aglomera lo más importante de todas las
// vistas en una sola pantalla densa (tipo Bloomberg). Cada sección enlaza a su
// pestaña de detalle. Compone los endpoints existentes; degrada por sección.

import { interpolateYlOrRd } from 'd3';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useSerie, specDePulso } from '../../lib/serie';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Tag } from '../primitives/Tag';
import { Sparkline } from '../primitives/Sparkline';
import { WorldMap } from '../charts/WorldMap';
import { FreshnessBadge, EstadoVacio } from '../primitives/Estado';
import { num, pct, SD } from '../../lib/format';
import { useAnalisis } from '../../lib/useAnalisis';
import { Semaforo, TiraAlertas } from '../analisis/Cabecera';
import { LivePlayer } from '../primitives/LivePlayer';

const REG_TONE = { 'risk-on': 'pos', 'risk-off': 'neg', neutral: 'neutral' } as const;
const MERCADOS_CLAVE = ['BRENT', 'WTI', 'GOLD', 'COPPER', 'VIX', 'DXY', 'SP500', 'EURUSD', 'USDBRL'];

function Ver({ onGoto, to }: { onGoto?: (t: string) => void; to: string }) {
  if (!onGoto) return null;
  return (
    <button onClick={() => onGoto(to)} className="text-[11px] text-accent hover:underline">
      Detalle →
    </button>
  );
}

function scoreColor(s: number | null): string {
  if (s == null) return 'var(--fg-subtle)';
  return s >= 66 ? 'var(--neg)' : s >= 40 ? 'var(--accent)' : 'var(--pos)';
}

export function ResumenPanel({ now, onGoto }: { now: Date; onGoto?: (t: string) => void }) {
  const { abrir } = useSerie();
  const pulso = useView(api.pulso);
  const fx = useView(api.fx);
  const riesgo = useView(api.riesgo);
  const conf = useView(api.conflictos);
  const tasas = useView(api.tasasReales);
  const an = useAnalisis();

  const mercados = (fx.data?.series ?? []).filter((s) => MERCADOS_CLAVE.includes(s.id));
  const topConf = (conf.data ?? []).slice(0, 5);
  const tasasExt = [...(tasas.data ?? [])].filter((t) => t.tasaReal != null).sort((a, b) => a.tasaReal! - b.tasaReal!).slice(0, 6);

  // Choropleth de conflicto (intensidad GDELT, escala log).
  const confByIso = new Map((conf.data ?? []).map((r) => [r.iso3, r]));
  const logMaxInt = Math.log1p(Math.max(1, ...(conf.data ?? []).map((r) => r.intensidad ?? 0)));
  const mapFill = (iso3: string | null) => {
    const r = iso3 ? confByIso.get(iso3) : undefined;
    if (!r || r.intensidad == null) return null;
    const t = logMaxInt > 0 ? Math.log1p(r.intensidad) / logMaxInt : 0;
    return interpolateYlOrRd(0.15 + 0.85 * t);
  };
  const mapLabel = (iso3: string | null) => {
    const r = iso3 ? confByIso.get(iso3) : undefined;
    if (!r || r.intensidad == null) return null;
    return `intensidad ${Math.round(r.intensidad)} · tono ${r.tono != null ? num(r.tono, 1) : SD}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Tesis + semáforo + alertas (capa analítica) */}
      {an.data && (
        <>
          <Panel className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-semibold leading-snug">{an.data.tesis.titular}</p>
              <button onClick={() => onGoto?.('analisis')} className="text-[11px] text-accent hover:underline shrink-0 mt-1">Análisis completo →</button>
            </div>
            <p className="text-[12px] mt-1"><span style={{ color: 'var(--neg)' }}>{an.data.tesis.focos}</span> <span style={{ color: 'var(--pos)' }}>{an.data.tesis.apoyos}</span></p>
          </Panel>
          <Semaforo a={an.data} onGoto={onGoto} compacto />
          <TiraAlertas alertas={an.data.alertas} onGoto={onGoto} />
        </>
      )}

      {/* Estado global */}
      <Panel className="px-3 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-2 h-2"><div className="absolute inset-0 rounded-full bg-accent pulse-dot" /><div className="w-2 h-2 rounded-full bg-accent" /></div>
          <span className="text-[12px] font-medium">Mercados hoy</span>
        </div>
        {fx.data && (
          <span className="flex items-center gap-1.5"><span className="mono text-[9px] text-subtle">régimen</span><Tag tone={REG_TONE[fx.data.regimen]}>{fx.data.regimen}</Tag></span>
        )}
        <span className="mono text-[10px] text-muted">{pulso.data?.length ?? 0} señales del día</span>
        <span className="mono text-[10px] text-muted">{(riesgo.data ?? []).filter((r) => (r.score ?? 0) >= 66).length} economías en alto estrés</span>
        {fx.data && <span className="ml-auto"><FreshnessBadge prov={fx.data.prov} now={now} /></span>}
      </Panel>

      {/* Pulso del día */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[12px] font-semibold">Pulso · qué cambió hoy</span>
          <Ver onGoto={onGoto} to="pulso" />
        </div>
        {pulso.estado !== 'ok' ? (
          <Panel><EstadoVacio estado={pulso.estado} /></Panel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {pulso.data!.slice(0, 6).map((it) => {
              const cls = it.sentiment === 'pos' ? 'text-pos' : it.sentiment === 'neg' ? 'text-neg' : it.sentiment === 'accent' ? 'text-accent' : 'text-muted';
              const spec = specDePulso(it);
              return (
                <Panel key={it.id} onClick={spec ? () => abrir(spec) : undefined} className="p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between"><Tag tone={it.sentiment === 'neg' ? 'neg' : it.sentiment === 'accent' ? 'accent' : 'neutral'}>{it.categoria}</Tag><span className={`mono text-[11px] tabular-nums ${cls}`}>{it.deltaLabel}</span></div>
                  <div className="text-[11px] leading-snug font-medium line-clamp-2">{it.titulo}</div>
                  {it.spark && it.spark.length > 1 && <Sparkline data={it.spark} sentiment={it.sentiment === 'accent' ? 'accent' : it.sentiment} width={140} height={18} />}
                </Panel>
              );
            })}
          </div>
        )}
      </div>

      {/* Tres columnas: mercados · riesgo · geopolítica+tasas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Mercados clave */}
        <Panel>
          <SectionTitle id="4" title="Mercados clave" right={<Ver onGoto={onGoto} to="fx" />} />
          {fx.estado !== 'ok' ? <EstadoVacio estado={fx.estado} /> : mercados.map((s) => {
            const sent = s.varDiaria == null ? 'neutral' : s.id === 'VIX' ? (s.varDiaria > 0 ? 'neg' : 'pos') : s.varDiaria > 0 ? 'pos' : 'neg';
            return (
              <div
                key={s.id}
                onClick={() => abrir({ tipo: 'mercado', symbol: s.id, titulo: s.nombre, sentiment: sent })}
                className="flex items-center gap-2 h-8 px-3 border-b border-token row-hover cursor-pointer"
              >
                <span className="mono text-[11px] flex-1 truncate">{s.nombre}</span>
                <Sparkline data={s.spark} sentiment={sent} width={56} height={16} />
                <span className="mono text-[11px] tabular-nums w-14 text-right">{s.valor != null ? num(s.valor, s.clase === 'fx' ? 2 : 1) : SD}</span>
                <span className={`mono text-[10px] tabular-nums w-12 text-right ${sent === 'pos' ? 'text-pos' : sent === 'neg' ? 'text-neg' : 'text-muted'}`}>{s.varDiaria != null ? pct(s.varDiaria, 1, true) : SD}</span>
              </div>
            );
          })}
        </Panel>

        {/* Vulnerabilidad macro-financiera (capa analítica) */}
        <Panel>
          <SectionTitle title="Economías más vulnerables" right={<Ver onGoto={onGoto} to="analisis" />} />
          {!an.data ? <EstadoVacio estado={an.estado} /> : an.data.vulnerabilidad.filas.slice(0, 9).map((r) => (
            <div key={r.iso3} className="flex items-center gap-2 h-8 px-3 border-b border-token row-hover" title={r.principales.join(', ')}>
              <span className="text-[12px] w-28 truncate">{r.pais}</span>
              <div className="flex-1 h-1.5 surface-sunk rounded-full overflow-hidden border-0"><div className="h-full rounded-full" style={{ width: `${r.score}%`, background: scoreColor(r.score >= 65 ? 70 : r.score >= 50 ? 50 : 20) }} /></div>
              <span className="text-[12px] tabular-nums w-7 text-right font-medium">{r.score}</span>
              <span className="text-[10px] w-28 truncate text-subtle">{r.principales[0] ?? ''}</span>
            </div>
          ))}
        </Panel>

        {/* Geopolítica + tasas reales */}
        <div className="flex flex-col gap-3">
          <Panel>
            <SectionTitle id="7" title="Tensión geopolítica" right={<Ver onGoto={onGoto} to="conflictos" />} />
            {conf.estado !== 'ok' ? <EstadoVacio estado={conf.estado} label="GDELT s/d" /> : topConf.length === 0 ? <EstadoVacio estado="ok" label="sin eventos" /> : topConf.map((k) => (
              <div key={k.iso3} className="flex items-center gap-2 h-7 px-3 border-b border-token row-hover">
                <span className="mono text-[11px] flex-1 truncate"><span className="text-subtle mr-1">{k.iso3}</span>{k.pais}</span>
                <span className="mono text-[10px] tabular-nums text-muted w-14 text-right">{k.intensidad != null ? Math.round(k.intensidad) : SD}</span>
                <span className="mono text-[10px] tabular-nums w-10 text-right" style={{ color: (k.tono ?? 0) < 0 ? 'var(--neg)' : 'var(--pos)' }}>{k.tono != null ? num(k.tono, 1) : SD}</span>
              </div>
            ))}
          </Panel>
          <Panel>
            <SectionTitle id="5" title="Tasas reales extremas" right={<Ver onGoto={onGoto} to="tasas" />} />
            {tasas.estado !== 'ok' ? <EstadoVacio estado={tasas.estado} /> : tasasExt.map((t) => (
              <div key={t.iso3} className="flex items-center gap-2 h-7 px-3 border-b border-token row-hover">
                <span className="mono text-[11px] flex-1 truncate"><span className="text-subtle mr-1">{t.iso3}</span>{t.pais}</span>
                <span className="mono text-[9px] text-subtle">infl {t.inflacion != null ? num(t.inflacion, 1) : SD}</span>
                <span className="mono text-[11px] tabular-nums w-12 text-right" style={{ color: t.tasaReal == null ? 'var(--fg-subtle)' : t.tasaReal >= 0 ? 'var(--pos)' : 'var(--neg)' }}>{t.tasaReal != null ? num(t.tasaReal, 2) : SD}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      {/* Mapa de conflicto + Bloomberg en vivo · lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <Panel className="flex flex-col">
          <SectionTitle id="7" title="Mapa de intensidad de conflicto · GDELT" right={<Ver onGoto={onGoto} to="conflictos" />} />
          <div className="relative w-full aspect-video surface-sunk">
            {conf.estado !== 'ok' ? (
              <EstadoVacio estado={conf.estado} label="GDELT s/d" />
            ) : (
              <WorldMap fill={mapFill} label={mapLabel} />
            )}
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <SectionTitle id="📺" title="Bloomberg en vivo" right={<Ver onGoto={onGoto} to="medios" />} />
          <LivePlayer channelId="UCIALMKvObZNtJ6AmdCLP7Lg" titulo="Bloomberg Television" />
        </Panel>
      </div>
    </div>
  );
}
