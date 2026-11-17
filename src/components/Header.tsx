import type { RefObject } from 'react';
import type { Theme } from '../types';
import { useOrigen } from '../lib/useOrigen';
import { useAnalisis } from '../lib/useAnalisis';

export interface ClockParts {
  date: string;
  time: string;
  tz: string;
}

export function formatNow(d: Date): ClockParts {
  const dd = d.toLocaleDateString('es', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  const hh = d.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
  return { date: dd.replace('.', '').toUpperCase(), time: hh, tz: 'UTC' };
}

interface HeaderProps {
  theme: Theme;
  setTheme: (t: Theme | ((prev: Theme) => Theme)) => void;
  refreshing: boolean;
  onRefresh: () => void;
  searchRef: RefObject<HTMLInputElement>;
  query: string;
  setQuery: (q: string) => void;
  now: Date;
  onNota: () => void;
  onAlertas: () => void;
}

/** Aviso de origen: API en vivo o respaldo embebido con su fecha de corte. */
function OrigenBadge() {
 const { origen, snapshot, rutasRespaldo } = useOrigen();
  if (origen !== 'respaldo') return null;
  const f = snapshot ? new Date(snapshot.generado).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : 's/d';
  return (
    <span title={`${rutasRespaldo} sección(es) muestran la última foto real de la ingesta embebida en el tablero: el API no responde o todavía está cargando sus datos. Se reintenta solo.`} className="hidden md:flex items-center gap-1.5 px-2 h-8 rounded-[4px] text-[11px]" style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      Respaldo al {f}
    </span>
  );
}

function AlertasBadge({ onClick }: { onClick: () => void }) {
  const { data } = useAnalisis();
  const xs = data?.alertas ?? [];
  const altas = xs.filter((a) => a.nivel === 'alta').length;
  const medias = xs.filter((a) => a.nivel === 'media').length;
  if (!xs.length) return null;
  return (
    <button onClick={onClick} title="Alertas activas (ver Análisis)" className="flex items-center gap-1.5 px-2 h-8 surface-sunk rounded-[4px] text-[11px] hover:ring-accent">
      {altas > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neg)' }} />{altas}</span>}
      {medias > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent" />{medias}</span>}
      <span className="hidden md:inline text-muted">alertas</span>
    </button>
  );
}

export function Header({
  theme,
  setTheme,
  refreshing,
  onRefresh,
  searchRef,
  query,
  setQuery,
  now,
  onNota,
  onAlertas,
}: HeaderProps) {
  const t = formatNow(now);
  return (
    <header
      className="sticky top-0 z-30 surface border-l-0 border-r-0 border-t-0"
      style={{ borderBottomColor: 'var(--border-strong)' }}
    >
      <div className="flex items-stretch h-12 px-3 sm:px-4 gap-2 sm:gap-4">
        {/* brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 pr-2 sm:pr-4 sm:border-r border-token shrink-0">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent pulse-dot" />
          </div>
          <div className="text-[13px] font-semibold whitespace-nowrap">Tablero INT</div>
          <span className="hidden lg:inline text-[10px] text-subtle">Economía internacional · v0.9</span>
        </div>

        {/* search */}
        <div className="flex-1 flex items-center min-w-0 max-w-[640px]">
          <div className="surface-sunk rounded-[4px] flex items-center gap-2 px-2.5 h-8 w-full">
            <span className="mono text-[10px] text-subtle shrink-0">⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar países…"
              className="flex-1 min-w-0 bg-transparent outline-none mono text-[12px] placeholder:text-subtle"
            />
            <span className="kbd hidden sm:inline">/</span>
          </div>
        </div>

        {/* actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          <OrigenBadge />
          <AlertasBadge onClick={onAlertas} />
          <button
            onClick={onNota}
            title="Nota ejecutiva imprimible [N]"
            className="text-[11px] px-2 h-8 surface-sunk rounded-[4px] flex items-center gap-1.5 hover:ring-accent"
          >
            Nota
            <span className="kbd hidden md:inline">N</span>
          </button>
          <button
            onClick={onRefresh}
            title="Refrescar [R]"
            aria-label="Refrescar"
            className={`mono text-[10px] px-2 h-8 surface-sunk rounded-[4px] flex items-center gap-1.5 hover:ring-accent ${
              refreshing ? 'text-accent' : ''
            }`}
          >
            <span
              className={refreshing ? 'inline-block' : ''}
              style={refreshing ? { animation: 'spin 800ms linear' } : {}}
            >
              ↻
            </span>
            <span className="hidden md:inline">refrescar</span>
            <span className="kbd hidden md:inline">R</span>
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Modo [D]"
            aria-label="Cambiar modo"
            className="mono text-[10px] px-2 h-8 surface-sunk rounded-[4px] flex items-center gap-1.5 hover:ring-accent"
          >
            <span>{theme === 'dark' ? '○' : '●'}</span>
            <span className="hidden md:inline">{theme === 'dark' ? 'oscuro' : 'claro'}</span>
            <span className="kbd hidden md:inline">D</span>
          </button>
          <div className="hidden sm:flex px-3 h-8 surface-sunk rounded-[4px] items-center gap-3">
            <div className="mono text-[10px] text-muted leading-none flex items-center gap-2">
              <span className="text-subtle hidden md:inline">{t.date}</span>
              <span>
                {t.time}
                <span className="blink">_</span>
              </span>
            </div>
            <span className="hidden lg:inline mono text-[9px] text-subtle">
              {t.tz}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
