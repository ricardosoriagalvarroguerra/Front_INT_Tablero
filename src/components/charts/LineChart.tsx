// Línea/área multi-serie con ejes mínimos (d3-scale). Sirve para series
// temporales (FX, yields) y curvas (soberana 2A/10A). x numérico (índice o ms).

import { useTheme } from '../../theme';
import { scaleLinear, line as d3line } from 'd3';

export interface Punto {
  x: number;
  y: number;
}
export interface Serie {
  id: string;
  label?: string;
  color: string; // var(--…) o hex
  puntos: Punto[];
}

interface Props {
  series: Serie[];
  width?: number;
  height?: number;
  xLabels?: string[]; // etiquetas para ticks del eje x (opcional)
  yUnit?: string;
}

export function LineChart({ series, width = 520, height = 200, xLabels, yUnit = '' }: Props) {
  const theme = useTheme();
  const pad = { t: 10, r: 12, b: 18, l: 36 };
  const all = series.flatMap((s) => s.puntos);
  if (!all.length) return <div className="py-8 text-center mono text-[11px] text-subtle">sin serie</div>;

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const x = scaleLinear().domain([xmin, xmax || 1]).range([pad.l, width - pad.r]);
  const y = scaleLinear().domain([ymin, ymax]).nice().range([height - pad.b, pad.t]);
  const gen = d3line<Punto>().x((p) => x(p.x)).y((p) => y(p.y));
  const yTicks = y.ticks(4);

  return (
    <svg key={theme} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
          <text x={pad.l - 4} y={y(t)} textAnchor="end" dominantBaseline="middle" className="mono" fontSize="8" fill="var(--fg-subtle)">
            {t}
            {yUnit}
          </text>
        </g>
      ))}
      {xLabels &&
        xLabels.map((lab, i) => {
          const xv = xmin + ((xmax - xmin) * i) / Math.max(1, xLabels.length - 1);
          return (
            <text key={i} x={x(xv)} y={height - 4} textAnchor="middle" className="mono" fontSize="8" fill="var(--fg-subtle)">
              {lab}
            </text>
          );
        })}
      {series.map((s) => (
        <g key={s.id}>
          <path d={gen(s.puntos) ?? undefined} fill="none" stroke={s.color} strokeWidth="1.5" />
          {s.puntos.length <= 6 &&
            s.puntos.map((p, i) => <circle key={i} cx={x(p.x)} cy={y(p.y)} r="2" fill={s.color} />)}
        </g>
      ))}
    </svg>
  );
}
