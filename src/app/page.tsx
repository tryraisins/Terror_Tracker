"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { IncidentRecord, formatDateLong, impactParts } from "@/lib/incident-view";

interface StatsData {
  overview: { totalAttacks: number; totalKilled: number; totalInjured: number; totalKidnapped: number; totalDisplaced: number; attacksLast30Days: number; year: number };
  coverage: { sourceLinks: number; confirmed: number; developing: number; unconfirmed: number; multipleSources: number; latestReview: string | null };
  byState: { state: string; count: number }[];
  byGroup: { group: string; count: number }[];
  byMonth: { month: number; count: number }[];
  recentAttacks: IncidentRecord[];
}

const monthName = (month: number) => new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(2026, month - 1, 1));

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(false);
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

  if (loading && !data) return <div className="page-wrap"><LoadingState label="Loading dashboard" /></div>;
  if (failed && !data) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;
  if (!data) return null;

  const { overview, coverage } = data;
  const total = Math.max(overview.totalAttacks, 1);
  const months = data.byMonth.slice(-6);
  const maxMonth = Math.max(...months.map((item) => item.count), 1);
  const maxState = Math.max(...data.byState.map((item) => item.count), 1);
  return <div className="page-wrap">
    <header className="page-header">
      <div><span className="eyebrow">{overview.year} data overview</span><h1>Nigeria incident record</h1><p className="lede">A public-interest record of reported attacks and human harm across Nigeria. Figures reflect published reports and remain subject to correction.</p></div>
      <aside className="panel coverage-note"><span className="eyebrow">Coverage note</span><p className="coverage-note__date">{coverage.latestReview ? `Updated ${formatDateLong(coverage.latestReview)}` : "Update date unavailable"}</p><p className="coverage-note__fine">{overview.totalAttacks} recorded incidents · {coverage.sourceLinks} source links</p><span className="chip chip--burgundy" style={{ marginTop: ".75rem" }}>Not a live safety service</span></aside>
    </header>
    {failed ? <div className="panel panel--notice" style={{ marginBottom: "1.25rem", padding: "1rem" }} role="status">Some dashboard information may be older than the latest request. <button className="text-link" type="button" onClick={load}>Retry</button></div> : null}
    <section className="metric-grid" aria-label="Reported figures">
      <Metric label="Recorded incidents" value={overview.totalAttacks} detail={`${overview.attacksLast30Days} in the last 30 days`} />
      <Metric label="People killed" value={overview.totalKilled} detail="reported minimum" className="metric-card--impact" />
      <Metric label="People injured" value={overview.totalInjured} detail="reported minimum" className="metric-card--caution" />
      <Metric label="People abducted" value={overview.totalKidnapped} detail="reported minimum" className="metric-card--evidence" />
    </section>
    <section className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><div><h2>Monthly incident records</h2><p className="panel-subtitle">Recorded incidents by month</p></div></div>
        <div className="bars" style={{ "--bar-count": months.length || 1 } as CSSProperties}>{months.length ? months.map((item, index) => <div className={`bar ${index === months.length - 1 ? "bar--current" : ""}`} key={item.month}><span className="bar__value">{item.count}</span><div className="bar__column" style={{ height: `${Math.max((item.count / maxMonth) * 100, item.count ? 5 : 0)}%` }} /><span className="bar__label">{monthName(item.month)}</span></div>) : <p className="supporting">No monthly records are available.</p>}</div>
      </section>
      <section className="panel"><div className="panel-heading"><div><h2>Evidence coverage</h2><p className="panel-subtitle">Source depth and review state</p></div></div>
        <Coverage label="Confirmed records" value={coverage.confirmed} total={total} /><Coverage label="Developing" value={coverage.developing} total={total} tone="caution" /><Coverage label="Two or more sources" value={coverage.multipleSources} total={total} tone="confirmed" /><Coverage label="Single-source records" value={Math.max(total - coverage.multipleSources, 0)} total={total} tone="muted" />
        <div className="panel panel--notice" style={{ padding: ".6rem .8rem", marginTop: ".75rem", boxShadow: "none" }}><span className="text-link" style={{ color: "var(--evidence)" }}>Source count is shown on every incident summary.</span></div>
      </section>
    </section>
    <section className="dashboard-grid">
      <section className="panel"><div className="panel-heading"><h2>Most recorded states</h2><Link href="/map" className="text-link">View map →</Link></div><div className="rank-list">{data.byState.slice(0, 5).map((item) => <div className="rank-row" key={item.state}><span>{item.state || "Unknown"}</span><span className="rank-row__track"><span className="rank-row__fill" style={{ width: `${(item.count / maxState) * 100}%` }} /></span><span>{item.count}</span></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><h2>Reported actors</h2><p className="panel-subtitle">Attribution is recorded as reported</p></div></div>{data.byGroup.slice(0, 5).map((item) => <div className="actor-row" key={item.group}><span><i className="dot" />{item.group || "Unknown"}</span><span>{item.count}</span></div>)}</section>
    </section>
    <section><div className="section-heading"><h2>Recent incident records</h2><Link href="/incidents" className="text-link">Browse all {overview.totalAttacks} →</Link></div><div className="card table-card"><table className="records-table"><thead><tr><th>Date / place</th><th>Incident</th><th>Human impact</th><th>Evidence</th></tr></thead><tbody>{data.recentAttacks.map((incident) => <tr key={incident._id}><td><span className="records-table__date">{formatDateLong(incident.date)}</span><br /><strong>{incident.location.state || "Location unknown"}</strong></td><td><Link href={`/incidents/${incident._id}`} className="records-table__title">{incident.title}</Link></td><td className="record-card__impact">{impactParts(incident.casualties).join(" · ") || "Not reported"}</td><td><span className={`status status--${incident.status}`}>{incident.status}</span><br /><span className="evidence-count">{incident.sources?.length || 0} sources</span></td></tr>)}</tbody></table></div></section>
  </div>;
}

function Metric({ label, value, detail, className = "" }: { label: string; value: number; detail: string; className?: string }) { return <article className={`metric-card ${className}`}><div className="metric-card__label">{label}</div><div className="metric-card__value">{value.toLocaleString("en-NG")}</div><span className="metric-card__detail">{detail}</span></article>; }
function Coverage({ label, value, total, tone = "" }: { label: string; value: number; total: number; tone?: "" | "caution" | "confirmed" | "muted" }) { return <div className="coverage-row"><div className="coverage-row__meta"><span>{label}</span><span>{value} / {total}</span></div><span className="coverage-row__track"><span className={`coverage-row__fill ${tone ? `coverage-row__fill--${tone}` : ""}`} style={{ width: `${Math.min((value / total) * 100, 100)}%` }} /></span></div>; }
