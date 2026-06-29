// Choropleth mundial (Equal Earth). Renderiza la geometría real de
// src/data/worldGeo.ts (build-time) y colorea cada país por una función `fill`.
// Países sin dato → base gris. Tooltip flotante al pasar el cursor.

import { useState } from 'react';
import { useTheme } from '../../theme';
import { WORLD, WORLD_VIEWBOX } from '../../data/worldGeo';

interface Props {
  /** Color de relleno por país; null/'' → base gris. */
  fill: (iso3: string | null) => string | null;
  /** Texto de tooltip por país; null → no interactivo. */
  label: (iso3: string | null, name: string) => string | null;
}

// Llena el contenedor padre (que define el tamaño/aspecto). El mapa se centra
// con preserveAspectRatio, así dos tarjetas con el mismo contenedor son idénticas.
export function WorldMap({ fill, label }: Props) {
  const theme = useTheme();
  const [hover, setHover] = useState<{ name: string; txt: string } | null>(null);
  const { w, h } = WORLD_VIEWBOX;

  return (
    <div className="relative w-full h-full">
      <svg
        key={theme}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full h-full"
      >
        {/* océano */}
        <rect x={0} y={0} width={w} height={h} fill="var(--bg)" onMouseEnter={() => setHover(null)} />
        {WORLD.map((c, i) => {
          const f = fill(c.iso3);
          const txt = label(c.iso3, c.name);
          // base (sin dato) toma el relleno de .geo-path; con dato, color de calor inline.
          const style = f
            ? { fill: f, cursor: txt ? 'pointer' : 'default' }
            : { cursor: txt ? 'pointer' : ('default' as const) };
          return (
            <path
              key={i}
              d={c.d}
              className="geo-path"
              style={style}
              onMouseEnter={txt ? () => setHover({ name: c.name, txt }) : undefined}
              onMouseLeave={txt ? () => setHover(null) : undefined}
            />
          );
        })}
      </svg>
      {hover && (
        <div className="absolute top-2 left-2 surface rounded-[4px] px-2.5 py-1 mono text-[10px] pointer-events-none shadow">
          <span className="font-medium">{hover.name}</span>
          <span className="text-muted"> · {hover.txt}</span>
        </div>
      )}
    </div>
  );
}
