// Gráfico de series temporales con proyecciones marcadas y cursor.
// x = número (año o ms). Los tramos con `proy` se dibujan punteados y la zona
// de proyección lleva una banda tenue. Al pasar el mouse muestra los valores
// de todas las series en el x más cercano.

import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear, line as d3line } from 'd3';
import { useTheme } from '../../theme';

export interface TPunto {
  x: number;
  y: number | null;
  proy?: boolean;
}
export interface TSerie {
  id: string;
  label: string;
  color: string;
  puntos: TPunto[];
  ancho?: number;
}

interface Props {
  series: TSerie[];
  height?: number;
  /** x desde el cual todo es proyección (banda sombreada). */
  proyDesde?: number;
  /** formateo del eje x y del cursor */
  fmtX?: (x: number) => string;
  fmtY?: (y: number) => string;
  /** línea de referencia horizontal (p.ej. 0) */
  ref0?: boolean;
  xTicks?: number;
}

export function TimeChart({ series, height = 200, proyDesde, fmtX = (x) => String(x), fmtY = (y) => y.toLocaleString('es', { maximumFractionDigits: 1 }), ref0 = true, xTicks = 6 }: Props) {
  const theme = useTheme();
  // Ancho real del contenedor → el SVG se dibuja 1:1 (texto legible en cualquier pantalla).
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = { t: 10, r: 10, b: 20, l: 34 };
  const ref = useRef<SVGSVGElement>(null);
  const [hx, setHx] = useState<number | null>(null);

  const all = series.flatMap((s) => s.puntos.filter((p) => p.y != null)) as { x: number; y: number }[];
  const xsUnicos = useMemo(() => [...new Set(series.flatMap((s) => s.puntos.map((p) => p.x)))].sort((a, b) => a - b), [series]);
  if (!all.length) return <div ref={box} className="py-8 text-center text-[11px] text-subtle">Sin datos</div>;

  const xmin = Math.min(...all.map((p) => p.x)), xmax = Math.max(...all.map((p) => p.x));
  let ymin = Math.min(...all.map((p) => p.y)), ymax = Math.max(...all.map((p) => p.y));
  if (ref0) { ymin = Math.min(ymin, 0); ymax = Math.max(ymax, 0); }
  const x = scaleLinear().domain([xmin, xmax === xmin ? xmin + 1 : xmax]).range([pad.l, W - pad.r]);
  const y = scaleLinear().domain([ymin, ymax === ymin ? ymin + 1 : ymax]).nice().range([height - pad.b, pad.t]);
  const gen = d3line<{ x: number; y: number }>().x((p) => x(p.x)).y((p) => y(p.y));

  // separa cada serie en tramos observados y proyectados (con unión continua)
  const tramos = (pts: TPunto[]) => {
    const v = pts.filter((p) => p.y != null) as { x: number; y: number; proy?: boolean }[];
    const obs = v.filter((p) => !p.proy);
    const firstP = v.findIndex((p) => p.proy);
    const proy = firstP < 0 ? [] : v.slice(Math.max(0, firstP - 1));
    return { obs, proy };
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const xv = x.invert(px);
    let best = xsUnicos[0];
    for (const c of xsUnicos) if (Math.abs(c - xv) < Math.abs(best - xv)) best = c;
    setHx(best);
  };

  const ticksX = x.ticks(Math.min(xTicks, Math.max(2, Math.floor(W / 90))));
  const valsHover = hx == null ? [] : series.map((s) => ({ s, p: s.puntos.find((p) => p.x === hx) })).filter((v) => v.p && v.p.y != null);

  return (
    <div ref={box} className="relative">
      <svg key={theme} ref={ref} width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="block" onMouseMove={onMove} onMouseLeave={() => setHx(null)}>
        {proyDesde != null && proyDesde <= xmax && (
          <rect x={x(Math.max(proyDesde, xmin))} y={pad.t} width={x(xmax) - x(Math.max(proyDesde, xmin))} height={height - pad.t - pad.b} fill="var(--fg)" opacity="0.035" />
        )}
        {y.ticks(4).map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={t === 0 && ref0 ? 1.2 : 0.6} vectorEffect="non-scaling-stroke" />
            <text x={pad.l - 5} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="var(--fg-subtle)">{fmtY(t)}</text>
          </g>
        ))}
        {ticksX.map((t, i) => (
          <text key={i} x={x(t)} y={height - 5} textAnchor="middle" fontSize="9" fill="var(--fg-subtle)">{fmtX(t)}</text>
        ))}
        {series.map((s) => {
          const { obs, proy } = tramos(s.puntos);
          return (
            <g key={s.id}>
              {obs.length > 1 && <path d={gen(obs) ?? undefined} fill="none" stroke={s.color} strokeWidth={s.ancho ?? 1.6} vectorEffect="non-scaling-stroke" />}
              {proy.length > 1 && <path d={gen(proy) ?? undefined} fill="none" stroke={s.color} strokeWidth={s.ancho ?? 1.6} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
            </g>
          );
        })}
        {hx != null && <line x1={x(hx)} x2={x(hx)} y1={pad.t} y2={height - pad.b} stroke="var(--fg-muted)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hx != null && valsHover.length > 0 && (
        <div
          className="absolute top-1 pointer-events-none surface rounded-[4px] px-2 py-1 text-[10px] shadow-sm"
          style={{ left: `${(x(hx) / W) * 100 > 60 ? 4 : 62}%` }}
        >
          <div className="text-subtle mb-0.5">{fmtX(hx)}{valsHover.some((v) => v.p!.proy) ? ' · proyección' : ''}</div>
          {valsHover.map(({ s, p }) => (
            <div key={s.id} className="flex items-center gap-1.5 tabular-nums">
              <span className="w-2 h-[2px]" style={{ background: s.color }} />
              <span className="text-muted">{s.label}</span>
              <span className="ml-auto pl-2">{fmtY(p!.y!)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Leyenda compacta para TimeChart. */
export function Leyenda({ items }: { items: { label: string; color: string; punteado?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="w-3 h-0 border-t-2" style={{ borderColor: i.color, borderStyle: i.punteado ? 'dashed' : 'solid' }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
