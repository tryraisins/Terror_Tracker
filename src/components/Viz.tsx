"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DownIcon, Locator, mapStateName, UpIcon } from "./icons";
import { ShareButton, abductedText, killedText } from "./Share";
import { NIGERIA_MAP_DATA } from "@/lib/mapData";
import {
  BINS, EMPTY_FILL, MEASURES, MEASURE_KEYS, PERIODS, PERIOD_KEYS, MONTHS,
  agoLabel, binFill, binLabels, buckets, dayLabel, fillFor, fmt, inkFor, placeLine, placeName, stateSlug, total,
  type Measure, type Period, type SummaryRow,
} from "@/lib/summary";

const STATES = Object.values(NIGERIA_MAP_DATA);
const SHORT: Record<string, string> = { "Federal Capital Territory": "FCT", "Cross River": "C. River", "Akwa Ibom": "A. Ibom" };
// Label nudges (viewBox units) where small southern states would collide.
const NUDGE: Record<string, [number, number]> = { Lagos: [-6, 26], Ogun: [0, -16], Imo: [-14, 6], Abia: [22, -4], Rivers: [-2, 12], Bayelsa: [-12, 0], "Cross River": [24, -8], "Akwa Ibom": [8, 6], Anambra: [-24, 6], Ebonyi: [12, -2], Enugu: [-8, 2] };
const canonical = (name: string) => name === "Federal Capital Territory" ? "FCT" : name;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** The one control row that scopes every panel on a page. */
export function Controls({ measure, onMeasure, period, onPeriod, year }: { measure: Measure; onMeasure: (m: Measure) => void; period?: Period; onPeriod?: (p: Period) => void; year: number }) {
  return <div className="controls">
    <div className="seg" role="group" aria-label="Measure">{MEASURE_KEYS.map((key) => <button key={key} type="button" aria-pressed={measure === key} onClick={() => onMeasure(key)}><span className="key" style={{ color: MEASURES[key].color }} />{MEASURES[key].short}</button>)}</div>
    {period && onPeriod ? <div className="seg" role="group" aria-label="Period">{PERIOD_KEYS.map((key) => <button key={key} type="button" aria-pressed={period === key} onClick={() => onPeriod(key)}>{key === "year" ? String(year) : PERIODS[key].label}</button>)}</div> : null}
  </div>;
}

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 240, H = 40, max = Math.max(...values, 1), n = Math.max(values.length - 1, 1);
  const points = values.map((value, i) => `${((i / n) * W).toFixed(1)} ${(H - 3 - (value / max) * (H - 6)).toFixed(1)}`);
  const line = `M${points.join("L")}`;
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"><path d={`${line}L${W} ${H}L0 ${H}Z`} fill={color} opacity={0.16} /><path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></svg>;
}

export function Change({ current, previous, days }: { current: number; previous: number; days: number }) {
  const change = Math.round(((current - previous) / Math.max(previous, 1)) * 100);
  return <span className="tile-delta">{change >= 0 ? <UpIcon /> : <DownIcon />}{change >= 0 ? "Up" : "Down"} {Math.abs(change)}% on the {days} days before ({fmt(previous)})</span>;
}

export function StatTile({ label, color, value, children, className = "span-3" }: { label: string; color?: string; value: ReactNode; children?: ReactNode; className?: string }) {
  return <section className={`card tile ${className}`} aria-label={label}>
    <span className="tile-label">{color ? <span className="key" style={{ color }} /> : null}{label}</span>
    <span className="tile-value">{value}</span>
    {children}
  </section>;
}

export function BarList({ entries, measure, href, onSelect, wide = false }: { entries: [string, number][]; measure: Measure; href?: (name: string) => string; onSelect?: (name: string) => void; wide?: boolean }) {
  const max = Math.max(...entries.map(([, value]) => value), 1);
  const unit = (value: number) => value === 1 ? MEASURES[measure].one : MEASURES[measure].noun;
  return <ol className={`bars ${wide ? "bars--wide" : ""}`} data-measure={measure}>{entries.map(([name, value]) => {
    const inner = <><span className="nm">{name}</span><span className="track" aria-hidden="true"><span className="fill" style={{ width: `${(value / max) * 100}%` }} /></span><span className="v">{fmt(value)}<span className="sr-only"> {unit(value)}</span></span></>;
    return <li key={name}>{onSelect ? <button type="button" className="bar-row" onClick={() => onSelect(name)}>{inner}</button> : href ? <Link href={href(name)}>{inner}</Link> : <div className="bar-row">{inner}</div>}</li>;
  })}</ol>;
}

export function Legend({ measure, note }: { measure: Measure; note?: string }) {
  const labels = binLabels(measure);
  return <div className="legend" aria-label={`Colour key for ${MEASURES[measure].noun}`}>
    <span className="lg"><i style={{ background: EMPTY_FILL }} />None</span>
    {BINS[measure].map((_, i) => <span key={i} className="lg"><i style={{ background: binFill(measure, i) }} />{labels[i]}</span>)}
    {note ? <span className="lg">{note}</span> : null}
  </div>;
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return <table className="dtable"><thead><tr>{head.map((cell, i) => <th key={cell} className={i ? "n" : undefined}>{cell}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={String(row[0])}>{row.map((cell, i) => <td key={i} className={i ? "n" : undefined}>{typeof cell === "number" ? fmt(cell) : cell}</td>)}</tr>)}</tbody></table>;
}

/** One measure, one colour, value axis with nice steps, a tooltip per column with all three measures. */
export function ColumnChart({ rows, period, measure, today, height = 300, note }: { rows: SummaryRow[]; period: Period; measure: Measure; today: string; height?: number; note?: { index: number; text: string } }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const data = buckets(period, today).map((bucket) => { const items = rows.filter(bucket.test); return { ...bucket, v: total(items, measure), a: items.length, k: total(items, "killed"), ab: total(items, "abducted") }; });
  // Phones get a shorter plot so the panel stays within one screen.
  const W = width || 600, H = width && width < 600 ? Math.min(height, 220) : height, padL = 40, padB = 28, padT = 16, plotH = H - padB - padT, n = data.length;
  const rawMax = Math.max(...data.map((d) => d.v), 1);
  const rough = rawMax / 4, mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= rough) ?? rough;
  const top = Math.max(step * Math.ceil(rawMax / step), 1);
  const bw = (W - padL) / n, gap = n > 20 ? 2 : Math.max(4, bw * 0.28), b = Math.max(Math.min(bw - gap, 44), 2);
  const y = (v: number) => padT + plotH - (v / top) * plotH;
  const every = n > 20 ? 5 : n > 12 ? 2 : 1;
  const ticks: number[] = []; for (let t = 0; t <= top + 1e-9; t += step) ticks.push(t);
  const shown = hover != null ? data[hover] : null;
  return <div className="chart" ref={ref}>
    {width ? <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${MEASURES[measure].label} per ${period === "year" ? "month" : period === "d90" ? "week" : "day"}`}>
      {ticks.map((t) => <g key={t}><line x1={padL} x2={W} y1={y(t)} y2={y(t)} stroke="#2a2f2d" /><text x={padL - 10} y={y(t) + 4} textAnchor="end" fontSize={12} fill="#8a938e">{fmt(t)}</text></g>)}
      {data.map((d, i) => {
        const x = padL + i * bw + (bw - b) / 2, h = (d.v / top) * plotH, r = Math.min(4, b / 2, h);
        return <g key={d.long}>
          {h > 0 ? <path d={`M${x} ${y(0)}V${y(d.v) + r}q0 -${r} ${r} -${r}H${x + b - r}q${r} 0 ${r} ${r}V${y(0)}Z`} fill={MEASURES[measure].color} opacity={hover != null && hover !== i ? 0.55 : 1} /> : null}
          {i % every === 0 || i === n - 1 ? <text x={x + b / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="#8a938e">{d.label}</text> : null}
          <rect x={padL + i * bw} y={padT} width={bw} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        </g>;
      })}
      {note && data[note.index] && W >= 560 ? (() => {
        // The label sits beside the column, on whichever side has room for it.
        const d = data[note.index], centre = padL + note.index * bw + bw / 2, room = note.text.length * 6.6 + 24;
        const right = centre + b / 2 + room < W, x = right ? centre + b / 2 : centre - b / 2, dir = right ? 1 : -1;
        return <g><line x1={x} x2={x + 14 * dir} y1={y(d.v) + 6} y2={y(d.v) + 6} stroke="#8a938e" /><text x={x + 18 * dir} y={y(d.v) + 10} textAnchor={right ? "start" : "end"} fontSize={12} fill="#edf0ee" fontWeight={600} paintOrder="stroke" stroke="#181b1a" strokeWidth={5}>{note.text}</text></g>;
      })() : null}
    </svg> : <div style={{ height: H }} />}
    {shown && hover != null ? <div className="tip" style={{ left: Math.min(Math.max(padL + hover * bw + bw / 2 - 80, 0), W - 170), top: Math.max(y(shown.v) - 96, 0) }}>
      <b>{shown.long}</b><div className="r"><span>Attacks</span><span>{fmt(shown.a)}</span></div><div className="r"><span>People killed</span><span>{fmt(shown.k)}</span></div><div className="r"><span>People abducted</span><span>{fmt(shown.ab)}</span></div>
    </div> : null}
  </div>;
}

/** Binned sequential choropleth. Names and values when wide, values only when narrow. */
export function Choropleth({ values, measure, selected, onSelect, labels = true }: { values: Map<string, number>; measure: Measure; selected?: string | null; onSelect?: (state: string) => void; labels?: boolean }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const narrow = width > 0 && width < 560;
  const selectedPath = selected ? STATES.find((item) => item.name === mapStateName(selected)) : null;
  const unit = (value: number) => value === 1 ? MEASURES[measure].one : MEASURES[measure].noun;
  return <div ref={ref}><svg className="cmap" viewBox="0 0 1000 812" role="img" aria-label={`Nigeria by state, shaded by ${MEASURES[measure].noun}`}>
    {STATES.map((item) => { const name = canonical(item.name); const value = values.get(name) ?? 0;
      return <path key={item.id} d={item.path} data-state={name} fill={fillFor(measure, value)} stroke="#111312" strokeWidth={1.4} onClick={onSelect ? () => onSelect(name) : undefined}><title>{`${name}: ${fmt(value)} ${unit(value)}`}</title></path>; })}
    {selectedPath ? <path d={selectedPath.path} fill="none" stroke="#edf0ee" strokeWidth={3.5} pointerEvents="none" /> : null}
    {labels ? STATES.map((item) => { const name = canonical(item.name); const value = values.get(name) ?? 0; const [dx, dy] = NUDGE[item.name] ?? [0, 0]; const x = item.x + dx, yy = item.y + dy;
      return <g key={`${item.id}-l`} pointerEvents="none" textAnchor="middle" fill={inkFor(measure, value)}>
        {narrow ? <text x={x} y={yy + 10} fontSize={30} fontWeight={700}>{fmt(value)}</text> : <><text x={x} y={yy - 3} fontSize={14} fontWeight={600} opacity={0.8}>{SHORT[item.name] ?? item.name}</text><text x={x} y={yy + 15} fontSize={17} fontWeight={750}>{fmt(value)}</text></>}
      </g>; }) : null}
  </svg></div>;
}

/** States by month: a coloured table, so every value stays readable. */
export function Heatmap({ rows, measure, today, top = 12 }: { rows: SummaryRow[]; measure: Measure; today: string; top?: number }) {
  const months = Number(today.slice(5, 7));
  const totals = new Map<string, number>(); rows.forEach((row) => totals.set(row.s, (totals.get(row.s) ?? 0) + (measure === "attacks" ? 1 : measure === "killed" ? row.k ?? 0 : row.ab ?? 0)));
  const states = [...totals].filter(([name]) => name).sort((a, b) => b[1] - a[1]).slice(0, top);
  const cell = (state: string, month: number) => total(rows.filter((row) => row.s === state && Number(row.d.slice(5, 7)) === month), measure);
  return <div className="heat-scroll"><div className="heat" style={{ ["--cols" as string]: months }} role="table" aria-label={`${MEASURES[measure].label} per month by state`}>
    <div role="row" style={{ display: "contents" }}><span role="columnheader" />{MONTHS.slice(0, months).map((m) => <span key={m} className="h" role="columnheader">{m}</span>)}<span className="h" role="columnheader" style={{ textAlign: "right" }}>Total</span></div>
    {states.map(([state, sum], index) => { const hide = index >= 8 ? "row-hide-sm" : ""; return <div key={state} role="row" style={{ display: "contents" }}>
      <Link className={`st ${hide}`} role="rowheader" href={`/states/${stateSlug(state)}`}>{state}</Link>
      {Array.from({ length: months }, (_, i) => { const v = cell(state, i + 1); return <span key={i} role="cell" className={`c ${hide}`} style={{ background: fillFor(measure, v), color: inkFor(measure, v) }} title={`${state}, ${MONTHS[i]}: ${fmt(v)} ${v === 1 ? MEASURES[measure].one : MEASURES[measure].noun}`}>{v || ""}<span className="sr-only">{v ? "" : "0"}</span></span>; })}
      <span className={`tot ${hide}`} role="cell">{fmt(sum)}</span>
    </div>; })}
  </div></div>;
}

export function Pills({ row, empty = "Toll not reported" }: { row: Pick<SummaryRow, "k" | "ab" | "ko" | "abo">; empty?: string }) {
  if (!row.k && !row.ab) return <span className="pill">{empty}</span>;
  return <>{row.k ? <span className="pill pill--k"><span className="key" />{killedText(row)} killed</span> : null}{row.ab ? <span className="pill pill--a"><span className="key" />{abductedText(row)} abducted</span> : null}</>;
}

export function IncidentCard({ row, today }: { row: SummaryRow; today: string }) {
  return <article className="inc-card">
    <Link className="inc-card__link" href={`/incidents/${row.id}`}>
      <div className="inc-top"><Locator state={row.s} /><div style={{ minWidth: 0 }}><div className="inc-place">{placeName(row)}</div><div className="inc-sub">{placeLine(row)}</div></div></div>
      <div className="inc-title">{row.t}</div>
      <div className="inc-figs"><Pills row={row} /></div>
    </Link>
    <div className="inc-foot"><span>{dayLabel(row)}{row.dp ? "" : `, ${agoLabel(row, today)}`}</span><ShareButton row={row} /></div>
  </article>;
}

export function RowItem({ row }: { row: SummaryRow }) {
  return <li><Link href={`/incidents/${row.id}`}><Locator state={row.s} /><span style={{ minWidth: 0 }}><span className="t">{placeName(row)}, {row.s}</span><span className="s">{dayLabel(row)}. {row.t}</span></span>
    {row.k ? <span className="pill pill--k">{killedText(row)} killed</span> : row.ab ? <span className="pill pill--a">{abductedText(row)} abducted</span> : <span className="pill">No toll yet</span>}</Link></li>;
}


