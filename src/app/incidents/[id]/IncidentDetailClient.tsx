"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import RecordCard from "@/components/RecordCard";
import StatusBadge from "@/components/StatusBadge";
import { IncidentRecord, casualtyDetail, displayValue, formatDateLong, incidentDateLabel, locationLabel, locationPrecisionLabel } from "@/lib/incident-view";
import type { CasualtyCountMetadata } from "@/lib/incident-uncertainty";
import ShareIncident from "@/components/ShareIncident";
import { SITE_URL } from "@/lib/site-config";

const DATE_PRECISION_LABEL: Record<string, string> = { exact_day: "exact day", date_range: "date range", month_only: "month only" };

const publishedLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(date);
};

const historyLabel = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Not recorded" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(date);
};

export default function IncidentDetailPage({ id, initialRecord }: { id: string; initialRecord: IncidentRecord | null }) {
  const [record, setRecord] = useState<IncidentRecord | null>(initialRecord); const [related, setRelated] = useState<IncidentRecord[]>([]); const [relatedFailed, setRelatedFailed] = useState(false); const [loading, setLoading] = useState(!initialRecord); const [failed, setFailed] = useState(false); const [notFound, setNotFound] = useState(false); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => { if (!id) return; setLoading(true); setFailed(false); setNotFound(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine); try { const response = await fetch(`/api/attacks/${id}`, { cache: "no-store" }); if (response.status === 404) { setNotFound(true); return; } if (!response.ok) throw new Error("Record unavailable"); const payload = await response.json(); const next = payload.attack as IncidentRecord; setRecord(next); const linked = await fetch(`/api/attacks?state=${encodeURIComponent(next.location.state)}&limit=4&sort=date_desc`, { cache: "no-store" }); setRelatedFailed(!linked.ok); if (linked.ok) { const result = await linked.json(); setRelated((result.attacks ?? []).filter((item: IncidentRecord) => item._id !== next._id).slice(0, 3)); } } catch { setFailed(true); } finally { setLoading(false); } }, [id]);
  useEffect(() => { load(); }, [load]);
  if (loading && !record) return <div className="page-wrap"><LoadingState label="Loading incident record" /></div>;
  if (notFound) return <div className="page-wrap"><EmptyState title="Record not found" action={<Link className="button-secondary" href="/incidents">Browse incident records</Link>}>This record may not exist or may no longer be included in the public record.</EmptyState></div>;
  if (failed && !record) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;
  if (!record) return null;
  const sources = record.sources ?? [];
  const lga = record.location.lga && record.location.lga.toLowerCase() !== "unknown" ? record.location.lga : "";
  const precision = DATE_PRECISION_LABEL[record.datePrecision || "exact_day"] ?? "";
  const impacts: [string, number | null, CasualtyCountMetadata | undefined, string, string][] = [
    ["People killed", record.casualties.killed, record.casualtyMeta?.killed, "No deaths reported", "killed"],
    ["People injured", record.casualties.injured, record.casualtyMeta?.injured, "No injuries reported", "injured"],
    ["People abducted", record.casualties.kidnapped, record.casualtyMeta?.kidnapped, "No abductions reported", "abducted"],
    ["People displaced", record.casualties.displaced, record.casualtyMeta?.displaced, "No displacement reported", "displaced"],
  ];

  return <div className="page-wrap">
    <header className="record-head">
      <div className="record-head__copy">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/incidents">Incidents</Link><span aria-hidden="true">/</span><Link href={`/incidents?state=${encodeURIComponent(record.location.state)}`}>{record.location.state || "Location unknown"}</Link>{lga ? <><span aria-hidden="true">/</span><span>{lga}</span></> : null}</nav>
        <div className="badges"><StatusBadge status={record.status} /><span className="tag">{sources.length} {sources.length === 1 ? "source" : "sources"}</span><span className="tag">Location: {locationPrecisionLabel(record.location)}</span></div>
        <h1 className="record-title">{record.title}</h1>
        <ul className="record-meta">
          <li><span className="sr-only">Location: </span>{locationLabel(record.location)}</li>
          <li><span className="sr-only">Incident date: </span>{incidentDateLabel(record, true)}{precision ? ` · ${precision}` : ""}</li>
          <li>Last updated {formatDateLong(record.updatedAt)}</li>
        </ul>
      </div>
      <ShareIncident title={record.title} shareUrl={`${SITE_URL}/incidents/${record._id}`} />
    </header>

    {failed ? <div className="notice">Related records could not be refreshed. The record below is from the last successful request. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}

    <section className="impact-band" aria-label="Reported human impact">{impacts.map(([label, value, meta, zero, tone]) => <ImpactFigure key={label} label={label} value={value} meta={meta} zeroLabel={zero} tone={tone} />)}</section>

    <div className="record-body">
      <article className="record-body__main">
        <span className="kicker kicker--signal">What was reported</span>
        <p className="record-prose">{record.description || "No narrative summary is available for this record."}</p>
        <dl className="facts">
          <div><dt>Recorded location</dt><dd>{locationLabel(record.location)}{record.location.notes ? <small>{record.location.notes}</small> : null}</dd></div>
          <div><dt>Incident date</dt><dd>{incidentDateLabel(record, true)}{precision ? ` · ${precision}` : ""}{record.dateEvidence ? <small>Supported by source text: “{record.dateEvidence}”</small> : null}</dd></div>
          <div><dt>Reported actor</dt><dd>{record.group || "Unknown"}<small>Recorded as reported; not independently attributed.</small></dd></div>
          <div><dt>Tags</dt><dd>{record.tags?.length ? <span className="tag-list">{record.tags.map((tag) => <span className="tag" key={tag}>{tag.replace(/-/g, " ")}</span>)}</span> : "Not recorded"}</dd></div>
        </dl>
      </article>
      <aside className="record-body__side">
        <section className="evidence" aria-labelledby="evidence-title">
          <div className="section-head section-head--rule"><div><span className="kicker kicker--signal">Evidence</span><h2 id="evidence-title">{sources.length} cited {sources.length === 1 ? "report" : "reports"}</h2></div></div>
          {sources.length ? <ol className="source-list">{sources.map((source, index) => { const published = publishedLabel(source.publishedAt); return <li className="source-item" key={`${source.url}-${index}`}>
            <span className="source-item__index">{String(index + 1).padStart(2, "0")}</span>
            <div><span className="source-item__publisher">{source.publisher || "Publisher not recorded"}</span><span className="source-item__title">{source.title || "Source title not recorded"}</span>
              <span className="source-item__foot">{published ? <span>Published {published} WAT</span> : <span>Publication time not recorded</span>}<a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">Open source report<span className="sr-only"> (opens in a new tab)</span></a></span></div>
          </li>; })}</ol> : <p className="supporting">No source links were returned for this record.</p>}
        </section>
        <section className="history" aria-labelledby="history-title">
          <h2 id="history-title" className="list-head"><span>Record history</span></h2>
          <ol>{record.updatedAt ? <li><time dateTime={record.updatedAt}>{historyLabel(record.updatedAt)}</time><span><strong>Last updated</strong> Record metadata was updated.</span></li> : null}{record.createdAt ? <li><time dateTime={record.createdAt}>{historyLabel(record.createdAt)}</time><span><strong>Created</strong> Added to the public incident archive.</span></li> : null}{!record.updatedAt && !record.createdAt ? <li>History timestamps were not returned for this record.</li> : null}</ol>
        </section>
      </aside>
    </div>

    <section className="related" aria-labelledby="related-title">
      <div className="section-head section-head--rule"><h2 id="related-title">Other recent records from {record.location.state}</h2><Link className="text-link" href={`/incidents?state=${encodeURIComponent(record.location.state)}`}>All {record.location.state} records</Link></div>
      {related.length ? <div className="related__grid">{related.map((item) => <RecordCard key={item._id} incident={item} compact />)}</div> : relatedFailed ? <div className="notice">Related records could not be loaded right now. <button type="button" className="text-link" onClick={load}>Retry</button></div> : <EmptyState title="No related records are available">No other recent records from this state were returned.</EmptyState>}
    </section>
  </div>;
}

function ImpactFigure({ label, value, meta, zeroLabel, tone }: { label: string; value: number | null; meta?: CasualtyCountMetadata; zeroLabel: string; tone: string }) {
  // Same value/detail contract as the previous metric cards: zero/not-reported and unknown stay distinct.
  const valueLabel = displayValue(value, zeroLabel, meta);
  const quiet = value === 0 || meta?.precision === "not_reported" || valueLabel === "Unknown";
  const quote = !quiet ? meta?.sourceText : undefined;
  return <article className={`impact-figure impact-figure--${tone} ${quote ? "impact-figure--quoted" : ""}`}>
    <span className="ledger__label"><i aria-hidden="true" />{label}</span>
    <div className="impact-figure__row">
      <span className={`impact-figure__value ${quiet ? "impact-figure__value--quiet" : ""} ${!quiet && /[a-z]/i.test(valueLabel) ? "impact-figure__value--text" : ""}`}>{valueLabel}</span>
      {quote ? <blockquote className="impact-figure__quote"><span className="kicker">Source text</span><p>“{quote}”</p></blockquote> : null}
    </div>
    <span className="impact-figure__detail">{casualtyDetail(value, meta)}</span>
  </article>;
}
