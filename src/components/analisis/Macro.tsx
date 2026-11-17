// Ciclo global (agregados WEO), inflación y ciclo monetario (BIS).

import { useState } from 'react';
import type { Analisis, BancoCentral } from '../../types-analisis';
import { TimeChart, type TSerie } from '../charts/TimeChart';
import { Sparkline } from '../primitives/Sparkline';
import { Lecturas, Num, Seccion, Th, fmtMes } from './ui';

const AGG_COLOR: Record<string, string> = {
  WEOWORLD: 'var(--fg)',
  ADVEC: 'var(--info)',
  OEMDC: 'var(--accent)',
  WE: 'var(--pos)',
  EURO: '#8b5cf6',
  DA: '#ec4899',
  MECA: 'var(--neg)',
  SSA: '#14b8a6',
  MAE: '#64748b',
  SMQ: '#84cc16',
  EDE: '#f97316',
};
const AGG_DEFAULT = ['WEOWORLD', 'ADVEC', 'OEMDC', 'WE', 'MECA'];

export function CicloGlobal({ a }: { a: Analisis }) {
  const [sel, setSel] = useState<string[]>(AGG_DEFAULT);
  const [var_, setVar] = useState<'crecimiento' | 'inflacion' | 'deuda'>('crecimiento');
  const Y = a.ciclo.anioBase;
  const series: TSerie[] = a.ciclo.agregados
    .filter((g) => sel.includes(g.codigo))
    .map((g) => ({
      id: g.codigo,
      label: g.nombre,
      color: AGG_COLOR[g.codigo] ?? 'var(--fg-muted)',
      ancho: g.codigo === 'WEOWORLD' ? 2.4 : 1.5,
      puntos: g.serie.map((p) => ({ x: p.anio, y: var_ === 'inflacion' && p.inflacion != null ? Math.min(p.inflacion, 25) : p[var_], proy: p.tipo === 'proy' })),
    }));
  const titulos = { crecimiento: 'PIB real, % anual', inflacion: 'Inflación promedio, % anual (tope 25% en el gráfico)', deuda: 'Deuda pública bruta, % del PIB' };
  return (
    <Seccion
      titulo="Ciclo global"
      sub={`Agregados oficiales del FMI (WEO) 2015–${a.ciclo.agregados.length ? Math.max(...a.ciclo.agregados.flatMap((g) => g.serie.map((p) => p.anio))) : Y + 5} · banda sombreada = proyección`}
      right={
        <div className="flex gap-1">
          {(['crecimiento', 'inflacion', 'deuda'] as const).map((k) => (
            <button key={k} onClick={() => setVar(k)} className={`px-2 h-6 rounded-[4px] text-[11px] ${var_ === k ? 'surface-sunk text-[var(--fg)]' : 'text-muted'}`}>
              {k === 'crecimiento' ? 'Crecimiento' : k === 'inflacion' ? 'Inflación' : 'Deuda'}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="px-3 pt-3">
          <div className="text-[11px] text-muted mb-1 px-1">{titulos[var_]}</div>
          <TimeChart series={series} height={230} proyDesde={Y + 0.5} ref0={var_ !== 'deuda'} fmtX={(x) => String(x)} />
          <div className="flex flex-wrap gap-1.5 px-1 py-2">
            {a.ciclo.agregados.map((g) => {
              const on = sel.includes(g.codigo);
              return (
                <button
                  key={g.codigo}
                  onClick={() => setSel((s) => (on ? s.filter((x) => x !== g.codigo) : [...s, g.codigo]))}
                  className={`flex items-center gap-1.5 px-2 h-6 rounded-full text-[10px] border ${on ? '' : 'opacity-50'}`}
                  style={{ borderColor: on ? (AGG_COLOR[g.codigo] ?? 'var(--border)') : 'var(--border)' }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: AGG_COLOR[g.codigo] ?? 'var(--fg-muted)' }} />
                  {g.nombre}
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-token">
          <table className="w-full text-[11px]">
            <thead>
              <tr>
                <Th left>Crecimiento</Th>
                <Th>{Y - 1}</Th>
                <Th>{Y}e</Th>
                <Th>{Y + 1}p</Th>
              </tr>
            </thead>
            <tbody>
              {a.ciclo.agregados.map((g) => {
                const v = (an: number) => g.serie.find((p) => p.anio === an)?.crecimiento ?? null;
                return (
                  <tr key={g.codigo} className="row-hover">
                    <td className="px-2 h-6 border-b border-token truncate max-w-[150px]">{g.nombre}</td>
                    <td className="px-2 text-right border-b border-token"><Num v={v(Y - 1)} /></td>
                    <td className="px-2 text-right border-b border-token font-medium"><Num v={v(Y)} signo={(v(Y) ?? 0) < 0 ? 1 : 0} /></td>
                    <td className="px-2 text-right border-b border-token text-muted"><Num v={v(Y + 1)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-2 py-1.5 text-[10px] text-subtle">e = estimación del año en curso · p = proyección FMI</p>
        </div>
      </div>
      <Lecturas items={a.ciclo.lecturas} className="border-t border-token" />
    </Seccion>
  );
}

export function InflacionGlobal({ a }: { a: Analisis }) {
  const inf = a.inflacion;
  const top = inf.filas.slice(0, 12);
  const acel = [...inf.filas].filter((f) => f.cambio != null).sort((x, y) => (y.cambio ?? 0) - (x.cambio ?? 0)).slice(0, 6);
  return (
    <Seccion titulo="Inflación" sub={`Inflación promedio ${inf.anioBase} (FMI) en las ${inf.filas.length} economías del tablero`}>
      <div className="grid sm:grid-cols-4 gap-px bg-[var(--border)] border-b border-token">
        {[
          ['Mundo', inf.mundo, `${inf.anioBase - 1}: ${inf.mundoAnterior?.toLocaleString('es') ?? 's/d'}%`],
          ['Mediana del tablero', inf.mediana, `${inf.sobre5} economías ≥ 5%`],
          ['Aceleran', inf.acelera, 'vs año previo (>0,3 pp)'],
          ['Desaceleran', inf.desacelera, 'vs año previo (<−0,3 pp)'],
        ].map(([t, v, s]) => (
          <div key={t as string} className="surface border-0 px-4 py-2.5">
            <div className="text-[11px] text-muted">{t}</div>
            <div className="text-[18px] font-semibold tabular-nums">{typeof v === 'number' ? v.toLocaleString('es', { maximumFractionDigits: 1 }) : 's/d'}{t === 'Mundo' || t === 'Mediana del tablero' ? '%' : ''}</div>
            <div className="text-[10px] text-subtle">{s}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr><Th left>Más alta</Th><Th>{inf.anioBase - 1}</Th><Th>{inf.anioBase}e</Th><Th>{inf.anioBase + 1}p</Th></tr></thead>
            <tbody>
              {top.map((f) => (
                <tr key={f.iso3} className="row-hover">
                  <td className="px-2 h-6 border-b border-token">{f.pais}</td>
                  <td className="px-2 text-right border-b border-token text-muted"><Num v={f.anterior} /></td>
                  <td className="px-2 text-right border-b border-token font-medium"><Num v={f.inflacion} /></td>
                  <td className="px-2 text-right border-b border-token text-muted"><Num v={f.siguiente} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto md:border-l border-token">
          <table className="w-full text-[11px]">
            <thead><tr><Th left>Mayor aceleración</Th><Th>{inf.anioBase}e</Th><Th>Cambio pp</Th></tr></thead>
            <tbody>
              {acel.map((f) => (
                <tr key={f.iso3} className="row-hover">
                  <td className="px-2 h-6 border-b border-token">{f.pais}</td>
                  <td className="px-2 text-right border-b border-token"><Num v={f.inflacion} /></td>
                  <td className="px-2 text-right border-b border-token"><Num v={f.cambio} signo={-1} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Lecturas items={inf.lecturas} className="border-t border-token" />
    </Seccion>
  );
}

const POSTURA_COLOR: Record<BancoCentral['postura'], string> = {
  restrictiva: 'var(--info)',
  neutral: 'var(--fg-muted)',
  expansiva: 'var(--accent)',
  sd: 'var(--fg-subtle)',
};

export function CicloMonetario({ a }: { a: Analisis }) {
  const m = a.monetario;
  const maxN = Math.max(1, ...m.difusion.map((d) => Math.max(d.subas, d.recortes)));
  const W = 600, H = 150, mid = H / 2, bw = W / Math.max(1, m.difusion.length);
  return (
    <Seccion
      titulo="Ciclo monetario global"
      sub={`Tasas de política de ${m.bancos} bancos centrales (BIS, fin de mes) · zona euro contada una vez · corte ${m.corte ? fmtMes(m.corte) : 's/d'}`}
      right={<span className="font-medium" style={{ color: m.fase.includes('restric') || m.fase === 'endurecimiento' ? 'var(--neg)' : m.fase === 'pausa' ? 'var(--accent)' : 'var(--pos)' }}>Fase: {m.fase}</span>}
    >
      <div className="grid lg:grid-cols-[1fr_1fr]">
        <div className="px-4 pt-3 pb-2">
          <div className="text-[11px] text-muted mb-1">Difusión mensual: bancos que suben (arriba) y recortan (abajo)</div>
          <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full h-auto block">
            <line x1="0" x2={W} y1={mid} y2={mid} stroke="var(--border-strong)" />
            {m.difusion.map((d, i) => {
              const hS = (d.subas / maxN) * (mid - 6), hR = (d.recortes / maxN) * (mid - 6);
              return (
                <g key={d.mes}>
                  <title>{`${fmtMes(d.mes)}: ${d.subas} subas · ${d.recortes} recortes · ${d.sinCambio} sin cambio`}</title>
                  <rect x={i * bw + 1} y={mid - hS} width={bw - 2} height={hS} fill="var(--neg)" opacity="0.8" />
                  <rect x={i * bw + 1} y={mid} width={bw - 2} height={hR} fill="var(--pos)" opacity="0.8" />
                  {d.neto !== 0 && <circle cx={i * bw + bw / 2} cy={mid - (d.neto / maxN) * (mid - 6)} r="2.2" fill="var(--fg)" />}
                  {i % 3 === 0 && <text x={i * bw + bw / 2} y={H + 12} textAnchor="middle" fontSize="9" fill="var(--fg-subtle)">{fmtMes(d.mes)}</text>}
                </g>
              );
            })}
          </svg>
          <div className="flex gap-4 text-[10px] text-muted">
            <span className="flex items-center gap-1"><span className="w-2 h-2" style={{ background: 'var(--neg)' }} />suben</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2" style={{ background: 'var(--pos)' }} />recortan</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--fg)' }} />neto</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              ['Recortaron 12m', m.recortaron12, 'var(--pos)'],
              ['Subieron 12m', m.subieron12, 'var(--neg)'],
              ['Subas 3m', m.subas3, 'var(--neg)'],
              ['Recortes 3m', m.recortes3, 'var(--pos)'],
            ].map(([t, v, c]) => (
              <div key={t as string} className="surface-sunk rounded-[4px] px-2 py-1.5">
                <div className="text-[10px] text-muted">{t}</div>
                <div className="text-[16px] font-semibold tabular-nums" style={{ color: c as string }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-auto scrollbar-thin max-h-[360px] lg:border-l border-token">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 surface">
              <tr>
                <Th left>Banco central</Th>
                <Th>Tasa</Th>
                <Th title="cambio en 12 meses (pp)">12m</Th>
                <Th title="última decisión con cambio">Última</Th>
                <Th title="inflación promedio del año (FMI)">Infl.</Th>
                <Th title="tasa de política − inflación">Real</Th>
                <Th left>Postura</Th>
                <Th>3 años</Th>
              </tr>
            </thead>
            <tbody>
              {m.filas.map((f) => (
                <tr key={f.iso3} className="row-hover">
                  <td className="px-2 h-7 border-b border-token whitespace-nowrap">{f.pais}{f.desactualizada && <span className="text-subtle" title={`último dato BIS: ${f.fecha}`}> *</span>}</td>
                  <td className="px-2 text-right border-b border-token font-medium"><Num v={f.tasa} d={2} /></td>
                  <td className="px-2 text-right border-b border-token"><Num v={f.var12m} d={2} signo={-1} /></td>
                  <td className="px-2 text-right border-b border-token text-[10px] whitespace-nowrap">
                    {f.ultimaDecision ? <><Num v={f.ultimaDecision.cambio} d={2} signo={-1} /> <span className="text-subtle">{fmtMes(f.ultimaDecision.fecha)}</span></> : <span className="text-subtle">—</span>}
                  </td>
                  <td className="px-2 text-right border-b border-token text-muted"><Num v={f.inflacion} /></td>
                  <td className="px-2 text-right border-b border-token"><Num v={f.real} signo={0} /></td>
                  <td className="px-2 border-b border-token text-[10px]" style={{ color: POSTURA_COLOR[f.postura] }}>{f.postura}</td>
                  <td className="px-2 border-b border-token"><Sparkline data={f.serie.map((p) => p.valor)} width={60} height={14} filled={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-2 py-1.5 text-[10px] text-subtle">Postura: real &gt; 2% restrictiva · 0–2% neutral · &lt; 0 expansiva. * dato BIS desactualizado.</p>
        </div>
      </div>
      <Lecturas items={m.lecturas} className="border-t border-token" />
    </Seccion>
  );
}
