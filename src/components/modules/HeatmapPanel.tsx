// Vista 2 · Heatmap macro — países × indicadores, color por z-score×polaridad.
// Respeta los filtros globales (región/grupo/búsqueda).

import { useMemo } from 'react';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useFiltros, paisPasa } from '../../lib/filters';
import { useSerie } from '../../lib/serie';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { FreshnessBadge, EstadoVacio } from '../primitives/Estado';
import { Heatmap, type HeatCelda } from '../charts/Heatmap';

export function HeatmapPanel({ now }: { now: Date }) {
  const { data, estado } = useView(api.heatmap);
  const f = useFiltros();
  const { abrir } = useSerie();

  const cellIndex = useMemo(() => {
    const m = new Map<string, HeatCelda>();
    for (const c of data?.celdas ?? []) m.set(`${c.iso3}|${c.indicador}`, c);
    return m;
  }, [data]);

  if (estado !== 'ok' || !data) {
    return (
      <Panel>
        <SectionTitle id="2" title="Heatmap macro global" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }

  const paises = data.paises.filter((p) => paisPasa(p, f)).map((p) => ({ iso3: p.iso3, nombreEs: p.nombreEs }));

  return (
    <Panel>
      <SectionTitle
        id="2"
        title="Heatmap macro · ¿qué economías están en estrés?"
        right={<FreshnessBadge prov={data.prov} now={now} />}
      />
      <div className="p-1">
        <Heatmap
          indicadores={data.indicadores.map((i) => ({ codigo: i.codigo, nombreEs: i.nombreEs, unidad: i.unidad, polaridad: i.polaridad }))}
          paises={paises}
          cell={(iso3, codigo) => cellIndex.get(`${iso3}|${codigo}`)}
          onCell={(iso3, codigo) => abrir({ tipo: 'indicador', iso3, codigo })}
        />
      </div>
      <div className="flex items-center gap-3 px-3 h-7 border-t border-token mono text-[9px] text-subtle">
        <span>color = favorabilidad (z × polaridad)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 inline-block" style={{ background: 'var(--pos)' }} /> favorable</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 inline-block" style={{ background: 'var(--neg)' }} /> estrés</span>
        <span>· {paises.length} países</span>
      </div>
    </Panel>
  );
}
