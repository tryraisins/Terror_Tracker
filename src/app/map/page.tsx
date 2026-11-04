"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Locator, ShareIcon } from "@/components/icons";
import { PageError, PageSkeleton } from "@/components/PageState";
import { BarList, Choropleth, ColumnChart, Controls, Legend, RowItem } from "@/components/Viz";
import { STATUS_FILTER_OPTIONS } from "@/lib/filter-options";
import { MEASURES, MEASURE_KEYS, PERIODS, byKey, byState, fmt, inPeriod, known, ordinal, stateSlug, total, type Measure, type Period } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

const PREVIEW = 12;

export default function MapPage() {
  // useSearchParams needs a Suspense boundary; the skeleton stands in while it resolves.
  return <Suspense fallback={<PageSkeleton title="Map of attacks" />}><MapView /></Suspense>;
}

function MapView() {
  const params = useSearchParams();
  const { data, failed, offline, retry } = useSummary();
  // ?m= picks the measure and ?s= (or ?state=) selects a state, so map views can be linked.
  const [measure, setMeasure] = useState<Measure>(() => { const m = params.get("m"); return m && (MEASURE_KEYS as string[]).includes(m) ? m as Measure : "attacks"; });
  const [period, setPeriod] = useState<Period>("year");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(() => params.get("s") || params.get("state"));
  const [showAll, setShowAll] = useState(false);

  const scoped = useMemo(() => data ? data.records.filter(inPeriod(period, data.today)).filter((row) => !status || row.st === status) : [], [data, period, status]);
  const ranked = useMemo(() => byState(scoped, measure), [scoped, measure]);

  if (!data && failed) return <PageError title="Map of attacks" offline={offline} retry={retry} />;
  if (!data) return <PageSkeleton title="Map of attacks" />;

  const M = MEASURES[measure];
  const phrase = PERIODS[period].phrase;
  const statusLabel = STATUS_FILTER_OPTIONS.find((option) => option.value === status)?.label.toLowerCase();
  const share = async () => {
    const url = `${window.location.origin}/states/${stateSlug(selected ?? "")}`;
    try { if (navigator.share) await navigator.share({ title: `${selected} on NATracker`, url }); else await navigator.clipboard.writeText(url); } catch { /* dismissed */ }
  };

  let panel;
  if (!selected) {
    panel = <>
      <div className="card-head" style={{ marginBottom: 12 }}><div><h2>All states</h2><p>Ranked by {M.noun}, {phrase}{status ? `, ${statusLabel} only` : ""}.</p></div></div>
      <BarList entries={showAll ? ranked : ranked.slice(0, PREVIEW)} measure={measure} onSelect={setSelected} />
      {ranked.length > PREVIEW ? <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? `Show the top ${PREVIEW}` : `Show all ${ranked.length} states`}</button> : null}
    </>;
  } else {
    const rows = scoped.filter((row) => row.s === selected);
    const rank = ranked.findIndex(([name]) => name === selected) + 1;
    const lgas = byKey(rows, measure, (row) => known(row.lga) || null).slice(0, 5);
    panel = <>
      <button type="button" className="back-btn" onClick={() => setSelected(null)}>All states</button>
      <div className="p-name"><Locator state={selected} /><div><h2>{selected}</h2><span className="dim" style={{ fontSize: 13 }}>{rank ? `${ordinal(rank)} of 37 by ${M.noun}` : `No records ${phrase}`}</span></div></div>
      <div className="p-tiles">
        <div><b>{fmt(rows.length)}</b><span><span className="key" style={{ color: MEASURES.attacks.color }} />Attacks</span></div>
        <div><b>{fmt(total(rows, "killed"))}</b><span><span className="key" style={{ color: MEASURES.killed.color }} />Killed</span></div>
        <div><b>{fmt(total(rows, "abducted"))}</b><span><span className="key" style={{ color: MEASURES.abducted.color }} />Abducted</span></div>
      </div>
      <div className="p-sub">{M.label} by month, {data.year}</div>
      <ColumnChart rows={data.records.filter((row) => row.s === selected && (!status || row.st === status))} period="year" measure={measure} today={data.today} height={150} />
      {lgas.length ? <><div className="p-sub">Worst-hit local government areas</div><BarList entries={lgas} measure={measure} /></> : null}
      <div className="p-sub">Latest incidents</div>
      {rows.length ? <ul className="rows">{rows.slice(0, 4).map((row) => <RowItem key={row.id} row={row} />)}</ul> : <p className="dim" style={{ margin: 0 }}>No incidents {phrase}{status ? ` with this status` : ""}.</p>}
      <div className="p-actions"><Link className="btn btn-primary" href={`/states/${stateSlug(selected)}`}>Open the {selected} page</Link><button type="button" className="btn" onClick={share} aria-label={`Share the ${selected} page`}><ShareIcon />Share</button></div>
    </>;
  }

  return <div data-measure={measure}>
    <div className="page-head">
      <div><h1>Map of attacks</h1><p>{M.label} in each state {phrase}. Select a state to see its numbers, its worst-hit areas and its latest incidents. Shading counts reported harm; it does not predict risk.</p></div>
      <div className="controls">
        <Controls measure={measure} onMeasure={setMeasure} period={period} onPeriod={setPeriod} year={data.year} />
        <label className="sr-only" htmlFor="map-status">Reporting status</label>
        <select id="map-status" className="field" style={{ width: "auto", height: 46 }} value={status} onChange={(event) => setStatus(event.target.value)}>{STATUS_FILTER_OPTIONS.map((option) => <option key={option.value || "any"} value={option.value}>{option.label}</option>)}</select>
      </div>
    </div>
    {failed ? <div className="notice">The latest refresh did not complete; this is the last successful dataset. <button type="button" className="text-link" onClick={retry}>Retry</button></div> : null}
    <div className="map-layout">
      <section className="card map-card" aria-label={`Map of ${M.noun}`}>
        <Choropleth values={new Map(ranked)} measure={measure} selected={selected} onSelect={setSelected} />
        <div className="card-foot" style={{ marginTop: 8 }}><Legend measure={measure} /><span>Brighter means more</span></div>
      </section>
      <aside className="card map-panel" aria-live="polite" aria-label={selected ? `Selected state: ${selected}` : "All states"}>{panel}</aside>
    </div>
  </div>;
}
