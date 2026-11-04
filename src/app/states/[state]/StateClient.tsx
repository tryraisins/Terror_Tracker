"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Locator, MapIcon, ShareIcon } from "@/components/icons";
import { PageError, PageSkeleton } from "@/components/PageState";
import { BarList, Change, ColumnChart, IncidentCard, StatTile } from "@/components/Viz";
import { MEASURES, MEASURE_KEYS, buckets, byKey, byState, fmt, inPeriod, inPreviousPeriod, known, ordinal, stateSlug, total, type Measure } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

type Sort = "new" | "killed" | "abducted";
const SORTS: [Sort, string][] = [["new", "Newest"], ["killed", "Most killed"], ["abducted", "Most abducted"]];
const PAGE = 9;

export default function StateClient({ state }: { state: string }) {
  const { data, failed, offline, retry } = useSummary();
  const [measure, setMeasure] = useState<Measure>("killed");
  const [sort, setSort] = useState<Sort>("new");
  const [shown, setShown] = useState(PAGE);
  const [shareNote, setShareNote] = useState("");
  const rows = useMemo(() => data ? data.records.filter((row) => row.s === state) : [], [data, state]);
  const title = state === "FCT" ? "FCT" : state;

  if (!data && failed) return <PageError title={title} offline={offline} retry={retry} />;
  if (!data) return <PageSkeleton title={title} />;

  const rankOf = (m: Measure) => byState(data.records, m).findIndex(([name]) => name === state) + 1;
  const last30 = rows.filter(inPeriod("d30", data.today)), prev30 = rows.filter(inPreviousPeriod("d30", data.today));
  const trend = buckets("year", data.today).map((bucket) => ({ bucket, value: total(rows.filter(bucket.test), measure) }));
  const peak = trend.reduce((best, item, i) => item.value > trend[best].value ? i : best, 0);
  const sorted = [...rows].sort((a, b) => sort === "new" ? b.d.localeCompare(a.d) : sort === "killed" ? (b.k ?? 0) - (a.k ?? 0) : (b.ab ?? 0) - (a.ab ?? 0));
  const noLga = rows.filter((row) => !known(row.lga)).length;
  const share = async () => {
    const url = `${window.location.origin}/states/${stateSlug(state)}`;
    try {
      if (navigator.share) { await navigator.share({ title: `${title} on NATracker`, text: `${fmt(rows.length)} attacks, ${fmt(total(rows, "killed"))} killed and ${fmt(total(rows, "abducted"))} abducted in ${title} this year.`, url }); return; }
      await navigator.clipboard.writeText(url); setShareNote("Link copied.");
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setShareNote("Copying is blocked in this browser."); }
  };
  const ra = rankOf("attacks");

  return <div data-measure={measure}>
    <nav className="crumbs" aria-label="Breadcrumb"><Link href="/states">States</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
    <section className="card"><div className="s-hero"><div>
      <h1>{title}</h1>
      <p>{fmt(rows.length)} attacks recorded since 1 January{ra === 1 ? ", more than any other state" : ra ? `, the ${ordinal(ra)} most of any state` : ""}. Reports record {fmt(total(rows, "killed"))} people killed and {fmt(total(rows, "abducted"))} abducted.</p>
      <div className="s-actions"><button type="button" className="btn btn-primary" onClick={share}><ShareIcon />Share {title}</button><Link className="btn" href={`/map?s=${encodeURIComponent(state)}`}><MapIcon />See it on the map</Link></div>
      <p className="share-note" role="status" aria-live="polite" style={{ margin: "8px 0 0" }}>{shareNote}</p>
    </div><Locator state={state} /></div></section>

    <div className="panels">
      <StatTile label="Attacks" color={MEASURES.attacks.color} value={fmt(rows.length)}><span className="tile-delta">{ra ? `${ordinal(ra)} of 37 states` : "No attacks recorded"}</span></StatTile>
      <StatTile label="People killed" color={MEASURES.killed.color} value={fmt(total(rows, "killed"))}><span className="tile-delta">{ordinal(rankOf("killed") || 37)} of 37 states</span></StatTile>
      <StatTile label="People abducted" color={MEASURES.abducted.color} value={fmt(total(rows, "abducted"))}><span className="tile-delta">{ordinal(rankOf("abducted") || 37)} of 37 states</span></StatTile>
      <StatTile label="Last 30 days" value={<>{fmt(last30.length)} <small>attacks</small></>}><Change current={last30.length} previous={prev30.length} days={30} /></StatTile>
    </div>

    <section className="card" style={{ marginTop: 16 }} aria-labelledby="trend-title">
      <div className="card-head"><div><h2 id="trend-title">{trend[peak]?.value ? `${MEASURES[measure].label} in ${title} peaked in ${trend[peak].bucket.long.replace(" (so far)", "")}, with ${fmt(trend[peak].value)}` : `No ${MEASURES[measure].noun} recorded in ${title} this year`}</h2><p>Per month, since 1 January. Hover a column for all three measures.</p></div>
        <div className="seg seg--sm" role="group" aria-label="Measure">{MEASURE_KEYS.map((key) => <button key={key} type="button" aria-pressed={measure === key} onClick={() => setMeasure(key)}>{MEASURES[key].short}</button>)}</div></div>
      <ColumnChart rows={rows} period="year" measure={measure} today={data.today} height={280} />
    </section>

    <div className="panels">
      <section className="card span-6"><div className="card-head"><div><h2>Worst-hit local government areas</h2><p>By attacks recorded.{noLga ? ` ${noLga} ${noLga === 1 ? "record gives" : "records give"} no LGA.` : ""}</p></div></div>
        {rows.length ? <BarList entries={byKey(rows, "attacks", (row) => known(row.lga) || null).slice(0, 8)} measure="attacks" /> : <p className="dim" style={{ margin: 0 }}>No attacks recorded.</p>}</section>
      <section className="card span-6"><div className="card-head"><div><h2>Attributed perpetrators</h2><p>Attacks by the group reports attribute them to, spelled as reported.</p></div></div>
        {rows.length ? <BarList entries={byKey(rows, "attacks", (row) => row.g || "Unknown").slice(0, 8)} measure="attacks" wide /> : <p className="dim" style={{ margin: 0 }}>No attacks recorded.</p>}</section>
    </div>

    <div className="page-head" style={{ marginTop: 32 }}><div><h2 style={{ fontSize: 20 }}>Every incident in {title}</h2></div>
      <div className="seg seg--sm" role="group" aria-label="Sort incidents">{SORTS.map(([key, label]) => <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)}>{label}</button>)}</div></div>
    {rows.length ? <div className="feed">{sorted.slice(0, shown).map((row) => <IncidentCard key={row.id} row={row} today={data.today} />)}</div> : <p className="dim">No incidents recorded in {title} this year.</p>}
    {shown < sorted.length ? <div style={{ textAlign: "center", marginTop: 20 }}><button type="button" className="btn" onClick={() => setShown(shown + PAGE)}>Show more ({fmt(sorted.length - shown)} left)</button></div> : null}
  </div>;
}
