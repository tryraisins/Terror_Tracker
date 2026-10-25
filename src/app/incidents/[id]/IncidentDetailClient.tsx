"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import RecordCard, { rowPlace } from "@/components/RecordCard";
import StatusBadge from "@/components/StatusBadge";
import { IncidentRecord, IncidentStatus, casualtyDetail, displayValue, incidentDateLabel, locationLabel, locationPrecisionLabel } from "@/lib/incident-view";
import type { CasualtyCountMetadata } from "@/lib/incident-uncertainty";
import ShareIncident from "@/components/ShareIncident";
import { SITE_URL } from "@/lib/site-config";

const DATE_PRECISION_LABEL: Record<string, string> = { exact_day: "exact day", date_range: "date range", month_only: "month only" };
const STATUS_TEXT: Record<IncidentStatus, string> = {
  confirmed: "Two or more cited sources, or an official statement plus a cited publisher.",
  developing: "Credible reporting exists, but important details or outcomes may still change.",
  unconfirmed: "A single source or incomplete corroboration. Use with additional caution.",
};

const stamp = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(date);
};

export default function IncidentDetailPage({ id, initialRecord }: { id: string; initialRecord: IncidentRecord | null }) {
  const [record, setRecord] = useState<IncidentRecord | null>(initialRecord); const [related, setRelated] = useState<IncidentRecord[]>([]); const [relatedFailed, setRelatedFailed] = useState(false); const [loading, setLoading] = useState(!initialRecord); const [failed, setFailed] = useState(false); const [notFound, setNotFound] = useState(false); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => { if (!id) return; setLoading(true); setFailed(false); setNotFound(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine); try { const response = await fetch(`/api/attacks/${id}`, { cache: "no-store" }); if (response.status === 404) { setNotFound(true); return; } if (!response.ok) throw new Error("Record unavailable"); const payload = await response.json(); const next = payload.attack as IncidentRecord; setRecord(next); const linked = await fetch(`/api/attacks?state=${encodeURIComponent(next.location.state)}&limit=4&sort=date_desc`, { cache: "no-store" }); setRelatedFailed(!linked.ok); if (linked.ok) { const result = await linked.json(); setRelated((result.attacks ?? []).filter((item: IncidentRecord) => item._id !== next._id).slice(0, 3)); } } catch { setFailed(true); } finally { setLoading(false); } }, [id]);
  useEffect(() => { load(); }, [load]);
  if (loading && !record) return <div className="page-wrap"><LoadingState label="Loading incident record" /></div>;
  if (notFound) return <div className="page-wrap"><EmptyState title="Record not found" action={<Link className="button-secondary" href="/incidents">Browse the record</Link>}>This record may not exist or may no longer be included in the public record.</EmptyState></div>;
  if (failed && !record) return <div className="page-wrap"><ErrorState offline={offline} retry={load} /></div>;
  if (!record) return null;
  const sources = record.sources ?? [];
  const precision = DATE_PRECISION_LABEL[record.datePrecision || "exact_day"] ?? "";
  const stateLink = `/incidents?state=${encodeURIComponent(record.location.state)}`;
  const created = stamp(record.createdAt); const updated = stamp(record.updatedAt);
  const impacts: [string, number | null, CasualtyCountMetadata | undefined, string, string][] = [
    ["Killed", record.casualties.killed, record.casualtyMeta?.killed, "No deaths reported", "killed"],
    ["Abducted", record.casualties.kidnapped, record.casualtyMeta?.kidnapped, "No abductions reported", "abducted"],
    ["Injured", record.casualties.injured, record.casualtyMeta?.injured, "No injuries reported", "injured"],
    ["Displaced", record.casualties.displaced, record.casualtyMeta?.displaced, "No displacement reported", "displaced"],
  ];

  return <div className="page-wrap">
    <header className="record-head">
      <Link className="back-link" href="/incidents">← The record</Link>
      <p className="record-head__meta"><span>{incidentDateLabel(record, true)}</span><span>{rowPlace(record.location)}</span></p>
      <h1 className="record-title">{record.title}</h1>
      <p className="record-status"><StatusBadge status={record.status} /><span>{STATUS_TEXT[record.status]} {sources.length} {sources.length === 1 ? "cited source" : "cited sources"}.</span></p>
    </header>

    {failed ? <div className="notice">Related records could not be refreshed. The record below is from the last successful request. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}

    <section className="impact-band" aria-label="Reported human impact">{impacts.map(([label, value, meta, zero, tone]) => <ImpactFigure key={label} label={label} value={value} meta={meta} zeroLabel={zero} tone={tone} />)}</section>

    <div className="record-body">
      <article className="record-body__main">
        <section className="record-block"><h2>What was reported</h2><p className="record-prose">{record.description || "No narrative summary is available for this record."}</p></section>
        <section className="record-block"><h2>Where</h2><p>{locationLabel(record.location)}. Location precision: {locationPrecisionLabel(record.location)}.</p>{record.location.notes ? <p className="record-block__quote">{record.location.notes}</p> : null}</section>
        <section className="record-block"><h2>When</h2><p>{incidentDateLabel(record, true)}{precision ? ` (${precision})` : ""}.</p>{record.dateEvidence ? <p className="record-block__quote">Supported by source text: “{record.dateEvidence}”</p> : null}</section>
        <section className="record-block"><h2>Attributed to</h2><p>{record.group || "Unknown"}, as named in reporting. Not independently attributed.</p></section>
        {record.tags?.length ? <section className="record-block"><h2>Tags</h2><p className="tag-list">{record.tags.map((tag) => <span className="tag" key={tag}>{tag.replace(/[-_]/g, " ")}</span>)}</p></section> : null}
      </article>
      <aside className="record-body__side">
        <section className="aside-block" aria-labelledby="evidence-title">
          <h2 id="evidence-title">Sources ({sources.length})</h2>
          {sources.length ? <ol className="source-list">{sources.map((source, index) => { const published = stamp(source.publishedAt); return <li className="source-item" key={`${source.url}-${index}`}>
            <span className="source-item__meta">{source.publisher || "Publisher not recorded"} · {published ? `${published} WAT` : "publication time not recorded"}</span>
            <a className="source-item__title" href={source.url} target="_blank" rel="noopener noreferrer">{source.title || "Source title not recorded"} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          </li>; })}</ol> : <p className="supporting">No source links were returned for this record.</p>}
        </section>
        <section className="aside-block" aria-labelledby="history-title">
          <h2 id="history-title">Record history</h2>
          <ul className="history">{created ? <li>Added {created} WAT</li> : null}{updated && updated !== created ? <li>Last updated {updated} WAT</li> : null}{created && (!updated || updated === created) ? <li className="history__quiet">No changes since it was added</li> : null}{!created && !updated ? <li className="history__quiet">History timestamps were not returned for this record.</li> : null}</ul>
        </section>
        <ShareIncident title={record.title} shareUrl={`${SITE_URL}/incidents/${record._id}`} />
      </aside>
    </div>

    <section className="related" aria-labelledby="related-title">
      <div className="section-head section-head--rule"><h2 id="related-title">Also in {record.location.state || "this state"}</h2><Link className="text-link" href={stateLink}>All {record.location.state} records</Link></div>
      {loading && !related.length ? <p className="supporting">Loading related records…</p> : related.length ? <div className="record-list">{related.map((item) => <RecordCard key={item._id} incident={item} compact />)}</div> : relatedFailed ? <div className="notice">Related records could not be loaded right now. <button type="button" className="text-link" onClick={load}>Retry</button></div> : <p className="supporting">No other recent records from this state were returned.</p>}
    </section>
  </div>;
}

function ImpactFigure({ label, value, meta, zeroLabel, tone }: { label: string; value: number | null; meta?: CasualtyCountMetadata; zeroLabel: string; tone: string }) {
  // Zero/not-reported and unknown stay distinct, exactly as displayValue and casualtyDetail define them.
  const valueLabel = displayValue(value, zeroLabel, meta);
  const quiet = value === 0 || meta?.precision === "not_reported" || valueLabel === "Unknown";
  const quote = !quiet ? meta?.sourceText : undefined;
  return <div className={`impact-figure impact-figure--${tone}`}>
    <span className="impact-figure__label">{label}</span>
    <span className={`impact-figure__value ${quiet ? "impact-figure__value--quiet" : ""} ${!quiet && /[a-z]/i.test(valueLabel) ? "impact-figure__value--text" : ""}`}>{valueLabel}</span>
    <span className="impact-figure__detail">{casualtyDetail(value, meta)}</span>
    {quote ? <blockquote className="impact-figure__quote">“{quote}”</blockquote> : null}
  </div>;
}
