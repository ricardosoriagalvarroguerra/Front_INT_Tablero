// Donut (d3-shape) — anillo de proporciones. Usa d3.pie + d3.arc para la
// geometría; los colores son CSS custom properties (var(--…)).

import { pie as d3pie, arc as d3arc } from 'd3';
import { useTheme } from '../../theme';

interface DonutDatum {
  v: number;
  color: string;
}

interface DonutProps {
  data: DonutDatum[];
  size?: number;
}

export function Donut({ data, size = 64 }: DonutProps) {
  const theme = useTheme();
  const r = size / 2 - 6;
  const stroke = size / 8;
  const arcs = d3pie<DonutDatum>()
    .value((d) => d.v)
    .sort(null)(data);
  const a = d3arc<(typeof arcs)[number]>()
    .innerRadius(r - stroke)
    .outerRadius(r)
    .padAngle(0.02)
    .cornerRadius(1);

  return (
    <svg key={theme} width={size} height={size} className="block">
      <g transform={`translate(${size / 2},${size / 2})`}>
        {arcs.map((s, i) => (
          <path key={i} d={a(s) ?? undefined} style={{ fill: data[i].color }} />
        ))}
      </g>
    </svg>
  );
}
