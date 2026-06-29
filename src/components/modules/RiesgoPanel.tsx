// Vista 3 · Riesgo soberano — scorecard (macro + mercado + conflicto) + curva.

import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useFiltros, paisPasa } from '../../lib/filters';
import { useCountries } from '../../lib/useCountries';
import { useSerie } from '../../lib/serie';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { EstadoVacio } from '../primitives/Estado';
import { num, bps, SD } from '../../lib/format';

function scoreColor(s: number | null): string {
  if (s == null) return 'var(--fg-subtle)';
  return s >= 66 ? 'var(--neg)' : s >= 40 ? 'var(--accent)' : 'var(--pos)';
}

export function RiesgoPanel(_: { now: Date }) {
  const { data, estado } = useView(api.riesgo);
  const f = useFiltros();
  const { byIso3 } = useCountries();
  const { abrir } = useSerie();

  if (estado !== 'ok' || !data) {
    return (
      <Panel>
        <SectionTitle id="3" title="Riesgo soberano" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }
  const rows = data.filter((r) => {
    const c = byIso3.get(r.iso3);
    return c ? paisPasa(c, f) : true;
  });

  return (
    <Panel>
      <SectionTitle id="3" title="Riesgo soberano · scorecard de estrés" right={<span>score ↑ = mayor riesgo</span>} />
      <div className="overflow-auto scrollbar-thin max-h-[70vh]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 surface">
            <tr className="mono text-[9px] uppercase tracking-wider text-subtle">
              <th className="text-left px-2 h-7 border-b border-token">País</th>
              <th className="text-right px-2 border-b border-token">Score</th>
              <th className="text-right px-2 border-b border-token">Macro</th>
              <th className="text-right px-2 border-b border-token">Conflicto</th>
              <th className="text-right px-2 border-b border-token">10A</th>
              <th className="text-right px-2 border-b border-token">2A</th>
              <th className="text-right px-2 border-b border-token">Pend.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.iso3} className="row-hover">
                <td className="px-2 h-7 mono text-[11px] whitespace-nowrap border-b border-token">
                  <span className="text-subtle mr-1.5">{r.iso3}</span>
                  {r.pais}
                </td>
                <td className="px-2 text-right border-b border-token">
                  <span className="mono text-[12px] font-medium tabular-nums" style={{ color: scoreColor(r.score) }}>
                    {r.score ?? SD}
                  </span>
                </td>
                <td className="px-2 text-right mono text-[10px] text-muted tabular-nums border-b border-token">{r.scoreComponentes?.macro ?? SD}</td>
                <td className="px-2 text-right mono text-[10px] text-muted tabular-nums border-b border-token">{r.scoreComponentes?.conflicto ?? SD}</td>
                <td
                  onClick={r.yield10y != null ? () => abrir({ tipo: 'mercado', symbol: r.iso3 === 'USA' ? 'UST10Y' : `${r.iso3}_GB10Y`, titulo: `${r.pais} · rendimiento 10A` }) : undefined}
                  className={`px-2 text-right mono text-[10px] tabular-nums border-b border-token ${r.yield10y != null ? 'cursor-pointer hover:text-accent' : ''}`}
                >
                  {r.yield10y != null ? num(r.yield10y, 2) : SD}
                </td>
                <td className="px-2 text-right mono text-[10px] tabular-nums border-b border-token">{r.yield2y != null ? num(r.yield2y, 2) : SD}</td>
                <td className="px-2 text-right mono text-[10px] tabular-nums border-b border-token">{r.pendiente != null ? bps(r.pendiente) : SD}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-1.5 flex items-center mono text-[9px] text-subtle border-t border-token leading-relaxed">
        Yields 10A: EE.UU. (FRED) + zona euro (ECB, spread vs Bund) · score = macro (IMF/WB) + mercado (spread) + conflicto (GDELT)
      </div>
    </Panel>
  );
}
