"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import BarChart from "@/components/BarChart";
import NigeriaMap, { MapLegend, mapThresholds } from "@/components/NigeriaMap";
import { ImpactList, RecordDate, placeLabel } from "@/components/RecordCard";
import StatusBadge from "@/components/StatusBadge";
import { IncidentRecord } from "@/lib/incident-view";
import { normalizeStateName } from "@/lib/normalize-state";

interface StatsData {
  period: { timezone: string; month: number; throughDay: number };
  overview: { totalAttacks: number; totalKilled: number; totalInjured: number; totalKidnapped: number; totalDisplaced: number; attacksLast30Days: number; attacksLast7Days?: number; year: number };
  byState: { state: string; count: number }[];
  byGroup: { group: string; count: number; killed?: number }[];
  byMonth: { month: number; count: number; killed: number; kidnapped: number; partial: boolean }[];
  recentAttacks: IncidentRecord[];
}

const monthName = (month: number) => new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(2026, month - 1, 1));
const formatNumber = (value: number) => value.toLocaleString("en-NG");
const lagosToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
const mapStateName = (state: string) => { const name = normalizeStateName(state || ""); return name === "FCT" ? "Federal Capital Territory" : name; };

/** Whole Lagos calendar days between today and the record's stored calendar date. */
function daysSince(record?: IncidentRecord) {
  if (!record) return null;
  const recordDay = (record.dateRange?.end || record.date || "").slice(0, 10);
  const diff = Math.round((Date.parse(lagosToday()) - Date.parse(recordDay)) / 86_400_000);
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [chartView, setChartView] = useState<"incidents" | "impact">("incidents");
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

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data?.byState.forEach((item) => { const name = mapStateName(item.state); counts[name] = (counts[name] ?? 0) + item.count; });
    return counts;
  }, [data]);

  if (loading && !data) return <div className="page-wrap"><LoadingState label="Loading dashboard" /></div>;
  if (failed && !data) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;
  if (!data) return null;

  const { overview } = data;
  const months = data.byMonth;
  const partialMonth = months.find((item) => item.partial);
  const periodNote = partialMonth
    ? `${monthName(partialMonth.month)} is incomplete; this snapshot runs to ${data.period.throughDay} ${monthName(partialMonth.month)}. Fewer records so far do not establish a decline.`
    : "All months shown are complete calendar months.";
  const thresholds = mapThresholds(Math.max(0, ...Object.values(stateCounts)));
  const topStates = data.byState.slice(0, 10);
  const maxState = Math.max(...topStates.map((item) => item.count), 1);
  const latest = data.recentAttacks[0];
  const since = daysSince(latest);
  const seenGroups = new Set<string>();
  const actors = data.byGroup.slice(0, 6).map((item) => {
    const key = (item.group || "").trim().toLowerCase();
    const alias = seenGroups.has(key);
    seenGroups.add(key);
    return { ...item, alias };
  });

  return <div className="page-wrap">
    <header className="hero">
      <div className="hero__copy">
        <span className="kicker kicker--signal">{overview.year} record · 1 Jan – {data.period.throughDay} {monthName(data.period.month)}</span>
        <h1 className="display-title">A public record of reported attacks and the people they harmed.</h1>
        <p className="lede">Every figure links back to published reporting. Counts include exact numbers, estimates and range midpoints, and each record keeps its own evidence status.</p>
      </div>
      <aside className="since" aria-label="Time since the last recorded incident">
        <span className="kicker">Time since last recorded incident</span>
        {since !== null ? <p className="since__value"><strong>{since}</strong> {since === 1 ? "day" : "days"}</p> : <p className="since__value"><strong>—</strong></p>}
        {latest ? <p className="since__note">Last record: {placeLabel(latest.location, true)}, <RecordDateText incident={latest} />. A quiet count can reflect reporting lag, not safety.</p> : null}
        <dl className="since__rows">
          {overview.attacksLast7Days !== undefined ? <div><dt>Last 7 days</dt><dd>{formatNumber(overview.attacksLast7Days)} records</dd></div> : null}
          <div><dt>Last 30 days</dt><dd>{formatNumber(overview.attacksLast30Days)} records</dd></div>
        </dl>
      </aside>
    </header>

    {failed ? <div className="notice" role="status">Some dashboard information may be older than the latest request. <button className="text-link" type="button" onClick={load}>Retry</button></div> : null}

    <section className="ledger" aria-label="Reported figures">
      <Metric label="Recorded incidents" value={overview.totalAttacks} detail={`${formatNumber(overview.attacksLast30Days)} in the last 30 days`} tone="ink" />
      <Metric label="People killed" value={overview.totalKilled} detail="reported count, estimate or midpoint" tone="killed" />
      <Metric label="People abducted" value={overview.totalKidnapped} detail="reported count, estimate or midpoint" tone="abducted" />
      <Metric label="People injured" value={overview.totalInjured} detail="reported count, estimate or midpoint" tone="injured" />
    </section>

    <div className="split">
      <section className="split__main" aria-labelledby="monthly-title">
        <div className="section-head">
          <div><span className="kicker kicker--signal">01 · Monthly record</span><h2 id="monthly-title">{chartView === "incidents" ? "Reported incidents by month" : "Reported human impact by month"}</h2></div>
          <div className="segmented" role="group" aria-label="Monthly chart measure"><button type="button" aria-pressed={chartView === "incidents"} onClick={() => setChartView("incidents")}>Incidents</button><button type="button" aria-pressed={chartView === "impact"} onClick={() => setChartView("impact")}>Human impact</button></div>
        </div>
        {months.length ? <BarChart mode={chartView} partialNote={periodNote} data={months.map((item) => ({ label: monthName(item.month), value: item.count, killed: item.killed, kidnapped: item.kidnapped, partial: item.partial }))} /> : <p className="supporting">No monthly records are available.</p>}
        <p className="note">{chartView === "impact" ? "Deaths and abductions share a people scale, separate from incident counts. " : ""}{periodNote}</p>
      </section>

      <section className="split__side feed" aria-labelledby="latest-title">
        <div className="section-head">
          <div><span className="kicker kicker--signal">02 · Latest records</span><h2 id="latest-title">Most recent records</h2></div>
          <Link href="/incidents" className="text-link">All {formatNumber(overview.totalAttacks)} records</Link>
        </div>
        <ol className="feed__list">{data.recentAttacks.map((incident) => <li className="feed__item" key={incident._id}>
          <RecordDate incident={incident} />
          <div className="feed__body">
            <span className="record-row__place">{placeLabel(incident.location)}</span>
            <Link href={`/incidents/${incident._id}`} className="feed__title">{incident.title}</Link>
            <div className="feed__meta"><ImpactList incident={incident} /><StatusBadge status={incident.status} /><span className="evidence-count">{incident.sources?.length || 0} {(incident.sources?.length || 0) === 1 ? "source" : "sources"}</span></div>
          </div>
        </li>)}</ol>
      </section>
    </div>

    <section className="geo" aria-labelledby="geo-title">
      <div className="section-head section-head--rule">
        <div><span className="kicker kicker--signal">03 · Geography</span><h2 id="geo-title">Where records were filed</h2></div>
        <p className="section-head__caveat">A record index, not a risk ranking. Reporting coverage differs between states.</p>
      </div>
      <div className="geo__grid">
        <div className="geo__map">
          <Link href="/map" className="geo__map-link" aria-label="Open the state map"><NigeriaMap counts={stateCounts} thresholds={thresholds} labels="counts" /></Link>
          <MapLegend thresholds={thresholds} />
        </div>
        <div className="ranked">
          <div className="list-head"><span>Most recorded states</span><span>Share of {formatNumber(overview.totalAttacks)}</span></div>
          <ol>{topStates.map((item, index) => <li className="rank-row" key={item.state || index}>
            <span className="rank-row__pos">{String(index + 1).padStart(2, "0")}</span>
            <span className="rank-row__name">{item.state || "Unknown"}</span>
            <span className="rank-row__track" aria-hidden="true"><span className={`rank-row__fill ${index < 2 ? "rank-row__fill--lead" : ""}`} style={{ width: `${(item.count / maxState) * 100}%` }} /></span>
            <strong className="rank-row__count">{item.count}</strong>
            <span className="rank-row__share">{overview.totalAttacks ? `${((item.count / overview.totalAttacks) * 100).toFixed(1)}%` : "0%"}</span>
          </li>)}</ol>
          <Link href="/map" className="text-link list-foot">Open the full state map</Link>
        </div>
        <div className="actors">
          <div className="list-head"><span>Reported actors</span><span>Records</span></div>
          <ul>{actors.map((item, index) => <li className="actor-row" key={`${item.group}-${index}`}>
            <span><span className="actor-row__name">{item.group || "Unknown"}{item.alias ? <em className="tag tag--ochre">Alias · not merged</em> : null}</span>{item.killed !== undefined ? <span className="actor-row__killed">{formatNumber(item.killed)} killed</span> : null}</span>
            <strong>{item.count}</strong>
          </li>)}</ul>
          <p className="fine">Attribution is recorded exactly as reported. Spelling variants stay separate until a source review merges them.</p>
        </div>
      </div>
    </section>
  </div>;
}

function RecordDateText({ incident }: { incident: IncidentRecord }) {
  // Stored dates are calendar days; format the day itself so range ends do not shift.
  const date = new Date(`${(incident.dateRange?.end || incident.date || "").slice(0, 10)}T12:00:00Z`);
  return <>{Number.isNaN(date.valueOf()) ? "date not recorded" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(date)}</>;
}

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "ink" | "killed" | "abducted" | "injured" }) {
  return <article className={`ledger__item ledger__item--${tone}`}><span className="ledger__label"><i aria-hidden="true" />{label}</span><span className="ledger__value">{formatNumber(value)}</span><span className="ledger__detail">{detail}</span></article>;
}
