// Nota ejecutiva imprimible (botón «Nota» o tecla N). Dos carillas A4 armadas
// con el análisis vigente: tesis, semáforo, alertas, tablas clave y riesgos.
// Imprimir / guardar como PDF desde el navegador (Ctrl/Cmd + P).

import { useEffect } from 'react';
import { useAnalisis } from '../../lib/useAnalisis';
import { useOrigen } from '../../lib/useOrigen';
import { NIVEL_TXT, fmtFecha, fmtMes } from '../analisis/ui';

// Colores fijos (la nota se imprime sobre blanco, sin tokens de tema).
const HEX_NIVEL = { verde: '#10b981', ambar: '#f59e0b', rojo: '#ef4444', sd: '#a1a1aa' } as const;
const HEX_SEV = { alta: '#ef4444', media: '#f59e0b', info: '#3b82f6' } as const;

const n = (v: number | null | undefined, d = 1, signo = false) =>
  v == null ? 's/d' : `${signo && v > 0 ? '+' : ''}${v.toLocaleString('es', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export function NotaEjecutiva({ onClose }: { onClose: () => void }) {
  const { data: a } = useAnalisis();
  const { origen, snapshot } = useOrigen();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  return (
    <div className="nota-overlay fixed inset-0 z-50 overflow-auto bg-black/60 print:bg-white" onClick={onClose}>
      <div className="no-print sticky top-0 flex justify-center gap-2 py-2">
        <button onClick={(e) => (e.stopPropagation(), window.print())} className="px-3 h-8 rounded-[4px] bg-accent text-[#0a0a0b] text-[12px] font-medium">Imprimir / PDF</button>
        <button onClick={onClose} className="px-3 h-8 rounded-[4px] surface text-[12px]">Cerrar (Esc)</button>
      </div>
      <article className="nota mx-auto my-4 bg-white text-[#18181b] w-[210mm] max-w-full px-[16mm] py-[14mm] text-[10.5px] leading-[1.45] shadow-xl" onClick={(e) => e.stopPropagation()}>
        {!a ? (
          <p>Análisis no disponible.</p>
        ) : (
          <>
            <header className="flex items-end justify-between border-b-2 border-[#18181b] pb-2 mb-3">
              <div>
                <div className="text-[9px] tracking-[0.2em] text-[#71717a]">Tablero INT · nota ejecutiva</div>
                <h1 className="text-[17px] font-bold leading-tight mt-0.5">Economía internacional al {fmtFecha(a.corte.mercados)}</h1>
              </div>
              <div className="text-right text-[9px] text-[#71717a]">
                Generada {new Date(a.generado).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                <br />
                {origen === 'respaldo' ? `respaldo embebido (${snapshot ? new Date(snapshot.generado).toLocaleDateString('es') : 's/d'})` : 'datos en vivo'}
              </div>
            </header>

            <p className="text-[13px] font-semibold leading-snug">{a.tesis.titular}</p>
            <p className="mt-1"><span className="text-[#dc2626]">{a.tesis.focos}</span> <span className="text-[#059669]">{a.tesis.apoyos}</span></p>

            <h2 className="nota-h2">Semáforo</h2>
            <table className="nota-t">
              <tbody>
                {a.semaforo.map((s) => (
                  <tr key={s.id}>
                    <td className="w-[34%] font-medium"><span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: HEX_NIVEL[s.nivel] }} />{s.dimension}</td>
                    <td className="tabular-nums" style={{ textAlign: 'left' }}>{s.valor}</td>
                    <td style={{ color: HEX_NIVEL[s.nivel] }}>{NIVEL_TXT[s.nivel]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="nota-h2">Lectura</h2>
            <ol className="list-decimal pl-4 space-y-0.5">
              {a.tesis.puntos.map((p, i) => <li key={i}>{p}</li>)}
            </ol>

            <h2 className="nota-h2">Alertas activas ({a.alertas.length})</h2>
            <ul className="space-y-0.5">
              {a.alertas.map((al) => (
                <li key={al.id}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: HEX_SEV[al.nivel] }} />
                  <b>{al.titulo}</b> — {al.detalle}
                </li>
              ))}
            </ul>

            <div className="nota-break" />

            <h2 className="nota-h2">Ciclo global (FMI, % anual)</h2>
            <table className="nota-t">
              <thead><tr><th className="text-left">Agregado</th><th>{a.ciclo.anioBase - 1}</th><th>{a.ciclo.anioBase}e</th><th>{a.ciclo.anioBase + 1}p</th><th>Infl. {a.ciclo.anioBase}e</th><th>Deuda {a.ciclo.anioBase}e</th></tr></thead>
              <tbody>
                {a.ciclo.agregados.map((g) => {
                  const p = (an: number) => g.serie.find((x) => x.anio === an);
                  return (
                    <tr key={g.codigo}>
                      <td>{g.nombre}</td>
                      <td>{n(p(a.ciclo.anioBase - 1)?.crecimiento)}</td>
                      <td className="font-semibold">{n(p(a.ciclo.anioBase)?.crecimiento)}</td>
                      <td>{n(p(a.ciclo.anioBase + 1)?.crecimiento)}</td>
                      <td>{n(p(a.ciclo.anioBase)?.inflacion)}</td>
                      <td>{n(p(a.ciclo.anioBase)?.deuda, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h2 className="nota-h2">Política monetaria (BIS, {fmtMes(a.monetario.corte)})</h2>
                <table className="nota-t">
                  <thead><tr><th className="text-left">Banco</th><th>Tasa</th><th>12m</th><th>Real</th></tr></thead>
                  <tbody>
                    {a.monetario.filas.filter((f) => ['USA', 'DEU', 'GBR', 'JPN', 'CHN', 'BRA', 'MEX', 'IND', 'CHL', 'COL', 'TUR', 'ZAF'].includes(f.iso3)).map((f) => (
                      <tr key={f.iso3}><td>{f.pais}</td><td>{n(f.tasa, 2)}</td><td>{n(f.var12m, 2, true)}</td><td>{n(f.real, 1, true)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h2 className="nota-h2">Condiciones financieras · índice {a.condiciones.indice ?? 's/d'}/100</h2>
                <table className="nota-t">
                  <thead><tr><th className="text-left">Indicador</th><th>Último</th><th>1 mes</th><th>Pctl</th></tr></thead>
                  <tbody>
                    {a.condiciones.indicadores.map((i) => (
                      <tr key={i.id}><td>{i.nombre.replace(/ \(.*\)/, '')}</td><td>{n(i.valor, i.unidad === 'pb' ? 0 : 2)}</td><td>{n(i.var1m, i.unidad === 'pb' ? 0 : 2, true)}</td><td>{i.percentil ?? 's/d'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="nota-h2">Vulnerabilidad · 10 primeros</h2>
            <table className="nota-t">
              <thead><tr><th className="text-left">País</th><th>Score</th><th className="text-left">Factores</th><th>Deuda</th><th>Δ deuda</th><th>r − g</th></tr></thead>
              <tbody>
                {a.vulnerabilidad.filas.slice(0, 10).map((f) => {
                  const d = a.deuda.filas.find((x) => x.iso3 === f.iso3);
                  return (
                    <tr key={f.iso3}><td>{f.pais}</td><td className="font-semibold">{f.score}</td><td className="text-left">{f.principales.join(', ') || '—'}</td><td>{n(d?.deuda, 0)}</td><td>{n(d?.cambio, 1, true)}</td><td>{n(d?.rg, 1, true)}</td></tr>
                  );
                })}
              </tbody>
            </table>

            <h2 className="nota-h2">Balance de riesgos</h2>
            <div className="grid grid-cols-2 gap-4">
              {(['bajista', 'alcista'] as const).map((s) => (
                <ul key={s} className="space-y-0.5">
                  <li className="font-semibold" style={{ color: s === 'bajista' ? '#dc2626' : '#059669' }}>{s === 'bajista' ? 'A la baja' : 'Al alza'}</li>
                  {a.riesgos.filter((r) => r.sesgo === s).map((r) => <li key={r.id}><b>{r.titulo}.</b> {r.evidencia}</li>)}
                </ul>
              ))}
            </div>

            <footer className="mt-4 pt-2 border-t border-[#e4e4e7] text-[8.5px] text-[#71717a]">
              Fuentes: FMI WEO (DataMapper), BIS (tasas de política), FRED (Tesoro, spreads ICE BofA, NFCI, dólar amplio), BCE, OCDE, Yahoo Finance, World Bank, UN Comtrade, GDELT.
              Lecturas generadas por reglas explícitas sobre los datos (sin texto escrito a mano sobre el estado del mundo). e = estimación del año en curso; p = proyección FMI.
            </footer>
          </>
        )}
      </article>
    </div>
  );
}
