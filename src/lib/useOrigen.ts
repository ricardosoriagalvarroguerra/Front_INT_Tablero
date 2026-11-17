import { useSyncExternalStore } from 'react';
import { getOrigen, subscribeOrigen } from './api';

let ultimo = getOrigen();
const snap = () => {
  const o = getOrigen();
  if (o.origen !== ultimo.origen || o.snapshot?.generado !== ultimo.snapshot?.generado) ultimo = o;
  return ultimo;
};

/** Origen de los datos que ve el usuario: API en vivo o respaldo embebido. */
export function useOrigen() {
  return useSyncExternalStore(subscribeOrigen, snap, snap);
}
