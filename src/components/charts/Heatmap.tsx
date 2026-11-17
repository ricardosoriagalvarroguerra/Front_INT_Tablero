// Heatmap macro: matriz países × indicadores, coloreada por favorabilidad
// (z-score × polaridad). Primera columna y cabecera fijas; celdas con valor y
// tooltip de z. s/d cuando falta el dato.

import { heatColor, sobre, type Polaridad } from './scales';
import { num, SD } from '../../lib/format';

export interface HeatInd {
  codigo: string;
  nombreEs: string;
  unidad: string;
  polaridad: Polaridad;
}
export interface HeatPais {
  iso3: string;
  nombreEs: string;
}
export interface HeatCelda {
  valor: number | null;
  z: number | null;
  asof: string | null;
}

interface Props {
  indicadores: HeatInd[];
  paises: HeatPais[];
  cell: (iso3: string, codigo: string) => HeatCelda | undefined;
  onCell?: (iso3: string, codigo: string) => void;
}

const ABBR: Record<string, string> = {
  gdp_growth: 'Crec.',
  cpi_yoy: 'Inflac.',
  unemployment: 'Desemp.',
  policy_rate: 'T. polít.',
  debt_gdp: 'Deuda',
  fiscal_balance: 'B. fiscal',
  current_account: 'C. cte.',
};

export function Heatmap({ indicadores, paises, cell, onCell }: Props) {
  return (
    <div className="overflow-auto scrollbar-thin max-h-[70vh]">
      <table className="border-collapse w-full">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 surface text-left px-2 h-8 mono text-[10px] text-subtle border-b border-r border-token">
              País
            </th>
            {indicadores.map((ind) => (
              <th
                key={ind.codigo}
                title={`${ind.nombreEs} (${ind.unidad})`}
                className="surface px-2 h-8 mono text-[10px] text-muted border-b border-token whitespace-nowrap"
              >
                {ABBR[ind.codigo] ?? ind.codigo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paises.map((p) => (
            <tr key={p.iso3} className="row-hover">
              <td className="sticky left-0 z-10 surface px-2 h-7 mono text-[11px] border-r border-token whitespace-nowrap">
                <span className="text-subtle mr-1.5">{p.iso3}</span>
                {p.nombreEs}
              </td>
              {indicadores.map((ind) => {
                const c = cell(p.iso3, ind.codigo);
                const bg = heatColor(c?.z ?? null, ind.polaridad);
                const has = c && c.valor != null;
                const clickable = has && onCell;
                return (
                  <td
                    key={ind.codigo}
                    onClick={clickable ? () => onCell!(p.iso3, ind.codigo) : undefined}
                    title={
                      has
                        ? `${p.nombreEs} · ${ind.nombreEs}: ${num(c!.valor, 1)} ${ind.unidad} · z=${num(c!.z, 2)} · ${c!.asof ?? ''}`
                        : `${p.nombreEs} · ${ind.nombreEs}: sin dato`
                    }
                    className={`text-center mono text-[10px] tabular-nums border-b border-token ${clickable ? 'cursor-pointer' : ''}`}
                    style={{
                      background: has ? bg : 'transparent',
                      color: has && bg.startsWith('rgb') ? sobre(bg) : 'var(--fg-subtle)',
                      minWidth: 56,
                    }}
                  >
                    {has ? num(c!.valor, 1) : SD}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
