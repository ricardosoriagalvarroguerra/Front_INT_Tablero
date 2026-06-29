// Vista 1 · Pulso global — tarjetas con los movimientos más relevantes de hoy.

import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { useSerie, specDePulso } from '../../lib/serie';
import type { PulsoItem } from '../../types';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Tag } from '../primitives/Tag';
import { Sparkline } from '../primitives/Sparkline';
import { FreshnessBadge, EstadoVacio } from '../primitives/Estado';

const CAT_TONE: Record<PulsoItem['categoria'], 'accent' | 'info' | 'neg' | 'neutral'> = {
  macro: 'accent', mercado: 'info', spread: 'info', fx: 'info', commodity: 'info', geopolitica: 'neg',
};

export function PulsoPanel({ now }: { now: Date }) {
  const { data, estado } = useView(api.pulso);
  const { abrir } = useSerie();
  if (estado !== 'ok' || !data) {
    return (
      <Panel>
        <SectionTitle id="1" title="Pulso global · qué cambió hoy" />
        <EstadoVacio estado={estado} />
      </Panel>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle id="1" title="Pulso global · qué cambió hoy" right={<span>{data.length} señales</span>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.map((it) => {
          const cls = it.sentiment === 'pos' ? 'text-pos' : it.sentiment === 'neg' ? 'text-neg' : it.sentiment === 'accent' ? 'text-accent' : 'text-muted';
          const spec = specDePulso(it);
          return (
            <Panel
              key={it.id}
              onClick={spec ? () => abrir(spec) : undefined}
              className="p-3 flex flex-col gap-2 min-h-[120px]"
            >
              <div className="flex items-start justify-between gap-2">
                <Tag tone={CAT_TONE[it.categoria]}>{it.categoria}</Tag>
                <span className={`mono text-[12px] tabular-nums ${cls}`}>{it.deltaLabel}</span>
              </div>
              <div className="text-[13px] font-medium leading-snug">{it.titulo}</div>
              <div className="mono text-[10px] text-muted leading-relaxed flex-1">{it.detalle}</div>
              {it.spark && it.spark.length > 1 && (
                <Sparkline data={it.spark} sentiment={it.sentiment === 'accent' ? 'accent' : it.sentiment} width={150} height={22} />
              )}
              <FreshnessBadge prov={it.prov} now={now} />
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
