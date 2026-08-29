"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import RecordCard from "@/components/RecordCard";
import SearchableSelect from "@/components/SearchableSelect";
import { STATUS_FILTER_OPTIONS } from "@/lib/filter-options";
import { IncidentRecord } from "@/lib/incident-view";
import { NIGERIA_MAP_DATA, StateMapData } from "@/lib/mapData";
import { normalizeStateName } from "@/lib/normalize-state";

type StateSummary = StateMapData & { count: number; killed: number; kidnapped: number; records: IncidentRecord[] };

function labelLines(name: string) {
  if (name === "Federal Capital Territory") return ["Federal Capital", "Territory"];
  return name.split(" ");
}

export default function MapPage() {
  const [records, setRecords] = useState<IncidentRecord[]>([]); const [selected, setSelected] = useState(""); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine); try { const response = await fetch("/api/attacks?limit=1000&sort=date_desc", { cache: "no-store" }); if (!response.ok) throw new Error("Map request failed"); setRecords((await response.json()).attacks ?? []); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); const update = () => setOffline(!navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, [load]);
  const filtered = useMemo(() => status ? records.filter((record) => record.status === status) : records, [records, status]);
  const stateData = useMemo(() => {
    const initial: Record<string, StateSummary> = {}; Object.values(NIGERIA_MAP_DATA).forEach((item) => { initial[item.name] = { ...item, count: 0, killed: 0, kidnapped: 0, records: [] }; });
    filtered.forEach((record) => { let name = normalizeStateName(record.location?.state || ""); if (name === "FCT") name = "Federal Capital Territory"; const key = Object.keys(initial).find((item) => item.toLowerCase() === name.toLowerCase()); if (key) { initial[key].count += 1; initial[key].killed += record.casualties?.killed ?? 0; initial[key].kidnapped += record.casualties?.kidnapped ?? 0; initial[key].records.push(record); } });
    return initial;
  }, [filtered]);
  const ranked = useMemo(() => Object.values(stateData).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)), [stateData]);
  const active = selected ? stateData[selected] : ranked.find((item) => item.count > 0) ?? ranked[0];
  const max = Math.max(...ranked.map((item) => item.count), 1);
  if (loading && !records.length) return <div className="page-wrap--wide"><LoadingState label="Loading incident map" /></div>;
  if (failed && !records.length) return <div className="page-wrap--wide"><ErrorState offline={offline} retry={load} /></div>;
  return <div className="page-wrap--wide">
    <header className="page-header"><div><span className="eyebrow">Geographic view</span><h1>Nigeria incident map</h1><p className="lede">Explore recorded incidents by state. Circle size represents record count, not a predictive threat score.</p></div><aside className="panel coverage-note"><span className="eyebrow">Map context</span><p className="coverage-note__date">{filtered.length} records</p><p className="coverage-note__fine">The map describes the recorded dataset only.</p></aside></header>
    {failed ? <div className="panel panel--notice" style={{ marginBottom: "1.25rem", padding: "1rem" }}>The last refresh failed; this is the last successful dataset. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}
    <section className="panel filter-panel"><div className="search-row"><label className="filter-label" style={{ flex: 1 }} htmlFor="map-status-filter">Evidence status<SearchableSelect inputId="map-status-filter" ariaLabel="Filter map by evidence status" options={STATUS_FILTER_OPTIONS} value={status} onChange={setStatus} /></label><button className="button-quiet" type="button" onClick={() => { setStatus(""); setSelected(""); }}>Reset map filters</button></div></section>
    <section className="state-panel"><section className="panel map-shell"><div className="panel-heading"><div><h2>Incident distribution</h2><p className="panel-subtitle">State names are shown on the map; select a state or its record-count marker to view records.</p></div></div><svg className="map-graphic" viewBox="0 0 1000 812" aria-hidden="true">{ranked.map((item) => <g key={item.id} className="map-state-group" onClick={() => setSelected(item.name)}><path className={`map-state ${active?.name === item.name ? "map-state--selected" : ""}`} d={item.path} /><title>{item.name}: {item.count} {item.count === 1 ? "record" : "records"}</title></g>)}{ranked.map((item) => { const lines = labelLines(item.name); const radius = item.count ? 10 + (item.count / max) * 18 : 0; const color = item.count / max > .7 ? "#ff493c" : item.count / max > .35 ? "#ff922b" : "#32c759"; const labelY = item.y - Math.max(radius + 8, lines.length * 6); return <g key={`${item.id}-label`} className="map-label-group" onClick={() => setSelected(item.name)}><text className="map-state-label" x={item.x} y={labelY} textAnchor="middle">{lines.map((line, index) => <tspan x={item.x} dy={index === 0 ? 0 : 12} key={line}>{line}</tspan>)}</text>{item.count ? <g className="map-marker"><circle cx={item.x} cy={item.y} r={radius} fill={color} fillOpacity=".96" /><text x={item.x} y={item.y + 5} textAnchor="middle">{item.count}</text></g> : null}</g>; })}</svg><div className="map-legend"><span><i className="dot map-legend__empty" />0 records</span><span><i className="dot" style={{ background: "var(--confirmed)" }} />1–4</span><span><i className="dot" style={{ background: "var(--caution)" }} />5–7</span><span><i className="dot" style={{ background: "var(--human-impact)" }} />8+</span></div></section>
      <aside className="panel state-list-panel"><div className="panel-heading"><div><h2>Recorded states</h2><p className="panel-subtitle">Scrollable list; matches the map labels.</p></div></div><div className="state-list">{ranked.map((item) => <button key={item.name} className="state-list__button" type="button" aria-pressed={active?.name === item.name} onClick={() => setSelected(item.name)}><span><i className="dot" style={{ background: item.count ? undefined : "var(--border-strong)" }} />{item.name}</span><span className="state-list__count">{item.count} {item.count === 1 ? "record" : "records"}</span></button>)}</div></aside>
    </section>
    {active ? <section><div className="section-heading"><h2>Selected · {active.name}</h2><span className="chip chip--burgundy">{active.count} records</span></div><section className="panel summary-strip"><div><span className="eyebrow">Recorded human impact</span><div className="summary-strip__impacts"><span>{active.killed} killed</span><span>{active.kidnapped} abducted</span></div></div><div><span className="summary-strip__fine">Map describes the recorded dataset only.<br /><strong>It does not predict current safety.</strong></span><br /><Link className="text-link" href={`/incidents?state=${encodeURIComponent(active.name === "Federal Capital Territory" ? "FCT" : active.name)}`}>Browse {active.name} records →</Link></div></section>{active.records.length ? <section className="record-list">{active.records.slice(0, 4).map((record) => <RecordCard key={record._id} incident={record} />)}</section> : <EmptyState title={`No ${status || "recorded"} incidents in ${active.name}`}>Choose another state or clear the current map filter.</EmptyState>}</section> : null}
  </div>;
}
