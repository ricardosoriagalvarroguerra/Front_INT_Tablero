// Vista 4 · FX & commodities — monitor + correlaciones + régimen risk-on/off.

import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useSerie } from '../../lib/serie';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Tag } from '../primitives/Tag';
import { Sparkline } from '../primitives/Sparkline';
import { FreshnessBadge, EstadoVacio } from '../primitives/Estado';
import { CorrMatrix } from '../charts/CorrMatrix';
import { num, pct, SD } from '../../lib/format';

const REG_TONE = { 'risk-on': 'pos', 'risk-off': 'neg', neutral: 'neutral' } as const;

export function FxPanel({ now }: { now: Date }) {
  const { data, estado } = useView(api.fx);
  const { abrir } = useSerie();
  if (estado !== 'ok' || !data) {
    return (
      <Panel>
        <SectionTitle id="4" title="FX & commodities" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }

  const corr = new Map(data.correlaciones.map((c) => [`${c.a}|${c.b}`, c.rho]));
  const corrLabels = [...new Set(data.correlaciones.map((c) => c.a))];
  const rho = (a: string, b: string) => corr.get(`${a}|${b}`) ?? corr.get(`${b}|${a}`) ?? null;

  const orden = ['commodity', 'indice', 'volatilidad', 'fx'];
  const series = [...data.series].sort((a, b) => orden.indexOf(a.clase) - orden.indexOf(b.clase));

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle
        id="4"
        title="FX & commodities · risk-on / risk-off"
        right={
          <span className="flex items-center gap-2">
            <Tag tone={REG_TONE[data.regimen]}>{data.regimen}</Tag>
            <FreshnessBadge prov={data.prov} now={now} />
          </span>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {series.map((s) => {
          const sent = s.varDiaria == null ? 'neutral' : s.id === 'VIX' ? (s.varDiaria > 0 ? 'neg' : 'pos') : s.varDiaria > 0 ? 'pos' : 'neg';
          return (
            <Panel
              key={s.id}
              onClick={() => abrir({ tipo: 'mercado', symbol: s.id, titulo: s.nombre, sentiment: sent })}
              className="p-2.5 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[10px] text-muted truncate">{s.nombre}</span>
                <Tag>{s.clase}</Tag>
              </div>
              <div className="flex items-end justify-between gap-1">
                <span className="mono text-[15px] tabular-nums">{s.valor != null ? num(s.valor, s.clase === 'fx' ? 2 : 1) : SD}</span>
                <span className={`mono text-[11px] tabular-nums ${sent === 'pos' ? 'text-pos' : sent === 'neg' ? 'text-neg' : 'text-muted'}`}>
                  {s.varDiaria != null ? pct(s.varDiaria, 2, true) : SD}
                </span>
              </div>
              <Sparkline data={s.spark} sentiment={sent} width={150} height={20} />
            </Panel>
          );
        })}
      </div>
      <Panel>
        <SectionTitle id="ρ" title="Matriz de correlación · retornos diarios" />
        <div className="p-2">
          <CorrMatrix labels={corrLabels} rho={rho} />
        </div>
      </Panel>
    </div>
  );
}
