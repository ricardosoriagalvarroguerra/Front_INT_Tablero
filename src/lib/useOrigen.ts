import { useSyncExternalStore } from 'react';
import { getOrigen, subscribeOrigen } from './api';

/** Origen de los datos que ve el usuario: API en vivo o respaldo embebido (total o por sección). */
export function useOrigen() {
  return useSyncExternalStore(subscribeOrigen, getOrigen, getOrigen);
}
