"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapIcon, TableIcon } from "@/components/icons";
import { PageError, PageSkeleton } from "@/components/PageState";
import { BarList, Change, Choropleth, ColumnChart, Controls, DataTable, Legend, RowItem, Sparkline, StatTile } from "@/components/Viz";
import { MEASURES, PERIODS, ageDays, buckets, byState, dayLabel, fmt, inPeriod, inPreviousPeriod, stateSlug, total, type Measure, type Period } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

export default function OverviewPage() {
  const { data, failed, offline, retry } = useSummary();
  const [measure, setMeasure] = useState<Measure>("attacks");
  const [period, setPeriod] = useState<Period>("year");
  const [view, setView] = useState<"chart" | "table">("chart");

  const derived = useMemo(() => {
    if (!data) return null;
    const { records, today } = data;
    const current = records.filter(inPeriod(period, today));
    const previous = records.filter(inPreviousPeriod(period, today));
    const sparkBuckets = buckets(period === "year" ? "year" : period, today);
    const spark = (m: Measure) => sparkBuckets.map((bucket) => total(records.filter(bucket.test), m));
    const trend = buckets(period, today).map((bucket) => ({ bucket, value: total(records.filter(bucket.test), measure) }));
    const peak = trend.reduce((best, item, i) => item.value > trend[best].value ? i : best, 0);
    const week = records.filter((row) => ageDays(row, today) < 7);
    const ranked = byState(current, measure);
    return { current, previous, spark, trend, peak, week, ranked, states: new Set(current.map((row) => row.s)).size };
  }, [data, period, measure]);

  if (!data && failed) return <PageError title="Attacks across Nigeria" offline={offline} retry={retry} />;
  if (!data || !derived) return <PageSkeleton title="Attacks across Nigeria" />;

  const { today, year, records } = data;
  const { current, previous, spark, trend, peak, week, ranked, states } = derived;
  const M = MEASURES[measure];
  const phrase = PERIODS[period].phrase;
  const days = PERIODS[period].days;
  const unit = period === "year" ? "month" : period === "d90" ? "week" : "day";
  const weeksSoFar = Math.max(1, ageDays({ d: `${year}-01-01` }, today) / 7);
  const weekStart = dayLabel({ d: new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000).toISOString().slice(0, 10) });
  const tile = (m: Measure, label: string) => {
    const value = total(current, m);
    return <StatTile label={label} color={MEASURES[m].color} value={fmt(value)}>
      {days ? <Change current={value} previous={total(previous, m)} days={days} /> : <span className="tile-delta">About {fmt(Math.round(value / weeksSoFar))} a week this year</span>}
      <Sparkline values={spark(m)} color={MEASURES[m].color} />
    </StatTile>;
  };
  // Name the single attack behind the peak when it explains a large share of it.
  const peakRows = measure === "attacks" ? [] : records.filter(trend[peak].bucket.test);
  const biggest = peakRows.reduce<typeof peakRows[number] | undefined>((best, row) => !best || total([row], measure) > total([best], measure) ? row : best, undefined);
  const note = biggest && trend[peak].value && total([biggest], measure) / trend[peak].value >= 0.25
    ? { index: peak, text: `${fmt(total([biggest], measure))} ${measure === "killed" ? "killed" : "abducted"} in one attack, ${biggest.town && biggest.town !== "Unknown" ? `${biggest.town}, ` : ""}${biggest.s}` }
    : undefined;

  return <div data-measure={measure}>
    <div className="page-head">
      <div><h1>Attacks across Nigeria in {year}</h1><p>{fmt(current.length)} attacks {phrase}, counted from published news reports. Tolls are the lowest figure a report gives, so true totals are likely higher.</p></div>
      <Controls measure={measure} onMeasure={setMeasure} period={period} onPeriod={setPeriod} year={year} />
    </div>
    {failed ? <div className="notice">The latest refresh did not complete; these figures are from the last successful request. <button type="button" className="text-link" onClick={retry}>Retry</button></div> : null}

    <div className="panels ov-tiles">
      {tile("attacks", "Attacks")}
      {tile("killed", "People killed")}
      {tile("abducted", "People abducted")}
      <StatTile label="States with attacks" value={<>{states} <small>of 37</small></>}><span className="tile-delta">{states === 37 ? "Every state and the FCT recorded at least one attack." : `${37 - states} had none ${phrase}.`}</span></StatTile>
    </div>

    <div className="panels">
      <section className="card span-8" aria-labelledby="trend-title">
        <div className="card-head">
          <div><h2 id="trend-title">{trend[peak].value ? `${M.label} peaked in ${trend[peak].bucket.long.replace(" (so far)", "")}, with ${fmt(trend[peak].value)}` : `No ${M.noun} ${phrase}`}</h2><p className="ov-trend-note">{M.label} per {unit}, {phrase}. Hover a column for all three measures.</p></div>
          <div className="seg seg--sm" role="group" aria-label="View"><button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button><button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}><TableIcon />Table</button></div>
        </div>
        {view === "table"
          ? <DataTable head={[unit[0].toUpperCase() + unit.slice(1), "Attacks", "Killed", "Abducted"]} rows={trend.map(({ bucket }) => { const items = records.filter(bucket.test); return [bucket.long, items.length, total(items, "killed"), total(items, "abducted")]; })} />
          : <ColumnChart rows={records} period={period} measure={measure} today={today} height={360} note={note} />}
      </section>
      <section className="card span-4 ov-week" aria-labelledby="week-title">
        <div className="card-head" style={{ marginBottom: 8 }}><div><h2 id="week-title">The last 7 days</h2><p>{weekStart} to {dayLabel({ d: today })}</p></div></div>
        <div className="week-n">{fmt(week.length)} {week.length === 1 ? "attack" : "attacks"}</div>
        <div className="week-sub">in {new Set(week.map((row) => row.s)).size} states</div>
        <div className="week-figs"><span className="pill pill--k"><span className="key" />{fmt(total(week, "killed"))} killed</span><span className="pill pill--a"><span className="key" />{fmt(total(week, "abducted"))} abducted</span></div>
        <ul className="rows">{week.slice(0, 5).map((row) => <RowItem key={row.id} row={row} />)}</ul>
        <div className="card-foot"><span>Newest first</span><Link className="text-link" href="/incidents">All incidents</Link></div>
      </section>
    </div>

    <div className="panels">
      <section className="card span-7 ov-map" aria-labelledby="map-title">
        <div className="card-head"><div><h2 id="map-title">{ranked[0] ? `${ranked[0][0]} has the most ${M.noun}` : `No ${M.noun} ${phrase}`}</h2><p>{M.label} by state, {phrase}.</p></div><Link className="btn" href={`/map?m=${measure}`}><MapIcon />Open the map</Link></div>
        <Choropleth values={new Map(ranked)} measure={measure} />
        <div className="card-foot"><Legend measure={measure} /></div>
      </section>
      <section className="card span-5 ov-rank" aria-labelledby="rank-title">
        <div className="card-head"><div><h2 id="rank-title">States with the most {M.noun}</h2><p>{phrase[0].toUpperCase() + phrase.slice(1)}.</p></div></div>
        <BarList entries={ranked.slice(0, 10)} measure={measure} href={(name) => `/states/${stateSlug(name)}`} />
        <div className="card-foot"><span>Select a state to open its page</span><Link className="text-link" href={`/map?m=${measure}`}>See all 37 on the map</Link></div>
      </section>
    </div>

    <Link className="card next-card" href="/patterns" style={{ marginTop: 16 }}>
      <span><b>Look deeper at the patterns</b><span>When each state was hit hardest, the attributed perpetrators and the deadliest attacks of the year.</span></span>
      <span className="btn">Open Patterns</span>
    </Link>
  </div>;
}
