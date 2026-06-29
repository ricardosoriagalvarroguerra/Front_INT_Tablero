// Barras horizontales divergentes desde el cero (tasas reales, balanza, score).
// Verde/rojo por sentimiento; etiqueta de valor a la derecha.

interface Item {
  label: string;
  sub?: string;
  valor: number | null;
  sentiment?: 'pos' | 'neg' | 'neutral' | 'accent';
}

interface Props {
  items: Item[];
  unidad?: string;
  fmt?: (v: number) => string;
}

const COLOR = {
  pos: 'var(--pos)',
  neg: 'var(--neg)',
  neutral: 'var(--fg-muted)',
  accent: 'var(--accent)',
};

export function BarsDiverging({ items, unidad = '', fmt = (v) => v.toFixed(1) }: Props) {
  const vals = items.map((i) => i.valor).filter((v): v is number => v != null);
  const maxAbs = Math.max(1, ...vals.map((v) => Math.abs(v)));

  return (
    <div className="flex flex-col">
      {items.map((it, idx) => {
        const v = it.valor;
        const w = v == null ? 0 : (Math.abs(v) / maxAbs) * 50; // % de medio ancho
        const color = COLOR[it.sentiment ?? (v == null ? 'neutral' : v >= 0 ? 'pos' : 'neg')];
        return (
          <div key={idx} className="flex items-center gap-2 h-7 row-hover px-2 border-b border-token">
            <div className="w-28 shrink-0 mono text-[11px] truncate" title={it.label}>
              <span className="text-subtle mr-1">{it.sub}</span>
              {it.label}
            </div>
            <div className="flex-1 relative h-3.5">
              {/* eje cero */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--border-strong)]" />
              {v != null && (
                <div
                  className="absolute top-0 bottom-0 rounded-[2px]"
                  style={{
                    background: color,
                    opacity: 0.85,
                    width: `${w}%`,
                    left: v >= 0 ? '50%' : `${50 - w}%`,
                  }}
                />
              )}
            </div>
            <div className="w-16 shrink-0 text-right mono text-[11px] tabular-nums" style={{ color: v == null ? 'var(--fg-subtle)' : color }}>
              {v == null ? 's/d' : fmt(v) + unidad}
            </div>
          </div>
        );
      })}
    </div>
  );
}
