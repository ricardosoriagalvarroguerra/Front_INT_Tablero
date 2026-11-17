# Tablero Inteligente INT · Global Command Center

Dashboard de **inteligencia económica internacional** — un *command center* tipo
Bloomberg Terminal que consolida, en una sola vista, las señales macro globales,
de riesgo soberano, FX & commodities, flujos comerciales y geopolítica que un
economista usaría a diario, más un **muro de medios en vivo**.

Hereda la estética de **Tablero ARG/BOL** (§7): densidad informativa (Bloomberg),
tipografía y jerarquías (Linear), minimalismo (Vercel), calma visual (Are.na).
Paleta monocromática + acento ámbar, modo claro/oscuro, Inter + JetBrains Mono.
**React 18 + TypeScript + Vite + Tailwind**, gráficos con **D3** tematizado,
backend **Fastify + `pg`**, BDR **PostgreSQL** (`internacional`).

> **Regla de oro: cero datos inventados.** Cada cifra es trazable a su fuente y
> fecha de corte. Si una fuente falla, la UI lo muestra como `s/d` / "fuente
> caída" — nunca se rellena. Ver [`docs/SOURCES.md`](docs/SOURCES.md).

## Stack y decisiones

| Capa | Elección | Por qué |
|---|---|---|
| Frontend | React 18 + Vite + TS + Tailwind | Homogéneo con ARG/BOL |
| Gráficos | **D3** (d3-scale/shape/geo/array) tematizado a los tokens | Un solo motor; cubre choropleth mundial, heatmap, curvas, correlaciones que las primitivas SVG no dan; ya presente en el ADN de ARG (Donut usa d3) |
| Backend | **Fastify 5 + `pg`** (Node/TS) | Idéntico patrón a ARG/BOL (`server/routes` + `repo.ts`) |
| BDR | PostgreSQL `internacional`, esquema **dimensional** | Multipaís: `dim_country` × `dim_indicator` × `fact_*` |
| Ingesta | Conectores Node idempotentes (upsert por clave natural) + `etl_run_log` | Provenance por fila, observabilidad |

## Arquitectura (full-stack)

```
React (src/) ──/api──> Fastify (server/) ──pg──> PostgreSQL (db/ · internacional · vistas v_*)
   D3 charts            conectores (ingesta) ──┘   dim_country · dim_indicator · dim_source
                                                   fact_timeseries · fact_market · fact_geo_events
```

## Arranque

Requiere **PostgreSQL local** corriendo (p. ej. Postgres.app en `:5432`).

```bash
# 0) Credenciales (opcionales) — copiar y editar
cp .env.example .env

# 1) PostgreSQL local → crear base → schema → seed dimensional → ingesta
createdb internacional
psql -d internacional -f db/schema.sql
psql -d internacional -f db/seed.sql           # dim_country, dim_indicator, dim_source
cd server && npm install && npm run ingest     # carga fact_* desde las fuentes vivas
                              # (idempotente; re-ejecutable. Registra en etl_run_log)

# 2) API
npm start                                       # Fastify :5176

# 3) Frontend
cd .. && npm install && npm run dev             # Vite :5182  (proxy /api → :5176)
```

Si el API no responde, el frontend degrada con **estado visible** ("fuente
caída"), nunca con datos inventados. El footer indica origen y frescura por panel.

## Módulos / vistas (§5)

| Vista | Pregunta que responde |
|-------|-----------------------|
| **Resumen** | Tesis del día, semáforo de 9 dimensiones, alertas, mercados, vulnerabilidad |
| **Análisis** | Ciclo global (FMI), inflación, ciclo monetario (BIS), condiciones financieras y curva, dinámica de deuda (r − g, balance estabilizador), posición fiscal/externa, monedas (carry/vol), commodities, ranking de vulnerabilidad, balance de riesgos |
| **Histórico** | País vs país vs agregado FMI, 2015 → 2031 (proyecciones punteadas) + tasa de política y 10A |
| Pulso global | ¿Qué cambió hoy y por qué importa? |
| Heatmap macro | ¿Qué economías están en estrés? (países × indicadores, z-score) |
| Riesgo soberano | Rendimientos, curvas, spreads + scorecard de riesgo país |
| FX & commodities | Variaciones, correlaciones, régimen risk-on/off |
| Inflación y tasas reales | Inflación vs tasa de política → tasa real ex-post |
| Comercio y flujos | Balanza / cuenta corriente y principales socios |
| Conflictos / geopolítica | Intensidad y tono por país (GDELT/ACLED) |
| Foco LatAm | Panel denso dedicado a la región |
| Calendario | Bancos centrales / próximos releases |
| Muro de medios | Bloomberg TV en vivo + grid de canales configurable |

## Atajos de teclado

- `/` — filtrar países · `D` — claro/oscuro · `R` — refrescar · `N` — nota ejecutiva imprimible · `Esc` — cerrar overlays

## Respaldo embebido

Si el API no responde, el tablero usa la última foto **real** de la ingesta
(`src/data/snapshot.json`, chunk aparte que sólo se descarga en ese caso) y el
encabezado avisa «Respaldo al …». Para regenerarla con el API local poblado:

```bash
npm run snapshot                                  # API en :5176
SNAPSHOT_API=https://mi-backend npm run snapshot  # otro backend
```

## Desarrollo

```bash
npm run dev        # http://localhost:5182
npm run build      # type-check + build de producción a dist/
npm run typecheck  # solo verificación de tipos
npm run snapshot   # regenera el respaldo embebido desde el API
```

Fuentes, esquemas verificados en vivo y licencias: [`docs/SOURCES.md`](docs/SOURCES.md).
Guardrails y diseño: [`docs/ANALISIS.md`](docs/ANALISIS.md).
