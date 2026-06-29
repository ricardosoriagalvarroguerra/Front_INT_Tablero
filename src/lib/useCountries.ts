// Catálogo de países cacheado a nivel de módulo (se pide una vez). Provee el
// índice iso3→Country para filtrar/etiquetar en los paneles.

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Country } from '../types';

let cache: Promise<Country[]> | null = null;
function load(): Promise<Country[]> {
  return (cache ??= api.paises());
}

export function useCountries(): { list: Country[]; byIso3: Map<string, Country> } {
  const [list, setList] = useState<Country[]>([]);
  useEffect(() => {
    let alive = true;
    load()
      .then((cs) => alive && setList(cs))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, []);
  return { list, byIso3: new Map(list.map((c) => [c.iso3, c])) };
}
