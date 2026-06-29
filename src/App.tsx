import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Theme } from './types';
import { ThemeContext } from './theme';
import { FiltrosProvider, useFiltros } from './lib/filters';
import { SerieProvider } from './lib/serie';
import { SerieModal } from './components/overlays/SerieModal';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { HealthFooter } from './components/modules/HealthFooter';
import { MediaWall } from './components/modules/MediaWall';
import { ResumenPanel } from './components/modules/ResumenPanel';
import { PulsoPanel } from './components/modules/PulsoPanel';
import { HeatmapPanel } from './components/modules/HeatmapPanel';
import { RiesgoPanel } from './components/modules/RiesgoPanel';
import { FxPanel } from './components/modules/FxPanel';
import { TasasPanel } from './components/modules/TasasPanel';
import { ComercioPanel } from './components/modules/ComercioPanel';
import { ConflictosPanel } from './components/modules/ConflictosPanel';
import { LatamPanel } from './components/modules/LatamPanel';
import { CalendarioPanel } from './components/modules/CalendarioPanel';

interface TabDef {
  id: string;
  badge: string;
  label: string;
  /** Sólo estas vistas responden a los filtros región/grupo → la barra se muestra ahí. */
  filtrable?: boolean;
  render: (now: Date, goto: (t: string) => void) => ReactNode;
}

const TABS: TabDef[] = [
  { id: 'resumen', badge: '⊞', label: 'Resumen', render: (now, goto) => <ResumenPanel now={now} onGoto={goto} /> },
  { id: 'pulso', badge: '1', label: 'Pulso global', render: (now) => <PulsoPanel now={now} /> },
  { id: 'heatmap', badge: '2', label: 'Heatmap macro', filtrable: true, render: (now) => <HeatmapPanel now={now} /> },
  { id: 'riesgo', badge: '3', label: 'Riesgo soberano', filtrable: true, render: (now) => <RiesgoPanel now={now} /> },
  { id: 'fx', badge: '4', label: 'FX & commodities', render: (now) => <FxPanel now={now} /> },
  { id: 'tasas', badge: '5', label: 'Inflación y tasas reales', filtrable: true, render: (now) => <TasasPanel now={now} /> },
  { id: 'comercio', badge: '6', label: 'Comercio y flujos', filtrable: true, render: (now) => <ComercioPanel now={now} /> },
  { id: 'conflictos', badge: '7', label: 'Conflictos', render: (now) => <ConflictosPanel now={now} /> },
  { id: 'latam', badge: '8', label: 'Foco LatAm', render: (now) => <LatamPanel now={now} /> },
  { id: 'calendario', badge: '9', label: 'Calendario', render: (now) => <CalendarioPanel now={now} /> },
  { id: 'medios', badge: '📺', label: 'Muro de medios', render: () => <MediaWall /> },
];

function Shell() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [now, setNow] = useState(() => new Date(0));
  const [nowSlow, setNowSlow] = useState(() => new Date(0));
  const [active, setActive] = useState('resumen');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtros = useFiltros();

  // reloj rápido (header) + lento (frescura de paneles, cada 30 s)
  useEffect(() => {
    setNow(new Date());
    setNowSlow(new Date());
    const fast = setInterval(() => setNow(new Date()), 1000);
    const slow = setInterval(() => setNowSlow(new Date()), 30_000);
    return () => {
      clearInterval(fast);
      clearInterval(slow);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const refresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if ((e.key === 'd' || e.key === 'D') && !typing) {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
      } else if ((e.key === 'r' || e.key === 'R') && !typing) {
        refresh();
      } else if (e.key === 'Escape') {
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <ThemeContext.Provider value={theme}>
      <div className="min-h-screen flex flex-col">
        <Header
          theme={theme}
          setTheme={setTheme}
          refreshing={refreshing}
          onRefresh={refresh}
          searchRef={searchRef}
          query={filtros.query}
          setQuery={(q) => filtros.set('query', q)}
          now={now}
        />

        <nav className="sticky top-12 z-20 surface border-l-0 border-r-0 border-t-0 border-token">
          <div className="flex items-center gap-0.5 px-2 sm:px-3 overflow-x-auto scrollbar-thin">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`mono text-[11px] px-2.5 h-9 flex items-center gap-1.5 whitespace-nowrap border-b-2 transition-colors ${
                  active === t.id
                    ? 'border-[var(--accent)] text-[var(--fg)]'
                    : 'border-transparent text-muted hover:text-[var(--fg)]'
                }`}
              >
                <span className="text-subtle">{t.badge}</span>
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab.filtrable && <FilterBar />}

        <main key={refreshKey} className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto">
          {activeTab.render(nowSlow, setActive)}
        </main>

        <HealthFooter now={nowSlow} />
        <SerieModal />
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <FiltrosProvider>
      <SerieProvider>
        <Shell />
      </SerieProvider>
    </FiltrosProvider>
  );
}
