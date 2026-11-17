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
import { AnalisisPanel } from './components/modules/AnalisisPanel';
import { HistoricoPanel } from './components/modules/HistoricoPanel';
import { NotaEjecutiva } from './components/overlays/NotaEjecutiva';
import { invalidarAnalisis } from './lib/useAnalisis';

interface Nav {
  goto: (t: string) => void;
  pais: string;
  verPais: (iso3: string) => void;
}

interface TabDef {
  id: string;
  label: string;
  /** Sólo estas vistas responden a los filtros región/grupo → la barra se muestra ahí. */
  filtrable?: boolean;
  render: (now: Date, nav: Nav) => ReactNode;
}

const TABS: TabDef[] = [
  { id: 'resumen', label: 'Resumen', render: (now, n) => <ResumenPanel now={now} onGoto={n.goto} /> },
  { id: 'analisis', label: 'Análisis', render: (_, n) => <AnalisisPanel onGoto={n.goto} onPais={n.verPais} /> },
  { id: 'historico', label: 'Histórico', render: (_, n) => <HistoricoPanel key={n.pais} inicial={n.pais} /> },
  { id: 'pulso', label: 'Pulso', render: (now) => <PulsoPanel now={now} /> },
  { id: 'heatmap', label: 'Mapa de calor', filtrable: true, render: (now) => <HeatmapPanel now={now} /> },
  { id: 'riesgo', label: 'Riesgo soberano', filtrable: true, render: (now) => <RiesgoPanel now={now} /> },
  { id: 'fx', label: 'Monedas y commodities', render: (now) => <FxPanel now={now} /> },
  { id: 'tasas', label: 'Inflación y tasas', filtrable: true, render: (now) => <TasasPanel now={now} /> },
  { id: 'comercio', label: 'Comercio', filtrable: true, render: (now) => <ComercioPanel now={now} /> },
  { id: 'conflictos', label: 'Geopolítica', render: (now) => <ConflictosPanel now={now} /> },
  { id: 'latam', label: 'América Latina', render: (now) => <LatamPanel now={now} /> },
  { id: 'calendario', label: 'Calendario', render: (now) => <CalendarioPanel now={now} /> },
  { id: 'medios', label: 'Medios', render: () => <MediaWall /> },
];

function Shell() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [now, setNow] = useState(() => new Date(0));
  const [nowSlow, setNowSlow] = useState(() => new Date(0));
  const [active, setActive] = useState('resumen');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nota, setNota] = useState(false);
  const [pais, setPais] = useState('ARG');
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
    invalidarAnalisis();
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
      } else if ((e.key === 'n' || e.key === 'N') && !typing && !e.metaKey && !e.ctrlKey) {
        setNota((v) => !v);
      } else if (e.key === 'Escape') {
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeTab = TABS.find((t) => t.id === active) ?? TABS[0];
  const goto = (t: string) => {
    setActive(TABS.some((x) => x.id === t) ? t : 'analisis');
    window.scrollTo({ top: 0 });
  };
  const nav: Nav = { goto, pais, verPais: (iso3) => (setPais(iso3), goto('historico')) };

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
          onNota={() => setNota(true)}
          onAlertas={() => goto('analisis')}
        />

        <nav className="sticky top-12 z-20 surface border-l-0 border-r-0 border-t-0 border-token">
          <div className="flex items-center gap-0.5 px-2 sm:px-3 overflow-x-auto scrollbar-thin">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`text-[12px] px-2.5 h-9 flex items-center whitespace-nowrap border-b-2 transition-colors ${
                  active === t.id
                    ? 'border-[var(--accent)] text-[var(--fg)] font-medium'
                    : 'border-transparent text-muted hover:text-[var(--fg)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab.filtrable && <FilterBar />}

        <main key={refreshKey} className="flex-1 p-3 sm:p-4 max-w-[1600px] w-full mx-auto">
          {activeTab.render(nowSlow, nav)}
        </main>

        <HealthFooter now={nowSlow} />
        <SerieModal />
        {nota && <NotaEjecutiva onClose={() => setNota(false)} />}
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
