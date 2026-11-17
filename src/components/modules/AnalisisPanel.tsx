// Pestaña Análisis · la lectura económica del tablero. Todo el contenido sale de
// GET /api/analisis (reglas explícitas sobre datos oficiales; ver
// docs/ANALISIS.md). Índice lateral para saltar entre secciones.

import { useAnalisis } from '../../lib/useAnalisis';
import { Panel } from '../primitives/Panel';
import { EstadoVacio } from '../primitives/Estado';
import { Tesis, Semaforo, ListaAlertas, BalanceRiesgos } from '../analisis/Cabecera';
import { CicloGlobal, InflacionGlobal, CicloMonetario } from '../analisis/Macro';
import { Condiciones, DinamicaDeuda, PosicionExterna, FxEmergente, CommoditiesExpo, Vulnerabilidad } from '../analisis/Financiero';
import { Seccion } from '../analisis/ui';

const INDICE: [string, string][] = [
  ['an-semaforo', 'Semáforo'],
  ['an-alertas', 'Alertas'],
  ['an-ciclo', 'Ciclo global'],
  ['an-inflacion', 'Inflación'],
  ['an-monetario', 'Ciclo monetario'],
  ['an-condiciones', 'Condiciones financieras'],
  ['an-deuda', 'Deuda pública'],
  ['an-externo', 'Fiscal y externo'],
  ['an-fx', 'Monedas'],
  ['an-commodities', 'Commodities'],
  ['an-vulnerabilidad', 'Vulnerabilidad'],
  ['an-riesgos', 'Riesgos'],
];

export function AnalisisPanel({ onGoto, onPais }: { onGoto?: (t: string) => void; onPais?: (iso3: string) => void }) {
  const { data: a, estado } = useAnalisis();
  if (estado !== 'ok' || !a)
    return (
      <Panel>
        <EstadoVacio estado={estado} label="Análisis no disponible (API y respaldo sin datos)" />
      </Panel>
    );
  const ir = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <div className="flex flex-col gap-3">
      <Tesis a={a} />
      <nav className="sticky top-[84px] z-10 surface rounded-[6px] px-2 py-1.5 flex gap-1 overflow-x-auto scrollbar-thin">
        {INDICE.map(([id, t]) => (
          <button key={id} onClick={() => ir(id)} className="px-2 h-6 rounded-[4px] text-[11px] text-muted hover:text-[var(--fg)] hover:bg-[var(--bg-sunk)] whitespace-nowrap">
            {t}
          </button>
        ))}
      </nav>
      <div id="an-semaforo" className="scroll-mt-32">
        <Semaforo a={a} onGoto={onGoto} />
      </div>
      <div id="an-alertas" className="scroll-mt-32">
        <Seccion titulo="Alertas activas" sub="Reglas explícitas con umbrales documentados · clic para ir al detalle" right={`${a.alertas.length} activas`}>
          <ListaAlertas alertas={a.alertas} onGoto={onGoto} />
        </Seccion>
      </div>
      <div id="an-ciclo" className="scroll-mt-32"><CicloGlobal a={a} /></div>
      <div id="an-inflacion" className="scroll-mt-32"><InflacionGlobal a={a} /></div>
      <div id="an-monetario" className="scroll-mt-32"><CicloMonetario a={a} /></div>
      <div id="an-condiciones" className="scroll-mt-32"><Condiciones a={a} /></div>
      <div id="an-deuda" className="scroll-mt-32"><DinamicaDeuda a={a} /></div>
      <div id="an-externo" className="scroll-mt-32"><PosicionExterna a={a} /></div>
      <div className="grid xl:grid-cols-2 gap-3">
        <div id="an-fx" className="scroll-mt-32"><FxEmergente a={a} /></div>
        <div id="an-commodities" className="scroll-mt-32"><CommoditiesExpo a={a} /></div>
      </div>
      <div id="an-vulnerabilidad" className="scroll-mt-32"><Vulnerabilidad a={a} onPais={onPais} /></div>
      <div id="an-riesgos" className="scroll-mt-32"><BalanceRiesgos a={a} /></div>
      <p className="text-[10px] text-subtle px-1">
        Generado {new Date(a.generado).toLocaleString('es', { timeZone: 'UTC' })} UTC. Metodología, umbrales y limitaciones en docs/ANALISIS.md del repositorio.
      </p>
    </div>
  );
}
