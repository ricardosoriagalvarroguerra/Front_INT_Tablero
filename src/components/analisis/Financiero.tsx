// Condiciones financieras, curva del Tesoro, dinámica de deuda, posición
// externa, FX emergente, commodities y ranking de vulnerabilidad.

import { useState } from 'react';
import type { Analisis, ExternoFila } from '../../types-analisis';
import { TimeChart, Leyenda } from '../charts/TimeChart';
import { Sparkline } from '../primitives/Sparkline';
import { useSerie } from '../../lib/serie';
import { Lecturas, Num, PctlBar, Seccion, Th, fmtFecha } from './ui';

export function Condiciones({ a }: { a: Analisis }) {
  const c = a.condiciones;
  const { abrir } = useSerie();
  const color = c.indice == null ? 'var(--fg-subtle)' : c.indice >= 65 ? 'var(--neg)' : c.indice >= 40 ? 'var(--accent)' : 'var(--pos)';
  const ms = (iso: string) => Date.parse(iso);
  return (
    <Seccion titulo="Condiciones financieras y curva del Tesoro" sub="Percentil de cada indicador frente a su propia historia desde 2015 (FRED, ICE BofA, Chicago Fed)">
      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="px-4 py-4 flex flex-col items-center justify-center gap-1 lg:border-r border-b lg:border-b-0 border-token">
          <div className="text-[11px] text-muted">Índice de estrés propio</div>
          <svg viewBox="0 0 120 70" className="w-40">
            <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--bg-sunk)" strokeWidth="10" />
            {c.indice != null && (
              <path
                d="M10 60 A50 50 0 0 1 110 60"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={`${(c.indice / 100) * 157} 157`}
              />
            )}
            <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="600" fill={color}>{c.indice ?? 's/d'}</text>
          </svg>
          <div className="text-[12px] font-medium" style={{ color }}>Condiciones {c.estado}</div>
          <div className="text-[10px] text-subtle text-center leading-snug">promedio de percentiles de VIX, HY, EM y NFCI · 0 = holgura máxima, 100 = estrés máximo</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr><Th left>Indicador</Th><Th>Último</Th><Th>1 mes</Th><Th left>Percentil desde 2015</Th><Th>12 meses</Th></tr>
            </thead>
            <tbody>
              {c.indicadores.map((i) => (
                <tr key={i.id} className="row-hover cursor-pointer" onClick={() => abrir({ tipo: 'mercado', symbol: i.id, titulo: i.nombre })}>
                  <td className="px-2 h-7 border-b border-token">{i.nombre}<span className="text-subtle text-[10px]"> · {fmtFecha(i.fecha)}</span></td>
                  <td className="px-2 text-right border-b border-token font-medium tabular-nums">
                    {i.valor?.toLocaleString('es', { maximumFractionDigits: i.unidad === 'pb' ? 0 : 2 })}
                    <span className="text-subtle text-[10px]"> {i.unidad === '%' ? '%' : i.unidad === 'pb' ? 'pb' : ''}</span>
                  </td>
                  <td className="px-2 text-right border-b border-token">
                    <Num v={i.var1m} d={i.unidad === 'pb' ? 0 : 2} signo={i.altoEsEstres ? -1 : 1} suf={i.var1mTipo === 'pct' ? '%' : ''} />
                  </td>
                  <td className="px-2 border-b border-token"><PctlBar p={i.percentil} altoEsEstres={i.altoEsEstres} /></td>
                  <td className="px-2 border-b border-token"><Sparkline data={i.spark} width={70} height={14} filled={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_260px] border-t border-token">
        <div className="px-3 pt-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[11px] text-muted">Tesoro EE.UU. 10A y 2A (%) · 3 años, semanal</span>
            <Leyenda items={[{ label: '10A', color: 'var(--accent)' }, { label: '2A', color: 'var(--info)' }]} />
          </div>
          <TimeChart
            height={180}
            ref0={false}
            fmtX={(x) => new Date(x).toLocaleDateString('es', { month: 'short', year: '2-digit', timeZone: 'UTC' }).replace('.', '')}
            fmtY={(y) => y.toLocaleString('es', { maximumFractionDigits: 2 })}
            series={[
              { id: 'y10', label: '10A', color: 'var(--accent)', puntos: c.curva.serie.map((p) => ({ x: ms(p.fecha), y: p.y10 })) },
              { id: 'y2', label: '2A', color: 'var(--info)', puntos: c.curva.serie.map((p) => ({ x: ms(p.fecha), y: p.y2 })) },
            ]}
          />
        </div>
        <div className="md:border-l border-token px-4 py-3 grid grid-cols-2 gap-2 content-start text-[11px]">
          {[
            ['3 meses', c.curva.y3m, '%'],
            ['2 años', c.curva.y2, '%'],
            ['10 años', c.curva.y10, '%'],
            ['Real 10A', c.curva.real10, '%'],
            ['10A − 2A', c.curva.pend10y2y, ' pb'],
            ['10A − 3M', c.curva.pend10y3m, ' pb'],
            ['Inflación implícita', c.curva.breakeven, '%'],
            ['Percentil 10A', c.curva.pctl10, ''],
          ].map(([t, v, u]) => (
            <div key={t as string} className="surface-sunk rounded-[4px] px-2 py-1.5">
              <div className="text-[10px] text-muted">{t}</div>
              <div className="text-[14px] font-semibold tabular-nums" style={{ color: typeof v === 'number' && (t as string).includes('−') && v < 0 ? 'var(--neg)' : undefined }}>
                {typeof v === 'number' ? v.toLocaleString('es', { maximumFractionDigits: 2 }) + u : 's/d'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Lecturas items={c.lecturas} className="border-t border-token" />
    </Seccion>
  );
}

export function DinamicaDeuda({ a }: { a: Analisis }) {
  const [todos, setTodos] = useState(false);
  const d = a.deuda;
  const filas = todos ? d.filas : d.filas.slice(0, 15);
  return (
    <Seccion
      titulo="Dinámica de deuda pública"
      sub={`Deuda ${d.anioBase} y trayectoria proyectada por el FMI · r − g con el rendimiento a 10A y el crecimiento nominal esperado (${d.anioBase + 1}–${d.anioBase + 3})`}
      right={<button className="text-accent hover:underline" onClick={() => setTodos((t) => !t)}>{todos ? 'Ver menos' : `Ver las ${d.filas.length}`}</button>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <Th left>País</Th>
              <Th title="deuda bruta % PIB, año en curso">Deuda</Th>
              <Th title="deuda proyectada al horizonte WEO">Horizonte</Th>
              <Th title="cambio proyectado (pp)">Δ</Th>
              <Th title="balance fiscal global % PIB">Balance</Th>
              <Th title="balance global que estabiliza la deuda: −d·g/(1+g)">Estabilizador</Th>
              <Th title="balance − estabilizador (negativo: la deuda sube)">Brecha</Th>
              <Th title="crecimiento nominal esperado">g nominal</Th>
              <Th title="rendimiento soberano 10A">r 10A</Th>
              <Th title="r − g (pp)">r − g</Th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.iso3} className="row-hover" style={d.preocupantes.includes(f.iso3) ? { background: 'color-mix(in srgb, var(--neg) 7%, transparent)' } : undefined}>
                <td className="px-2 h-7 border-b border-token whitespace-nowrap">{f.pais}</td>
                <td className="px-2 text-right border-b border-token font-medium"><Num v={f.deuda} d={0} /></td>
                <td className="px-2 text-right border-b border-token text-muted">
                  <Num v={f.deudaHorizonte} d={0} /> <span className="text-subtle text-[9px]">{f.horizonte ?? ''}</span>
                </td>
                <td className="px-2 text-right border-b border-token"><Num v={f.cambio} signo={-1} /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.balance} /></td>
                <td className="px-2 text-right border-b border-token text-muted"><Num v={f.balanceEstabilizador} /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.brecha} signo={1} /></td>
                <td className="px-2 text-right border-b border-token text-muted"><Num v={f.crecNominal} /></td>
                <td className="px-2 text-right border-b border-token text-muted"><Num v={f.yield10} d={2} /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.rg} signo={-1} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 pt-2 text-[10px] text-subtle">
        Sombreado: deuda ≥ 90% del PIB y subiendo más de 5 pp al horizonte. El balance estabilizador asume deuda y crecimiento nominal constantes; r 10A sólo donde hay rendimiento soberano (FRED, BCE, OCDE).
      </p>
      <Lecturas items={d.lecturas} />
    </Seccion>
  );
}

const CUAD: Record<ExternoFila['cuadrante'], { txt: string; color: string }> = {
  'deficits-gemelos': { txt: 'Déficits gemelos', color: 'var(--neg)' },
  'deficit-externo': { txt: 'Déficit externo', color: 'var(--accent)' },
  'deficit-fiscal': { txt: 'Déficit fiscal', color: 'var(--info)' },
  'superavits-gemelos': { txt: 'Superávits gemelos', color: 'var(--pos)' },
};

export function PosicionExterna({ a }: { a: Analisis }) {
  const [hover, setHover] = useState<string | null>(null);
  const xs = a.externo.filas;
  const W = 520, H = 300, p = 34;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const fx = (v: number) => p + ((clamp(v, -12, 8) + 12) / 20) * (W - 2 * p);
  const fy = (v: number) => H - p - ((clamp(v, -10, 14) + 10) / 24) * (H - 2 * p);
  const r = (peso: number | null) => (peso ? Math.max(3, Math.min(14, Math.sqrt(peso) / 9)) : 3);
  return (
    <Seccion titulo="Posición fiscal y externa" sub={`Balance fiscal vs cuenta corriente, % del PIB ${a.externo.anioBase} (FMI) · tamaño = PIB en US$`}>
      <div className="grid md:grid-cols-[1fr_220px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block max-w-[620px] mx-auto">
          <rect x={p} y={fy(0)} width={fx(0) - p} height={H - p - fy(0)} fill="var(--neg)" opacity="0.05" />
          <line x1={fx(0)} x2={fx(0)} y1={p / 2} y2={H - p} stroke="var(--border-strong)" />
          <line x1={p} x2={W - p / 2} y1={fy(0)} y2={fy(0)} stroke="var(--border-strong)" />
          {[-12, -8, -4, 0, 4, 8].map((t) => <text key={t} x={fx(t)} y={H - p + 14} fontSize="9" textAnchor="middle" fill="var(--fg-subtle)">{t}</text>)}
          {[-8, -4, 0, 4, 8, 12].map((t) => <text key={t} x={p - 6} y={fy(t)} fontSize="9" textAnchor="end" dominantBaseline="middle" fill="var(--fg-subtle)">{t}</text>)}
          <text x={W - p} y={H - 6} fontSize="9" textAnchor="end" fill="var(--fg-muted)">balance fiscal →</text>
          <text x={p + 4} y={p / 2 + 2} fontSize="9" fill="var(--fg-muted)">↑ cuenta corriente</text>
          <text x={p + 4} y={H - p - 6} fontSize="9" fill="var(--neg)" opacity="0.8">déficits gemelos</text>
          {xs.map((f) => (
            <g key={f.iso3} onMouseEnter={() => setHover(f.iso3)} onMouseLeave={() => setHover(null)}>
              <circle cx={fx(f.fiscal!)} cy={fy(f.cuentaCorriente!)} r={r(f.peso)} fill={CUAD[f.cuadrante].color} opacity={hover && hover !== f.iso3 ? 0.25 : 0.65} stroke="var(--bg)" strokeWidth="0.8" />
              {(hover === f.iso3 || (f.peso ?? 0) > 2500 || Math.abs(f.fiscal!) > 7 || Math.abs(f.cuentaCorriente!) > 6) && (
                <text x={fx(f.fiscal!) + r(f.peso) + 2} y={fy(f.cuentaCorriente!)} fontSize="9" dominantBaseline="middle" fill="var(--fg)">
                  {f.iso3}{hover === f.iso3 ? ` ${f.fiscal} / ${f.cuentaCorriente}` : ''}
                </text>
              )}
            </g>
          ))}
        </svg>
        <div className="md:border-l border-token px-4 py-3 text-[11px] flex flex-col gap-2">
          {Object.entries(CUAD).map(([k, v]) => {
            const n = xs.filter((f) => f.cuadrante === k);
            return (
              <div key={k}>
                <div className="flex items-center gap-1.5 font-medium" style={{ color: v.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                  {v.txt} · {n.length}
                </div>
                <div className="text-[10px] text-muted leading-snug">{n.map((f) => f.pais).join(', ') || '—'}</div>
              </div>
            );
          })}
          <div className="text-[10px] text-subtle">Ejes recortados a [−12, 8] y [−10, 14] para legibilidad.</div>
        </div>
      </div>
      <Lecturas items={a.externo.lecturas} className="border-t border-token" />
    </Seccion>
  );
}

export function FxEmergente({ a }: { a: Analisis }) {
  const { abrir } = useSerie();
  return (
    <Seccion titulo="Monedas frente al dólar" sub="Variación del tipo de cambio USD/moneda local: positivo = la moneda se deprecia · carry = tasa de política local − Fed">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr><Th left>Moneda</Th><Th>Último</Th><Th>1 mes</Th><Th>3 meses</Th><Th>1 año</Th><Th title="volatilidad anualizada 3 meses">Vol. 3M</Th><Th>Carry</Th><Th title="carry / volatilidad">Carry/vol</Th></tr>
          </thead>
          <tbody>
            {a.fx.filas.map((f) => (
              <tr key={f.par} className="row-hover cursor-pointer" onClick={() => f.valor != null && abrir({ tipo: 'mercado', symbol: f.par, titulo: `${f.pais} · ${f.par}` })}>
                <td className="px-2 h-7 border-b border-token whitespace-nowrap">{f.pais} <span className="text-subtle text-[10px]">{f.par.slice(3)}</span></td>
                <td className="px-2 text-right border-b border-token tabular-nums">{f.valor?.toLocaleString('es', { maximumFractionDigits: f.valor > 100 ? 0 : 2 }) ?? <span className="text-subtle">s/d</span>}</td>
                <td className="px-2 text-right border-b border-token"><Num v={f.var1m} signo={-1} suf="%" /></td>
                <td className="px-2 text-right border-b border-token font-medium"><Num v={f.var3m} signo={-1} suf="%" /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.var1a} signo={-1} suf="%" /></td>
                <td className="px-2 text-right border-b border-token text-muted"><Num v={f.vol3m} suf="%" /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.carry} d={2} /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.carryVol} d={2} signo={1} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Lecturas items={a.fx.lecturas} className="border-t border-token" />
    </Seccion>
  );
}

export function CommoditiesExpo({ a }: { a: Analisis }) {
  const { abrir } = useSerie();
  return (
    <Seccion titulo="Commodities y exposición" sub="Precios (Yahoo/FRED) y principales exportadores netos del tablero">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr><Th left>Commodity</Th><Th>Último</Th><Th>1 mes</Th><Th>1 año</Th><Th title="desde el máximo de 6 meses">Desde máx.</Th><Th left>Percentil 2 años</Th><Th>12 meses</Th><Th left>Exportadores</Th></tr>
          </thead>
          <tbody>
            {a.commodities.filas.map((f) => (
              <tr key={f.id} className="row-hover cursor-pointer" onClick={() => abrir({ tipo: 'mercado', symbol: f.id, titulo: f.nombre })}>
                <td className="px-2 h-7 border-b border-token whitespace-nowrap">{f.nombre}<span className="text-subtle text-[10px]"> · {fmtFecha(f.fecha)}</span></td>
                <td className="px-2 text-right border-b border-token font-medium tabular-nums">{f.valor?.toLocaleString('es', { maximumFractionDigits: 2 })}</td>
                <td className="px-2 text-right border-b border-token"><Num v={f.var1m} signo={1} suf="%" /></td>
                <td className="px-2 text-right border-b border-token"><Num v={f.var1a} signo={1} suf="%" /></td>
                <td className="px-2 text-right border-b border-token text-muted"><Num v={f.desdeMax} suf="%" /></td>
                <td className="px-2 border-b border-token"><PctlBar p={f.percentil2a} altoEsEstres={false} /></td>
                <td className="px-2 border-b border-token"><Sparkline data={f.spark} width={70} height={14} filled={false} /></td>
                <td className="px-2 border-b border-token text-[10px] text-muted">{f.exportadores.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Lecturas items={a.commodities.lecturas} className="border-t border-token" />
    </Seccion>
  );
}

export function Vulnerabilidad({ a, onPais }: { a: Analisis; onPais?: (iso3: string) => void }) {
  const [todos, setTodos] = useState(false);
  const v = a.vulnerabilidad;
  const filas = todos ? v.filas : v.filas.slice(0, 15);
  const zColor = (z: number | null) => (z == null ? 'transparent' : z > 1 ? 'var(--neg)' : z > 0.4 ? 'var(--accent)' : z < -0.75 ? 'var(--pos)' : 'var(--bg-sunk)');
  return (
    <Seccion
      titulo="Ranking de vulnerabilidad macro-financiera"
      sub={`Promedio ponderado de z-scores (con signo de estrés, recortados a ±2,5) → 0–100 · pesos: ${v.pesos.map((p) => `${p.nombre.toLowerCase()} ${Math.round(p.peso * 100)}%`).join(', ')}`}
      right={<button className="text-accent hover:underline" onClick={() => setTodos((t) => !t)}>{todos ? 'Ver menos' : `Ver las ${v.filas.length}`}</button>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <Th left>País</Th>
              <Th>Score</Th>
              {v.pesos.map((p) => <Th key={p.clave} title={p.nombre}>{p.nombre.replace('Δ deuda proyectada', 'Δ deuda').replace('Depreciación 1 año', 'FX 1a')}</Th>)}
              <Th left>Principales factores</Th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.iso3} className={`row-hover ${onPais ? 'cursor-pointer' : ''}`} onClick={onPais ? () => onPais(f.iso3) : undefined}>
                <td className="px-2 h-7 border-b border-token whitespace-nowrap">{f.pais}</td>
                <td className="px-2 border-b border-token">
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="w-14 h-1.5 surface-sunk rounded-full overflow-hidden border-0 inline-block relative">
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${f.score}%`, background: f.score >= 65 ? 'var(--neg)' : f.score >= 50 ? 'var(--accent)' : 'var(--pos)' }} />
                    </span>
                    <span className="tabular-nums font-medium w-6 text-right">{f.score}</span>
                  </span>
                </td>
                {v.pesos.map((p) => {
                  const z = f.componentes[p.clave];
                  return (
                    <td key={p.clave} className="px-1 border-b border-token text-center">
                      <span className="inline-block w-full rounded-[2px] text-[10px] tabular-nums py-0.5" style={{ background: zColor(z), color: z != null && Math.abs(z) > 0.4 && z > 0 ? '#0a0a0b' : undefined }}>
                        {z == null ? '·' : z.toLocaleString('es', { maximumFractionDigits: 1 })}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 border-b border-token text-[10px] text-muted">{f.principales.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 pt-2 text-[10px] text-subtle">z &gt; 0 = peor que el promedio del tablero en ese componente. No es una calificación crediticia: ordena dónde mirar primero. Requiere ≥ 60% de cobertura de componentes.</p>
      <Lecturas items={v.lecturas} />
    </Seccion>
  );
}
