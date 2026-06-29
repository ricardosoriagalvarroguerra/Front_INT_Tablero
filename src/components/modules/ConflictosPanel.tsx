// Vista 7 · Tracker de conflictos / geopolítica — choropleth mundial (intensidad
// GDELT) + ranking por intensidad/tono + eventos. Si GDELT está saturado,
// degrada a s/d honesto.

import { interpolateYlOrRd } from 'd3';
import { api } from '../../lib/api';
import { useView } from '../../lib/useView';
import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Sparkline } from '../primitives/Sparkline';
import { EstadoVacio } from '../primitives/Estado';
import { WorldMap } from '../charts/WorldMap';
import { num, fechaCorta, SD } from '../../lib/format';

export function ConflictosPanel(_: { now: Date }) {
  const ranking = useView(api.conflictos);
  const eventos = useView(api.eventos);

  if (ranking.estado !== 'ok' || !ranking.data) {
    return (
      <Panel>
        <SectionTitle id="7" title="Tracker de conflictos / geopolítica" />
        <EstadoVacio estado={ranking.estado} label="GDELT saturado o sin datos · s/d" />
      </Panel>
    );
  }
  const rows = ranking.data;
  const byIso = new Map(rows.map((r) => [r.iso3, r]));
  const maxInt = Math.max(1, ...rows.map((r) => r.intensidad ?? 0));
  const logMax = Math.log1p(maxInt);

  const fill = (iso3: string | null): string | null => {
    const r = iso3 ? byIso.get(iso3) : undefined;
    if (!r || r.intensidad == null) return null;
    const t = logMax > 0 ? Math.log1p(r.intensidad) / logMax : 0;
    return interpolateYlOrRd(0.15 + 0.85 * t); // amarillo→rojo (intensidad)
  };
  const label = (iso3: string | null): string | null => {
    const r = iso3 ? byIso.get(iso3) : undefined;
    if (!r || r.intensidad == null) return null;
    return `intensidad ${Math.round(r.intensidad)} · tono ${r.tono != null ? num(r.tono, 1) : SD}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <Panel>
        <SectionTitle
          id="7"
          title="Mapa de intensidad de conflicto · GDELT"
          right={<span>{rows.length} países con dato</span>}
        />
        <div className="p-2">
          <div className="w-full aspect-[900/440]">
            <WorldMap fill={fill} label={label} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 h-7 border-t border-token mono text-[9px] text-subtle">
          <span>intensidad = volumen de cobertura (escala log)</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 inline-block" style={{ background: interpolateYlOrRd(0.2) }} /> bajo
            <span className="w-3 h-2 inline-block ml-1" style={{ background: interpolateYlOrRd(0.6) }} />
            <span className="w-3 h-2 inline-block" style={{ background: interpolateYlOrRd(0.95) }} /> alto
          </span>
          <span>· gris = sin dato GDELT</span>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel>
          <SectionTitle id="▸" title="Intensidad · ranking" right={<span>tono &lt; 0 = tensión</span>} />
          <div className="overflow-auto scrollbar-thin max-h-[52vh]">
            {rows.length === 0 && <EstadoVacio estado="ok" label="sin eventos" />}
            {rows.map((r) => (
              <div key={r.iso3} className="flex items-center gap-2 h-9 px-2 border-b border-token row-hover">
                <span className="mono text-[11px] w-32 truncate"><span className="text-subtle mr-1">{r.iso3}</span>{r.pais}</span>
                <div className="flex-1 h-2.5 surface-sunk rounded-[2px] overflow-hidden">
                  <div className="h-full" style={{ width: `${((r.intensidad ?? 0) / maxInt) * 100}%`, background: 'var(--accent)' }} />
                </div>
                <span className="mono text-[10px] tabular-nums w-12 text-right text-muted">{r.intensidad != null ? Math.round(r.intensidad) : SD}</span>
                <span className="mono text-[10px] tabular-nums w-12 text-right" style={{ color: (r.tono ?? 0) < 0 ? 'var(--neg)' : 'var(--pos)' }}>
                  {r.tono != null ? num(r.tono, 1) : SD}
                </span>
                {r.tendencia.length > 1 && <Sparkline data={r.tendencia} sentiment="accent" width={50} height={18} />}
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle id="▸" title="Eventos recientes" right={<span>{eventos.data?.length ?? 0}</span>} />
          <div className="overflow-auto scrollbar-thin max-h-[52vh]">
            {(eventos.estado !== 'ok' || !eventos.data?.length) && <EstadoVacio estado={eventos.estado} label="sin eventos" />}
            {eventos.data?.map((e, i) => (
              <div key={i} className="flex items-center gap-2 h-8 px-2 border-b border-token row-hover">
                <span className="mono text-[9px] text-subtle w-12">{fechaCorta(e.fecha)}</span>
                <span className="mono text-[11px] flex-1 truncate"><span className="text-subtle mr-1">{e.iso3}</span>{e.pais}</span>
                <span className="mono text-[9px] text-muted">{e.tipo}</span>
                <span className="mono text-[10px] tabular-nums w-10 text-right" style={{ color: (e.tono ?? 0) < 0 ? 'var(--neg)' : 'var(--pos)' }}>{e.tono != null ? num(e.tono, 1) : SD}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
