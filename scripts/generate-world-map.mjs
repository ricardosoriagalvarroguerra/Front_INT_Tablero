// Build-time: world-110m TopoJSON → proyección Equal Earth (d3-geo) → paths SVG
// compactos → src/data/worldGeo.ts. d3-geo se usa SOLO aquí; no entra al bundle.
//
//   uso:  npm run gen:map
//
// Fuente: world-atlas (Natural Earth), dominio público. El `id` numérico de cada
// país es su código ISO-3166-1 numérico (= m49), que mapeamos a ISO-3.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geoEqualEarth, geoPath } from 'd3';
import { feature } from 'topojson-client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 900;
const H = 440;

// m49 numérico → ISO-3 (catálogo dim_country; extensible). Sólo estos países
// pueden colorearse por dato; el resto se dibuja como base gris.
const NUM2ISO3 = {
  840: 'USA', 124: 'CAN', 484: 'MEX', 826: 'GBR', 250: 'FRA', 276: 'DEU', 380: 'ITA',
  724: 'ESP', 528: 'NLD', 756: 'CHE', 752: 'SWE', 578: 'NOR', 616: 'POL', 643: 'RUS',
  792: 'TUR', 392: 'JPN', 410: 'KOR', 156: 'CHN', 356: 'IND', 360: 'IDN', 764: 'THA',
  458: 'MYS', 608: 'PHL', 704: 'VNM', 702: 'SGP', 36: 'AUS', 32: 'ARG', 76: 'BRA',
  152: 'CHL', 170: 'COL', 604: 'PER', 858: 'URY', 68: 'BOL', 218: 'ECU', 600: 'PRY',
  862: 'VEN', 710: 'ZAF', 566: 'NGA', 818: 'EGY', 682: 'SAU', 784: 'ARE', 376: 'ISR',
};

const topo = JSON.parse(readFileSync(join(__dirname, 'world-110m.json'), 'utf8'));
const fc = feature(topo, topo.objects.countries);

const projection = geoEqualEarth().fitSize([W, H], fc);
const path = geoPath(projection);

const round = (d) => d.replace(/-?\d+\.\d+/g, (m) => (+m).toFixed(1));

const countries = [];
for (const f of fc.features) {
  const d = path(f);
  if (!d) continue;
  const [cx, cy] = path.centroid(f);
  const iso3 = NUM2ISO3[parseInt(f.id, 10)] ?? null;
  countries.push({
    iso3,
    name: f.properties?.name ?? '',
    d: round(d),
    cx: Number.isFinite(cx) ? +cx.toFixed(1) : 0,
    cy: Number.isFinite(cy) ? +cy.toFixed(1) : 0,
  });
}

const out = `// AUTO-GENERADO por scripts/generate-world-map.mjs · NO editar a mano.
// Geometría mundial (Natural Earth / world-atlas, dominio público) proyectada con
// d3-geo Equal Earth. d3-geo NO entra al bundle: aquí sólo hay strings estáticos.

export interface WorldCountry {
  /** ISO-3 si está en el catálogo (coloreable); null = sólo base. */
  iso3: string | null;
  name: string;
  /** Path SVG ya proyectado. */
  d: string;
  /** Centroide (para etiquetas). */
  cx: number;
  cy: number;
}

export const WORLD_VIEWBOX = { w: ${W}, h: ${H} };

export const WORLD: WorldCountry[] = ${JSON.stringify(countries)};
`;

writeFileSync(join(__dirname, '..', 'src', 'data', 'worldGeo.ts'), out);
const conIso = countries.filter((c) => c.iso3).length;
console.log(`worldGeo.ts: ${countries.length} países (${conIso} con ISO-3 coloreable) · viewBox ${W}×${H}`);
