// Filtros globales del tablero (región/grupo + búsqueda por país).
// Viven en contexto para que cada panel se suscriba y reaccione.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Region, Grupo } from '../types';

export interface Filtros {
  region: Region | 'todas';
  grupo: Grupo | 'todos';
  query: string;
}

export interface FiltrosCtx extends Filtros {
  set: <K extends keyof Filtros>(k: K, v: Filtros[K]) => void;
  reset: () => void;
}

const DEFAULTS: Filtros = { region: 'todas', grupo: 'todos', query: '' };

const Ctx = createContext<FiltrosCtx | null>(null);

export function FiltrosProvider({ children }: { children: ReactNode }) {
  const [f, setF] = useState<Filtros>(DEFAULTS);
  const value = useMemo<FiltrosCtx>(
    () => ({
      ...f,
      set: (k, v) => setF((prev) => ({ ...prev, [k]: v })),
      reset: () => setF(DEFAULTS),
    }),
    [f],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFiltros(): FiltrosCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFiltros fuera de FiltrosProvider');
  return v;
}

/** ¿Un país pasa los filtros activos (región/grupo/búsqueda)? */
export function paisPasa(
  c: { iso3: string; nombreEs: string; region: Region; grupos: Grupo[] },
  f: Filtros,
): boolean {
  if (f.region !== 'todas' && c.region !== f.region) return false;
  if (f.grupo !== 'todos' && !c.grupos.includes(f.grupo)) return false;
  if (f.query) {
    const q = f.query.toLowerCase();
    if (!c.nombreEs.toLowerCase().includes(q) && !c.iso3.toLowerCase().includes(q)) return false;
  }
  return true;
}
