// Vista 8 · Foco LatAm — panel denso de la región: heatmap macro + tasas reales
// + ranking de conflicto, todo acotado a América Latina.

import { useMemo } from 'react';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useCountries } from '../../lib/useCountries';
import { useSerie } from '../../lib/serie';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { EstadoVacio } from '../primitives/Estado';
import { Heatmap, type HeatCelda } from '../charts/Heatmap';
import { num, SD } from '../../lib/format';

export function LatamPanel(_: { now: Date }) {
  const heat = useView(api.heatmap);
  const tasas = useView(api.tasasReales);
  const { byIso3 } = useCountries();
  const { abrir } = useSerie();

  const esLatam = (iso3: string) => byIso3.get(iso3)?.region === 'LatAm';

  const cellIndex = useMemo(() => {
    const m = new Map<string, HeatCelda>();
    for (const c of heat.data?.celdas ?? []) m.set(`${c.iso3}|${c.indicador}`, c);
    return m;
  }, [heat.data]);

  if (heat.estado !== 'ok' || !heat.data) {
    return (
      <Panel>
        <SectionTitle id="8" title="Foco LatAm" />
        <EstadoVacio estado={heat.estado} />
      </Panel>
    );
  }

  const paises = heat.data.paises.filter((p) => p.region === 'LatAm').map((p) => ({ iso3: p.iso3, nombreEs: p.nombreEs }));
  const tasasLatam = (tasas.data ?? []).filter((t) => esLatam(t.iso3));

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle id="8" title="Foco LatAm · América Latina" right={<span>{paises.length} economías</span>} />
      <Panel>
        <SectionTitle id="2·LatAm" title="Heatmap macro regional" />
        <div className="p-1">
          <Heatmap
            indicadores={heat.data.indicadores.map((i) => ({ codigo: i.codigo, nombreEs: i.nombreEs, unidad: i.unidad, polaridad: i.polaridad }))}
            paises={paises}
            cell={(iso3, codigo) => cellIndex.get(`${iso3}|${codigo}`)}
            onCell={(iso3, codigo) => abrir({ tipo: 'indicador', iso3, codigo })}
          />
        </div>
      </Panel>
      <Panel>
        <SectionTitle id="5·LatAm" title="Tasas reales regionales" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
          {tasasLatam.length === 0 && <div className="col-span-full"><EstadoVacio estado={tasas.estado} /></div>}
          {tasasLatam.map((t) => (
            <div key={t.iso3} className="surface-sunk rounded-[4px] p-2 flex flex-col gap-1">
              <span className="mono text-[10px] text-muted">{t.pais}</span>
              <div className="flex items-baseline justify-between">
                <span className="mono text-[9px] text-subtle">real</span>
                <span className="mono text-[14px] tabular-nums" style={{ color: t.tasaReal == null ? 'var(--fg-subtle)' : t.tasaReal >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                  {t.tasaReal != null ? num(t.tasaReal, 1) : SD}
                </span>
              </div>
              <div className="flex items-baseline justify-between mono text-[9px] text-subtle">
                <span>infl {t.inflacion != null ? num(t.inflacion, 1) : SD}</span>
                <span>tpm {t.tasaPolitica != null ? num(t.tasaPolitica, 1) : SD}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
