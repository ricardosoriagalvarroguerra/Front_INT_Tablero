// Vista 5 · Inflación y tasas reales — inflación vs tasa de política → real.

import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useFiltros, paisPasa } from '../../lib/filters';
import { useCountries } from '../../lib/useCountries';
import { useSerie } from '../../lib/serie';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { EstadoVacio } from '../primitives/Estado';
import { num, SD } from '../../lib/format';

export function TasasPanel(_: { now: Date }) {
  const { data, estado } = useView(api.tasasReales);
  const f = useFiltros();
  const { byIso3 } = useCountries();
  const { abrir } = useSerie();

  if (estado !== 'ok' || !data) {
    return (
      <Panel>
        <SectionTitle id="5" title="Inflación y tasas reales" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }
  const rows = data.filter((r) => {
    const c = byIso3.get(r.iso3);
    return c ? paisPasa(c, f) : true;
  });
  const conReal = rows.filter((r) => r.tasaReal != null).length;

  return (
    <Panel>
      <SectionTitle id="5" title="Inflación y tasas reales · ex-post" right={<span>{conReal} con tasa real</span>} />
      <div className="overflow-auto scrollbar-thin max-h-[70vh]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 surface">
            <tr className="mono text-[9px] text-subtle">
              <th className="text-left px-2 h-7 border-b border-token">País</th>
              <th className="text-right px-2 border-b border-token">Inflación i/a</th>
              <th className="text-right px-2 border-b border-token">Tasa política</th>
              <th className="text-right px-2 border-b border-token">Tasa real</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.iso3} className="row-hover">
                <td className="px-2 h-7 mono text-[11px] whitespace-nowrap border-b border-token">
                  <span className="text-subtle mr-1.5">{r.iso3}</span>
                  {r.pais}
                </td>
                <td
                  onClick={r.inflacion != null ? () => abrir({ tipo: 'indicador', iso3: r.iso3, codigo: 'cpi_yoy' }) : undefined}
                  className={`px-2 text-right mono text-[11px] tabular-nums border-b border-token ${r.inflacion != null ? 'cursor-pointer hover:text-accent' : ''}`}
                >
                  {r.inflacion != null ? num(r.inflacion, 1) : SD}
                </td>
                <td
                  onClick={r.tasaPolitica != null ? () => abrir({ tipo: 'indicador', iso3: r.iso3, codigo: 'policy_rate' }) : undefined}
                  className={`px-2 text-right mono text-[11px] tabular-nums border-b border-token ${r.tasaPolitica != null ? 'cursor-pointer hover:text-accent' : ''}`}
                >
                  {r.tasaPolitica != null ? num(r.tasaPolitica, 2) : SD}
                </td>
                <td className="px-2 text-right mono text-[11px] tabular-nums border-b border-token" style={{ color: r.tasaReal == null ? 'var(--fg-subtle)' : r.tasaReal >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                  {r.tasaReal != null ? num(r.tasaReal, 2) : SD}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 h-7 flex items-center mono text-[9px] text-subtle border-t border-token">
        tasa real = tasa de política − inflación i/a · tasa de política requiere FRED/OECD → s/d cuando falta
      </div>
    </Panel>
  );
}
