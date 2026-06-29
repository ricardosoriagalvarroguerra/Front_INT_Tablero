// Matriz de correlación (retornos diarios). Celdas coloreadas por rho divergente.

import { corrColor, sobre } from './scales';
import { num, SD } from '../../lib/format';

interface Props {
  labels: string[];
  rho: (a: string, b: string) => number | null;
}

export function CorrMatrix({ labels, rho }: Props) {
  return (
    <div className="overflow-auto scrollbar-thin">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="px-1 h-6" />
            {labels.map((l) => (
              <th key={l} className="px-1 h-6 mono text-[9px] text-subtle uppercase">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((a) => (
            <tr key={a}>
              <td className="px-1.5 mono text-[9px] text-muted uppercase whitespace-nowrap text-right">{a}</td>
              {labels.map((b) => {
                const r = rho(a, b);
                const bg = corrColor(r);
                return (
                  <td
                    key={b}
                    title={`${a}·${b}: ${num(r, 2)}`}
                    className="text-center mono text-[9px] tabular-nums"
                    style={{
                      background: r == null ? 'transparent' : bg,
                      color: r == null ? 'var(--fg-subtle)' : bg.startsWith('rgb') ? sobre(bg) : 'var(--fg)',
                      width: 34,
                      height: 24,
                    }}
                  >
                    {r == null ? SD : num(r, 2)}
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
