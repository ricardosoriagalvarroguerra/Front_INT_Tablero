// Placeholder honesto para los paneles cuyo cableado de datos/charts está en
// curso (tarea #6/#7). Renderiza con el design system y declara explícitamente
// el estado, sin simular datos.

import { Panel } from '../primitives/Panel';
import { SectionTitle } from '../primitives/SectionTitle';
import { Tag } from '../primitives/Tag';

export function ModuloEnConstruccion({
  id,
  titulo,
  pregunta,
  fuentes,
}: {
  id: string;
  titulo: string;
  pregunta: string;
  fuentes: string[];
}) {
  return (
    <Panel>
      <SectionTitle id={id} title={titulo} right={<Tag tone="accent">en cableado</Tag>} />
      <div className="p-5 flex flex-col gap-3">
        <p className="text-[13px] text-muted max-w-2xl leading-relaxed">{pregunta}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="mono text-[9px] text-subtle">Fuentes:</span>
          {fuentes.map((f) => (
            <Tag key={f}>{f}</Tag>
          ))}
        </div>
        <div className="mono text-[10px] text-subtle pt-1">
          ◷ esquema, tipos y ruta API definidos · conectando ingesta real (cero datos simulados)
        </div>
      </div>
    </Panel>
  );
}
