// Genera el respaldo embebido (src/data/snapshot.json) a partir del API.
// Congela la última foto REAL de la ingesta para que el tablero siga mostrando
// datos con su fecha de corte si el backend no responde. No inventa nada: copia
// respuestas del API tal cual.
//   uso:  npm run snapshot                       (API local en :5176)
//         SNAPSHOT_API=https://… npm run snapshot (otro backend)

import { writeFile } from 'node:fs/promises';

const API = process.env.SNAPSHOT_API ?? 'http://localhost:5176';
const RUTAS = [
  '/api/paises', '/api/pulso', '/api/heatmap-macro', '/api/riesgo-soberano', '/api/fx-commodities',
  '/api/tasas-reales', '/api/comercio', '/api/conflictos', '/api/conflictos/eventos', '/api/calendario',
  '/api/fuentes', '/api/analisis', '/api/alertas', '/api/agregados',
];

const get = async (p) => {
  const r = await fetch(API + p);
  if (!r.ok) throw new Error(`${p} → ${r.status}`);
  return r.json();
};

const rutas = {};
for (const p of RUTAS) rutas[p] = await get(p);
for (const c of rutas['/api/paises']) {
  try {
    rutas[`/api/historico/${c.iso3}`] = await get(`/api/historico/${c.iso3}`);
  } catch {
    /* país sin histórico: se omite */
  }
}
const out = { generado: new Date().toISOString(), api: API.replace(/\/\/.*@/, '//'), rutas };
const json = JSON.stringify(out);
await writeFile(new URL('../src/data/snapshot.json', import.meta.url), json);
console.log(`snapshot: ${Object.keys(rutas).length} rutas · ${(json.length / 1024).toFixed(0)} KB`);
