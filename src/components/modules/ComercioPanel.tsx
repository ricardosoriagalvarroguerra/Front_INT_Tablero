// Vista 6 · Comercio y flujos — balanza/cuenta corriente + principales socios.

import { useState } from 'react';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useFiltros, paisPasa } from '../../lib/filters';
import { useCountries } from '../../lib/useCountries';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { EstadoVacio } from '../primitives/Estado';
import { usd, num, pct, SD } from '../../lib/format';

export function ComercioPanel(_: { now: Date }) {
  const { data, estado } = useView(api.comercio);
  const f = useFiltros();
  const { byIso3 } = useCountries();
  const [sel, setSel] = useState<string | null>(null);

  if (estado !== 'ok' || !data) {
    return (
      <Panel>
        <SectionTitle id="6" title="Comercio y flujos" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }
  const rows = data.filter((r) => {
    const c = byIso3.get(r.iso3);
    return c ? paisPasa(c, f) : true;
  });
  const activo = rows.find((r) => r.iso3 === sel) ?? rows[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Panel className="lg:col-span-2">
        <SectionTitle id="6" title="Comercio · balanza y totales" right={<span>periodo {rows[0]?.periodo ?? SD}</span>} />
        <div className="overflow-auto scrollbar-thin max-h-[68vh]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 surface">
              <tr className="mono text-[9px] uppercase tracking-wider text-subtle">
                <th className="text-left px-2 h-7 border-b border-token">País</th>
                <th className="text-right px-2 border-b border-token">Export</th>
                <th className="text-right px-2 border-b border-token">Import</th>
                <th className="text-right px-2 border-b border-token">Balanza</th>
                <th className="text-right px-2 border-b border-token">CC %PIB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.iso3} className={`row-hover cursor-pointer ${activo?.iso3 === r.iso3 ? 'ring-accent' : ''}`} onClick={() => setSel(r.iso3)}>
                  <td className="px-2 h-7 mono text-[11px] whitespace-nowrap border-b border-token">
                    <span className="text-subtle mr-1.5">{r.iso3}</span>
                    {r.pais}
                  </td>
                  <td className="px-2 text-right mono text-[11px] tabular-nums border-b border-token">{usd(r.exportTotal)}</td>
                  <td className="px-2 text-right mono text-[11px] tabular-nums border-b border-token">{usd(r.importTotal)}</td>
                  <td className="px-2 text-right mono text-[11px] tabular-nums border-b border-token" style={{ color: r.balanza == null ? 'var(--fg-subtle)' : r.balanza >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                    {usd(r.balanza)}
                  </td>
                  <td className="px-2 text-right mono text-[11px] tabular-nums border-b border-token" style={{ color: r.cuentaCorriente == null ? 'var(--fg-subtle)' : r.cuentaCorriente >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                    {r.cuentaCorriente != null ? pct(r.cuentaCorriente, 1, true) : SD}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel>
        <SectionTitle id="▸" title={activo ? `Socios · ${activo.pais}` : 'Socios'} />
        <div className="p-2 flex flex-col">
          {(activo?.sociosTop ?? []).length === 0 && <div className="py-8 text-center mono text-[11px] text-subtle">{SD}</div>}
          {activo?.sociosTop.map((s) => (
            <div key={s.nombre} className="flex items-center gap-2 h-7 px-1 border-b border-token row-hover">
              <span className="mono text-[11px] flex-1 truncate">{s.nombre}</span>
              <div className="w-20 h-2 surface-sunk rounded-[2px] overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.min(100, s.share)}%` }} />
              </div>
              <span className="mono text-[10px] text-muted tabular-nums w-10 text-right">{num(s.share, 1)}%</span>
              <span className="mono text-[10px] text-subtle tabular-nums w-16 text-right">{usd(s.valor)}</span>
            </div>
          ))}
        </div>
        <div className="px-3 h-7 flex items-center mono text-[9px] text-subtle border-t border-token">UN Comtrade · export por socio</div>
      </Panel>
    </div>
  );
}
