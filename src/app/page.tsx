"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import YearChart, { type DayFigures, type MonthFigures, type MonthMeasure } from "@/components/YearChart";
import RecordCard, { placeLabel } from "@/components/RecordCard";
import { IncidentRecord } from "@/lib/incident-view";

interface StatsData {
  period: { timezone: string; month: number; throughDay: number };
  overview: { totalAttacks: number; totalKilled: number; totalInjured: number; totalKidnapped: number; totalDisplaced: number; attacksLast30Days: number; attacksLast7Days?: number; year: number };
  byState: { state: string; count: number }[];
  byGroup: { group: string; count: number; killed?: number }[];
  byMonth: MonthFigures[];
  byDay?: DayFigures[];
  recentAttacks: IncidentRecord[];
}

const monthLong = (month: number) => new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date(2026, month - 1, 1));
const formatNumber = (value: number) => value.toLocaleString("en-NG");
const lagosToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
const MEASURES: [MonthMeasure, string, string][] = [["attacks", "Attacks", "attacks reported"], ["killed", "Deaths", "people reported killed"], ["kidnapped", "Abductions", "people reported abducted"]];

/** Whole Lagos calendar days between today and the record's stored calendar date. */
function daysSince(record?: IncidentRecord) {
  if (!record) return null;
  const recordDay = (record.dateRange?.end || record.date || "").slice(0, 10);
  const diff = Math.round((Date.parse(lagosToday()) - Date.parse(recordDay)) / 86_400_000);
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

function ordinal(day: number) {
  if (day % 100 >= 11 && day % 100 <= 13) return "th";
  return ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
}

export default function HomePage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [measure, setMeasure] = useState<MonthMeasure>("attacks");
  const load = useCallback(async () => {
    setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    try {
      const response = await fetch("/api/stats", { cache: "no-store" });
      if (!response.ok) throw new Error("Stats request failed");
      setData(await response.json());
    } catch {
      setFailed(true);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const update = () => setOffline(!navigator.onLine); window.addEventListener("online", update); window.addEventListener("offline", update); return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); }; }, [load]);

  // Spelling variants of the same actor are shown separately and tagged, never merged.
  const actors = useMemo(() => {
    const seen = new Set<string>();
    return (data?.byGroup ?? []).slice(0, 5).map((item) => {
      const key = (item.group || "").trim().toLowerCase();
      const variant = seen.has(key);
      seen.add(key);
      return { ...item, variant };
    });
  }, [data]);

  if (loading && !data) return <div className="page-wrap"><LoadingState label="Loading the record" /></div>;
  if (failed && !data) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;
  if (!data) return null;

  const { overview } = data;
  const partialMonth = data.byMonth.find((item) => item.partial);
  const periodNote = partialMonth
    ? `${monthLong(partialMonth.month)} runs to the ${data.period.throughDay}${ordinal(data.period.throughDay)}. Fewer records so far do not mean a decline.`
    : "All months shown are complete calendar months.";
  const latest = data.recentAttacks[0];
  const since = daysSince(latest);
  const sinceText = since === null ? "" : since === 0 ? "today" : since === 1 ? "yesterday" : `${since} days ago`;
  const harmed = [["killed", overview.totalKilled], ["abducted", overview.totalKidnapped], ["injured", overview.totalInjured]] as const;
  const harmedTotal = harmed.reduce((sum, [, value]) => sum + value, 0);
  const maxActor = Math.max(...actors.map((item) => item.count), 1);
  const measureNoun = MEASURES.find(([key]) => key === measure)?.[2] ?? "attacks reported";

  return <div className="page-wrap">
    <header className="hero">
      <p className="hero__period">Nigeria, 1 January to {data.period.throughDay} {monthLong(data.period.month)} {overview.year}</p>
      <p className="hero__count">{formatNumber(overview.totalKilled)}</p>
      <div className="hero__row">
        <h1 className="hero__statement">people reported killed in attacks across Nigeria this year.</h1>
        <p className="hero__context">A further {formatNumber(overview.totalKidnapped)} people were abducted. NATracker holds {formatNumber(overview.totalAttacks)} attack records for {overview.year}{latest && sinceText ? <>. The most recent took place {sinceText} in {placeLabel(latest.location, true)}</> : null}.</p>
      </div>
    </header>

    {failed ? <div className="notice" role="status">Some figures may be older than the latest request. <button className="text-link" type="button" onClick={load}>Retry</button></div> : null}

    <section className="year" aria-labelledby="year-title">
      <div className="section-head">
        <div><h2 id="year-title">Every day of {overview.year}</h2><p className="section-head__note">One tick per day, taller for more {measureNoun}. The last seven days are highlighted. {formatNumber(overview.attacksLast30Days)} attacks in the last 30 days{overview.attacksLast7Days !== undefined ? `, ${formatNumber(overview.attacksLast7Days)} of them in the last 7` : ""}.</p></div>
        <div className="tabs" role="group" aria-label="Year chart measure">{MEASURES.map(([key, label]) => <button key={key} type="button" aria-pressed={measure === key} onClick={() => setMeasure(key)}>{label}</button>)}</div>
      </div>
      <YearChart mode={measure} partialNote={periodNote} days={data.byDay ?? []} months={data.byMonth} year={overview.year} throughDay={data.period.throughDay} />
    </section>

    <div className="breakdown">
      <section className="harmed" aria-labelledby="harmed-title">
        <h2 id="harmed-title" className="breakdown__title">People harmed</h2>
        {harmedTotal ? <div className="harmed__bar" aria-hidden="true">{harmed.map(([key, value]) => value ? <span key={key} className={`harmed__seg harmed__seg--${key}`} style={{ flexGrow: value }} /> : null)}</div> : null}
        <dl className="harmed__legend">{harmed.map(([key, value]) => <div key={key} className={`harmed__item harmed__item--${key}`}><dt>{key}</dt><dd>{formatNumber(value)}</dd></div>)}</dl>
        <p className="fine">Totals combine exact counts, estimates and range midpoints. A record with no reported figure is not counted as zero.</p>
      </section>
      <section className="actors" aria-labelledby="actors-title">
        <h2 id="actors-title" className="breakdown__title">Attributed to</h2>
        <ol className="bar-list">{actors.map((item, index) => <li key={`${item.group}-${index}`} className="bar-list__row">
          <span className="bar-list__name">{item.group || "Unknown"}{item.variant ? <em className="tag">variant</em> : null}</span>
          <span className="bar-list__track" aria-hidden="true"><span style={{ width: `${(item.count / maxActor) * 100}%` }} /></span>
          <strong className="bar-list__value">{formatNumber(item.count)}<span className="sr-only"> records</span></strong>
        </li>)}</ol>
        <p className="fine">As named in source reports. Spelling variants are kept separate and tagged. <Link className="text-link" href="/map">All groups and states</Link></p>
      </section>
    </div>

    <section className="latest" aria-labelledby="latest-title">
      <div className="section-head section-head--end"><h2 id="latest-title">Latest records</h2><Link className="text-link" href="/incidents">All {formatNumber(overview.totalAttacks)} records</Link></div>
      <div className="record-list">{data.recentAttacks.map((incident) => <RecordCard key={incident._id} incident={incident} />)}</div>
    </section>
  </div>;
}
