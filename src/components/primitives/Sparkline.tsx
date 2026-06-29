import { useTheme } from '../../theme';
import type { Sentiment } from '../../types';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  sentiment?: Sentiment;
  filled?: boolean;
}

export function Sparkline({
  data,
  width = 110,
  height = 24,
  sentiment = 'neutral',
  filled = true,
}: SparklineProps) {
  const theme = useTheme();
  if (!data || !data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);
  const pts = data.map(
    (v, i) => [i * stepX, height - ((v - min) / range) * (height - 2) - 1] as const,
  );
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L ${width} ${height} L 0 ${height} Z`;
  const color =
    sentiment === 'pos'
      ? 'var(--pos)'
      : sentiment === 'neg'
        ? 'var(--neg)'
        : sentiment === 'accent'
          ? 'var(--accent)'
          : 'var(--fg-muted)';

  return (
    <svg key={theme} width={width} height={height} className="block" style={{ overflow: 'visible' }}>
      {filled && <path d={area} opacity="0.08" style={{ fill: color }} />}
      <path d={d} strokeWidth="1" style={{ fill: 'none', stroke: color }} />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="1.6"
        style={{ fill: color }}
      />
    </svg>
  );
}
