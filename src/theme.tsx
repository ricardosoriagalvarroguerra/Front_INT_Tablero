import { createContext, useContext } from 'react';
import type { Theme } from './types';

/**
 * Theme context. Cada raíz SVG keya en este valor para remontar al alternar
 * y que el navegador re-resuelva las CSS custom properties en fresco.
 */
export const ThemeContext = createContext<Theme>('dark');

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
