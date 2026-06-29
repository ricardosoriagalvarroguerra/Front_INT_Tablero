import { useFiltros } from '../lib/filters';
import type { Region, Grupo } from '../types';

const REGIONES: (Region | 'todas')[] = [
  'todas',
  'LatAm',
  'Norteamérica',
  'Europa',
  'Asia',
  'África',
  'Oceanía',
  'Medio Oriente',
];
const GRUPOS: (Grupo | 'todos')[] = ['todos', 'G7', 'G20', 'EM', 'avanzada', 'LatAm'];

function Segment<T extends string>({
  value,
  options,
  onPick,
  label,
}: {
  value: T;
  options: readonly T[];
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mono text-[9px] uppercase tracking-wider text-subtle">{label}</span>
      <div className="flex items-center surface-sunk rounded-[4px] p-0.5 gap-0.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`mono text-[10px] px-1.5 py-0.5 rounded-[3px] transition-colors ${
              value === o ? 'bg-accent text-[#0a0a0b]' : 'text-muted hover:text-[var(--fg)]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FilterBar() {
  const f = useFiltros();
  return (
    <div className="flex items-center gap-4 flex-wrap px-3 sm:px-4 h-10 border-b border-token surface-sunk scrollbar-thin overflow-x-auto">
      <Segment label="Región" value={f.region} options={REGIONES} onPick={(v) => f.set('region', v)} />
      <Segment label="Grupo" value={f.grupo} options={GRUPOS} onPick={(v) => f.set('grupo', v)} />
      {(f.region !== 'todas' || f.grupo !== 'todos' || f.query) && (
        <button
          onClick={f.reset}
          className="mono text-[9px] uppercase tracking-wider text-subtle hover:text-accent ml-auto"
        >
          ✕ limpiar filtros
        </button>
      )}
    </div>
  );
}
