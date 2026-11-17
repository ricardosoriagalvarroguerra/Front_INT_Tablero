// Pestaña Histórico · un país frente a otro y frente a su agregado FMI,
// 2015 → horizonte WEO (proyecciones punteadas), más la tasa de política (BIS)
// y el rendimiento a 10A mensuales. Tabla anual al pie.

import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useCountries } from '../../lib/useCountries';
import { TimeChart, Leyenda, type TSerie } from '../charts/TimeChart';
import { Panel } from '../primitives/Panel';
import { EstadoVacio } from '../primitives/Estado';
import { Seccion, Th } from '../analisis/ui';
import type { Historico } from '../../types-analisis';

const ORDEN = ['gdp_growth', 'cpi_yoy', 'unemployment', 'fiscal_balance', 'debt_gdp', 'current_account', 'gdp_usd', 'cpi_eop', 'gdp_ppp_share'];
/** Agregado FMI comparable por región/grupo. */
const AGG_DE_REGION: Record<string, string> = {
  LatAm: 'WE', Europa: 'EURO', Asia: 'DA', 'Medio Oriente': 'MECA', África: 'SSA', Norteamérica: 'ADVEC', Oceanía: 'ADVEC',
};
const AGG_IND: Record<string, string> = { gdp_growth: 'gdp_growth', cpi_yoy: 'cpi_yoy', debt_gdp: 'debt_gdp', fiscal_balance: 'fiscal_balance', current_account: 'current_account', cpi_eop: 'cpi_eop' };

const C_A = 'var(--accent)', C_B = 'var(--info)', C_AGG = 'var(--fg-muted)';

export function HistoricoPanel({ inicial = 'ARG' }: { inicial?: string }) {
  const { list } = useCountries();
  const [a, setA] = useState(inicial);
  const [b, setB] = useState('BRA');
  const [conAgg, setConAgg] = useState(true);
  const ha = useView<Historico>((s) => api.historico(a, s), [a]);
  const hb = useView<Historico>((s) => (b ? api.historico(b, s) : Promise.reject(new Error('sin comparador'))), [b]);
  const ag = useView(api.agregados);

  const aggCod = ha.data ? (AGG_DE_REGION[ha.data.region] ?? 'WEOWORLD') : 'WEOWORLD';
  const agg = ag.data?.find((x) => x.codigo === aggCod);
  const mundo = ag.data?.find((x) => x.codigo === 'WEOWORLD');
  const Y = ha.data?.anioBase ?? new Date().getUTCFullYear();

  const indicadores = useMemo(
    () => [...(ha.data?.indicadores ?? [])].sort((x, y) => ORDEN.indexOf(x.codigo) - ORDEN.indexOf(y.codigo)),
    [ha.data],
  );

  const Selector = ({ v, set, vacio }: { v: string; set: (x: string) => void; vacio?: boolean }) => (
    <select value={v} onChange={(e) => set(e.target.value)} className="surface-sunk rounded-[4px] h-8 px-2 text-[12px] outline-none">
      {vacio && <option value="">— ninguno —</option>}
      {list.map((c) => (
        <option key={c.iso3} value={c.iso3}>{c.nombreEs}</option>
      ))}
    </select>
  );

  if (ha.estado === 'offline') return <Panel><EstadoVacio estado="offline" /></Panel>;

  return (
    <div className="flex flex-col gap-3">
      <div className="surface rounded-[6px] px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-[13px] font-semibold">Histórico 2015 → {Y + 5}</span>
        <span className="flex items-center gap-2 text-[12px]"><span className="w-3 h-[3px]" style={{ background: C_A }} /><Selector v={a} set={setA} /></span>
        <span className="text-subtle text-[12px]">vs</span>
        <span className="flex items-center gap-2 text-[12px]"><span className="w-3 h-[3px]" style={{ background: C_B }} /><Selector v={b} set={setB} vacio /></span>
        <label className="flex items-center gap-1.5 text-[12px] text-muted cursor-pointer">
          <input type="checkbox" checked={conAgg} onChange={(e) => setConAgg(e.target.checked)} />
          {agg?.nombre ?? 'agregado'} (FMI)
        </label>
        <span className="ml-auto text-[10px] text-subtle">Punteado = proyección FMI · {Y} = estimación · fuentes por indicador al pie de cada gráfico</span>
      </div>

      {ha.estado === 'loading' || !ha.data ? (
        <Panel><EstadoVacio estado="loading" /></Panel>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {indicadores.map((ind) => {
              const serieB = hb.data?.indicadores.find((x) => x.codigo === ind.codigo);
              const aggSerie = conAgg && AGG_IND[ind.codigo] ? (agg ?? mundo)?.indicadores[AGG_IND[ind.codigo]] : undefined;
              const series: TSerie[] = [
                { id: 'a', label: ha.data!.pais, color: C_A, ancho: 2, puntos: ind.serie.map((p) => ({ x: p.anio, y: p.valor, proy: p.tipo === 'proy' })) },
              ];
              if (serieB && b) series.push({ id: 'b', label: hb.data!.pais, color: C_B, puntos: serieB.serie.map((p) => ({ x: p.anio, y: p.valor, proy: p.tipo === 'proy' })) });
              if (aggSerie) series.push({ id: 'agg', label: (agg ?? mundo)!.nombre, color: C_AGG, ancho: 1.2, puntos: aggSerie.filter((p) => p.anio >= 2015).map((p) => ({ x: p.anio, y: p.valor, proy: p.anio > Y })) });
              const ult = ind.serie.find((p) => p.anio === Y) ?? ind.serie.filter((p) => p.tipo !== 'proy').pop();
              const extremo = ind.codigo === 'cpi_yoy' || ind.codigo === 'cpi_eop';
              return (
                <Seccion
                  key={ind.codigo}
                  titulo={ind.nombre}
                  sub={`${ind.unidad} · ${ind.fuentes.join(' / ')}`}
                  right={ult ? <span className="text-[13px] font-semibold text-[var(--fg)] tabular-nums">{ult.valor.toLocaleString('es', { maximumFractionDigits: 1 })}<span className="text-[10px] text-subtle font-normal"> {ult.anio}{ult.tipo === 'est' ? 'e' : ''}</span></span> : null}
                >
                  <div className="px-2 pt-2 pb-1">
                    <TimeChart series={series} height={170} proyDesde={Y + 0.5} ref0={!['debt_gdp', 'gdp_usd', 'gdp_ppp_share'].includes(ind.codigo)} fmtY={(y) => y.toLocaleString('es', { maximumFractionDigits: extremo && Math.abs(y) > 100 ? 0 : 1 })} />
                  </div>
                </Seccion>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {[
              { t: 'Tasa de política monetaria', s: 'BIS · fin de mes, %', ka: ha.data.tasaPolitica, kb: hb.data?.tasaPolitica },
              { t: 'Rendimiento soberano 10 años', s: 'FRED / BCE / OCDE · promedio mensual, %', ka: ha.data.yield10, kb: hb.data?.yield10 },
            ].map((g) => (
              <Seccion key={g.t} titulo={g.t} sub={g.s}>
                <div className="px-2 pt-2 pb-1">
                  {g.ka.length || g.kb?.length ? (
                    <TimeChart
                      height={170}
                      ref0={false}
                      fmtX={(x) => new Date(x).getUTCFullYear().toString()}
                      series={[
                        { id: 'a', label: ha.data!.pais, color: C_A, ancho: 2, puntos: g.ka.map((p) => ({ x: Date.parse(p.fecha + '-01'), y: p.valor })) },
                        ...(g.kb && b ? [{ id: 'b', label: hb.data!.pais, color: C_B, puntos: g.kb.map((p) => ({ x: Date.parse(p.fecha + '-01'), y: p.valor })) }] : []),
                      ]}
                    />
                  ) : (
                    <p className="py-10 text-center text-[11px] text-subtle">Sin serie para estos países (s/d)</p>
                  )}
                </div>
              </Seccion>
            ))}
          </div>

          <Seccion titulo={`Tabla anual · ${ha.data.pais}`} sub="Valores observados, estimación del año en curso (e) y proyecciones (p) del FMI">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr>
                    <Th left>Indicador</Th>
                    {Array.from({ length: Y + 5 - 2015 + 1 }, (_, i) => 2015 + i).map((an) => (
                      <Th key={an}>{an}{an === Y ? 'e' : an > Y ? 'p' : ''}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indicadores.map((ind) => (
                    <tr key={ind.codigo} className="row-hover">
                      <td className="px-2 h-7 border-b border-token whitespace-nowrap">{ind.nombre}</td>
                      {Array.from({ length: Y + 5 - 2015 + 1 }, (_, i) => 2015 + i).map((an) => {
                        const p = ind.serie.find((x) => x.anio === an);
                        return (
                          <td key={an} className={`px-2 text-right border-b border-token tabular-nums ${an > Y ? 'text-muted italic' : ''}`}>
                            {p ? p.valor.toLocaleString('es', { maximumFractionDigits: Math.abs(p.valor) >= 100 ? 0 : 1 }) : <span className="text-subtle">·</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
          <Leyenda items={[{ label: 'observado', color: 'var(--fg-muted)' }, { label: 'proyección FMI', color: 'var(--fg-muted)', punteado: true }]} />
        </>
      )}
    </div>
  );
}
