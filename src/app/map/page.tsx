"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import NigeriaMap, { MapLegend, mapThresholds, mapTier } from "@/components/NigeriaMap";
import { ImpactList } from "@/components/RecordCard";
import StatusBadge from "@/components/StatusBadge";
import { STATUS_FILTER_OPTIONS } from "@/lib/filter-options";
import { IncidentRecord, IncidentStatus, incidentDateLabel } from "@/lib/incident-view";
import { NIGERIA_MAP_DATA, StateMapData } from "@/lib/mapData";
import { normalizeStateName } from "@/lib/normalize-state";

type StateSummary = StateMapData & { count: number; killed: number; injured: number; kidnapped: number; byStatus: Record<IncidentStatus, number>; records: IncidentRecord[] };

const STATUS_ORDER: IncidentStatus[] = ["confirmed", "developing", "unconfirmed"];
const filterParam = (name: string) => name === "Federal Capital Territory" ? "FCT" : name;

export default function MapPage() {
  const [records, setRecords] = useState<IncidentRecord[]>([]); const [selected, setSelected] = useState(""); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine); try { const response = await fetch("/api/attacks?limit=1000&sort=date_desc", { cache: "no-store" }); if (!response.ok) throw new Error("Map request failed"); setRecords((await response.json()).attacks ?? []); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); const update = () => setOffline(!navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, [load]);
  const filtered = useMemo(() => status ? records.filter((record) => record.status === status) : records, [records, status]);
  const stateData = useMemo(() => {
    const initial: Record<string, StateSummary> = {}; Object.values(NIGERIA_MAP_DATA).forEach((item) => { initial[item.name] = { ...item, count: 0, killed: 0, injured: 0, kidnapped: 0, byStatus: { confirmed: 0, developing: 0, unconfirmed: 0 }, records: [] }; });
    filtered.forEach((record) => { let name = normalizeStateName(record.location?.state || ""); if (name === "FCT") name = "Federal Capital Territory"; const key = Object.keys(initial).find((item) => item.toLowerCase() === name.toLowerCase()); if (key) { const entry = initial[key]; entry.count += 1; entry.killed += record.casualties?.killed ?? 0; entry.injured += record.casualties?.injured ?? 0; entry.kidnapped += record.casualties?.kidnapped ?? 0; if (entry.byStatus[record.status] !== undefined) entry.byStatus[record.status] += 1; entry.records.push(record); } });
    return initial;
  }, [filtered]);
  const stateSummaries = useMemo(() => Object.values(stateData).sort((a, b) => a.name.localeCompare(b.name)), [stateData]);
  const counts = useMemo(() => Object.fromEntries(stateSummaries.map((item) => [item.name, item.count])), [stateSummaries]);
  const thresholds = mapThresholds(Math.max(0, ...stateSummaries.map((item) => item.count)));
  const active = selected ? stateData[selected] : [...stateSummaries].sort((a, b) => b.count - a.count)[0];
  if (loading && !records.length) return <div className="page-wrap"><LoadingState label="Loading incident map" /></div>;
  if (failed && !records.length) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;
  const share = active && filtered.length ? ((active.count / filtered.length) * 100).toFixed(1) : "0";

  return <div className="page-wrap">
    <header className="page-head">
      <div className="page-head__copy"><span className="kicker kicker--signal">Geographic view</span><h1 className="page-title">Records by state</h1><p className="lede">Each state is shaded by how many records were filed there. Coverage effort varies between states, so shade is a record count, not a measure of risk.</p></div>
      <div className="map-controls">
        <span className="filter-group__label" id="map-status-label">Evidence status</span>
        <div className="segmented segmented--fill" role="group" aria-labelledby="map-status-label">{STATUS_FILTER_OPTIONS.map((option) => <button key={option.value || "all"} type="button" aria-pressed={status === option.value} onClick={() => setStatus(option.value)}>{option.value ? option.label : "All"}</button>)}</div>
        <p className="fine">{filtered.length.toLocaleString("en-NG")} records in this view. This is a record index, not a national census.{status || selected ? <> <button className="text-link" type="button" onClick={() => { setStatus(""); setSelected(""); }}>Reset map</button></> : null}</p>
      </div>
    </header>
    {failed ? <div className="notice">The last refresh failed; this is the last successful dataset. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}

    <div className="map-layout">
      <section className="map-layout__map" aria-label="Map of recorded incidents by state">
        <NigeriaMap counts={counts} thresholds={thresholds} labels="names" selected={active?.name} onSelect={setSelected} />
        <MapLegend thresholds={thresholds} selectedLabel />
      </section>

      {active ? <aside className="state-panel" aria-live="polite" aria-label={`Selected state: ${active.name}`}>
        <span className="kicker kicker--signal">Selected state</span>
        <div className="state-panel__name"><h2>{active.name}</h2><span className="fine">{active.count} {active.count === 1 ? "record" : "records"} · {share}% of this view</span></div>
        <dl className="state-panel__figures">
          <div className="state-panel__figure--killed"><dt>Killed</dt><dd>{active.killed.toLocaleString("en-NG")}</dd></div>
          <div><dt>Injured</dt><dd>{active.injured.toLocaleString("en-NG")}</dd></div>
          <div><dt>Abducted</dt><dd>{active.kidnapped.toLocaleString("en-NG")}</dd></div>
        </dl>
        {active.count ? <div className="evidence-mix">
          <span className="list-head"><span>Evidence status of these records</span></span>
          <div className="evidence-mix__bar" aria-hidden="true">{STATUS_ORDER.map((key) => active.byStatus[key] ? <span key={key} className={`evidence-mix__seg evidence-mix__seg--${key}`} style={{ flexGrow: active.byStatus[key] }} /> : null)}</div>
          <ul className="evidence-mix__key">{STATUS_ORDER.map((key) => <li key={key}><i className={`evidence-mix__swatch evidence-mix__seg--${key}`} />{key[0].toUpperCase() + key.slice(1)} {active.byStatus[key]}</li>)}</ul>
        </div> : null}
        <p className="fine">Totals add the stored figures for each record and may include estimates or range midpoints. They cannot be compared as prevalence and do not predict current safety.</p>
        {active.records.length ? <div className="state-panel__records">
          <span className="list-head"><span>Latest in {active.name}</span></span>
          <ol>{active.records.slice(0, 3).map((record) => <li key={record._id}>
            <span className="record-row__place">{incidentDateLabel(record)}{record.location.lga && record.location.lga.toLowerCase() !== "unknown" ? ` · ${record.location.lga}` : ""}</span>
            <Link href={`/incidents/${record._id}`} className="feed__title">{record.title}</Link>
            <span className="feed__meta"><ImpactList incident={record} /><StatusBadge status={record.status} /></span>
          </li>)}</ol>
        </div> : <p className="supporting">No {status || "recorded"} incidents in {active.name}. Choose another state or clear the evidence filter.</p>}
        <Link className="button state-panel__cta" href={`/incidents?state=${encodeURIComponent(filterParam(active.name))}`}>Browse all {active.name} records</Link>
      </aside> : null}
    </div>

    <section className="state-index" aria-labelledby="state-index-title">
      <div className="section-head section-head--rule"><div><span className="kicker kicker--signal">State index</span><h2 id="state-index-title">All 36 states and the FCT</h2></div><p className="section-head__caveat">Alphabetical navigation. Counts are not a risk ranking.</p></div>
      <div className="state-index__grid">{stateSummaries.map((item) => <button key={item.name} className="state-index__button" type="button" aria-pressed={active?.name === item.name} onClick={() => { setSelected(item.name); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
        <span><i className={`map-swatch map-swatch--${mapTier(item.count, thresholds)}`} aria-hidden="true" />{item.name}</span><span className="state-index__count">{item.count}<span className="sr-only"> {item.count === 1 ? "record" : "records"}</span></span>
      </button>)}</div>
    </section>
  </div>;
}
