"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import NigeriaMap, { MapLegend, mapThresholds } from "@/components/NigeriaMap";
import { ImpactList, rowPlace } from "@/components/RecordCard";
import { STATUS_FILTER_OPTIONS } from "@/lib/filter-options";
import { IncidentRecord, incidentDateLabel } from "@/lib/incident-view";
import { NIGERIA_MAP_DATA, StateMapData } from "@/lib/mapData";
import { normalizeStateName } from "@/lib/normalize-state";

type Measure = "count" | "killed" | "kidnapped";
type StateSummary = StateMapData & { count: number; killed: number; injured: number; kidnapped: number; records: IncidentRecord[] };

const MEASURES: { key: Measure; label: string; legend: string; ranking: string; unit: [string, string] }[] = [
  { key: "count", label: "Attacks", legend: "Attacks per state", ranking: "States by attacks", unit: ["attack", "attacks"] },
  { key: "killed", label: "Deaths", legend: "People killed per state", ranking: "States by deaths", unit: ["person killed", "people killed"] },
  { key: "kidnapped", label: "Abductions", legend: "People abducted per state", ranking: "States by abductions", unit: ["person abducted", "people abducted"] },
];
const RANK_PREVIEW = 12;
const filterParam = (name: string) => name === "Federal Capital Territory" ? "FCT" : name;
const formatNumber = (value: number) => value.toLocaleString("en-NG");

export default function MapPage() {
  const [records, setRecords] = useState<IncidentRecord[]>([]); const [selected, setSelected] = useState(""); const [status, setStatus] = useState(""); const [measure, setMeasure] = useState<Measure>("count"); const [showAll, setShowAll] = useState(false); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [offline, setOffline] = useState(false);
  const mapRef = useRef<HTMLElement>(null);
  const load = useCallback(async () => { setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine); try { const response = await fetch("/api/attacks?limit=1000&sort=date_desc", { cache: "no-store" }); if (!response.ok) throw new Error("Map request failed"); setRecords((await response.json()).attacks ?? []); } catch { setFailed(true); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); const update = () => setOffline(!navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, [load]);
  const filtered = useMemo(() => status ? records.filter((record) => record.status === status) : records, [records, status]);
  const stateData = useMemo(() => {
    const initial: Record<string, StateSummary> = {}; Object.values(NIGERIA_MAP_DATA).forEach((item) => { initial[item.name] = { ...item, count: 0, killed: 0, injured: 0, kidnapped: 0, records: [] }; });
    filtered.forEach((record) => { let name = normalizeStateName(record.location?.state || ""); if (name === "FCT") name = "Federal Capital Territory"; const key = Object.keys(initial).find((item) => item.toLowerCase() === name.toLowerCase()); if (key) { const entry = initial[key]; entry.count += 1; entry.killed += record.casualties?.killed ?? 0; entry.injured += record.casualties?.injured ?? 0; entry.kidnapped += record.casualties?.kidnapped ?? 0; entry.records.push(record); } });
    return initial;
  }, [filtered]);
  const summaries = useMemo(() => Object.values(stateData), [stateData]);
  const ranked = useMemo(() => [...summaries].sort((a, b) => b[measure] - a[measure] || b.count - a.count || a.name.localeCompare(b.name)), [summaries, measure]);
  const byAttacks = useMemo(() => [...summaries].sort((a, b) => b.count - a.count), [summaries]);
  // Actors as named in reporting; spelling variants are counted separately and tagged, never merged.
  const actors = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((record) => { const group = (record.group || "Unknown").trim(); counts.set(group, (counts.get(group) ?? 0) + 1); });
    const seen = new Set<string>();
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([group, count]) => { const key = group.toLowerCase(); const variant = seen.has(key); seen.add(key); return { group, count, variant }; });
  }, [filtered]);
  const values = useMemo(() => Object.fromEntries(summaries.map((item) => [item.name, item[measure]])), [summaries, measure]);
  const config = MEASURES.find((item) => item.key === measure) ?? MEASURES[0];

  if (loading && !records.length) return <div className="page-wrap"><LoadingState label="Loading incident map" /></div>;
  if (failed && !records.length) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;

  const thresholds = mapThresholds(Math.max(0, ...Object.values(values)));
  const active = selected ? stateData[selected] : byAttacks[0];
  const attackRank = active ? byAttacks.findIndex((item) => item.name === active.name) + 1 : 0;
  const share = active && filtered.length ? ((active.count / filtered.length) * 100).toFixed(1) : "0";
  const maxRanked = Math.max(ranked[0]?.[measure] ?? 0, 1);
  const maxActor = Math.max(actors[0]?.count ?? 0, 1);
  const choose = (name: string) => { setSelected(name); mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return <div className="page-wrap">
    <header className="page-head page-head--split">
      <div><h1 className="page-title">Where attacks were reported</h1><p className="lede">{formatNumber(filtered.length)} records, mapped by the state where each attack was reported. Select a state to see its figures and latest records. Shading is a record count, not a measure of risk.</p></div>
      <div className="page-head__controls">
        <div className="tabs" role="group" aria-label="Map measure">{MEASURES.map((item) => <button key={item.key} type="button" aria-pressed={measure === item.key} onClick={() => setMeasure(item.key)}>{item.label}</button>)}</div>
        <div className="tabs tabs--quiet" role="group" aria-label="Evidence status">{STATUS_FILTER_OPTIONS.map((option) => <button key={option.value || "all"} type="button" aria-pressed={status === option.value} onClick={() => setStatus(option.value)}>{option.value ? option.label : "All statuses"}</button>)}</div>
      </div>
    </header>
    {failed ? <div className="notice">The last refresh failed; this is the last successful dataset. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}

    <div className="map-layout">
      <section className="map-layout__map" ref={mapRef} aria-label={`Map of ${config.legend.toLowerCase()}`}>
        <NigeriaMap counts={values} thresholds={thresholds} labels="auto" selected={active?.name} onSelect={setSelected} unit={config.unit} />
        <MapLegend thresholds={thresholds} selectedLabel title={config.legend} />
      </section>

      {active ? <aside className="state-panel" aria-live="polite" aria-label={`Selected state: ${active.name}`}>
        <div className="state-panel__name"><h2>{active.name}</h2><p>{formatNumber(active.count)} {active.count === 1 ? "attack" : "attacks"}{active.count ? (attackRank === 1 ? ", the most of any state in this view" : `, ${share}% of this view`) : ""}</p></div>
        <dl className="figure-row">
          <div className="figure-row__item figure-row__item--killed"><dt>killed</dt><dd>{formatNumber(active.killed)}</dd></div>
          <div className="figure-row__item figure-row__item--abducted"><dt>abducted</dt><dd>{formatNumber(active.kidnapped)}</dd></div>
          <div className="figure-row__item figure-row__item--injured"><dt>injured</dt><dd>{formatNumber(active.injured)}</dd></div>
        </dl>
        {active.records.length ? <div className="state-panel__records">
          <h3>Latest in {active.name}</h3>
          <ol>{active.records.slice(0, 3).map((record) => <li key={record._id}>
            <span className="state-panel__meta">{incidentDateLabel(record)} · {rowPlace(record.location).split(" · ")[0]}</span>
            <Link href={`/incidents/${record._id}`} className="state-panel__title">{record.title}</Link>
            <span className="state-panel__impact"><ImpactList incident={record} /></span>
          </li>)}</ol>
        </div> : <p className="supporting">No {status || "recorded"} attacks in {active.name}. Choose another state or clear the status filter.</p>}
        <p className="fine">Totals add the stored figures for each record and may include estimates or range midpoints.</p>
        <Link className="text-link" href={`/incidents?state=${encodeURIComponent(filterParam(active.name))}`}>All {formatNumber(active.count)} {active.name} records</Link>
      </aside> : null}
    </div>

    <div className="rankings">
      <section aria-labelledby="ranking-title">
        <div className="section-head section-head--rule"><div><h2 id="ranking-title">{config.ranking}</h2><p className="section-head__note">{showAll ? "All 36 states and the FCT." : `Top ${RANK_PREVIEW} of 37.`} Select a state to show it on the map.</p></div></div>
        <ol className="bar-list bar-list--ranked">{(showAll ? ranked : ranked.slice(0, RANK_PREVIEW)).map((item, index) => <li key={item.name}>
          <button type="button" className="bar-list__row" aria-pressed={active?.name === item.name} onClick={() => choose(item.name)}>
            <span className="bar-list__rank">{index + 1}</span>
            <span className="bar-list__name">{item.name}</span>
            <span className="bar-list__track" aria-hidden="true"><span style={{ width: `${(item[measure] / maxRanked) * 100}%` }} /></span>
            <strong className="bar-list__value">{formatNumber(item[measure])}<span className="sr-only"> {item[measure] === 1 ? config.unit[0] : config.unit[1]}</span></strong>
          </button>
        </li>)}</ol>
        <button type="button" className="text-link list-toggle" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? `Show top ${RANK_PREVIEW}` : "Show all 37"}</button>
      </section>
      <section aria-labelledby="actors-title">
        <div className="section-head section-head--rule"><div><h2 id="actors-title">Attributed to</h2><p className="section-head__note">As named in source reports. Spelling variants are kept separate and tagged.</p></div></div>
        <ol className="bar-list">{actors.map((item, index) => <li key={item.group} className="bar-list__row">
          <span className="bar-list__rank">{index + 1}</span>
          <span className="bar-list__name">{item.group}{item.variant ? <em className="tag">variant</em> : null}</span>
          <span className="bar-list__track" aria-hidden="true"><span style={{ width: `${(item.count / maxActor) * 100}%` }} /></span>
          <strong className="bar-list__value">{formatNumber(item.count)}<span className="sr-only"> records</span></strong>
        </li>)}</ol>
      </section>
    </div>
  </div>;
}
