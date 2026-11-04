"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState } from "@/components/DataState";
import { Locator } from "@/components/icons";
import { PageSkeleton } from "@/components/PageState";
import { LinkPreview, NativeShareButton, ShareActions } from "@/components/Share";
import { ColumnChart, RowItem } from "@/components/Viz";
import { IncidentRecord, IncidentStatus, casualtyDetail, displayValue, incidentDateLabel, locationLabel, locationPrecisionLabel } from "@/lib/incident-view";
import type { CasualtyCountMetadata } from "@/lib/incident-uncertainty";
import { SITE_URL } from "@/lib/site-config";
import { fmt, placeLine, placeName, stateSlug, toSummaryRow, total } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

const DATE_PRECISION_LABEL: Record<string, string> = { exact_day: "the exact day", date_range: "a date range", month_only: "the month only" };
const STATUS_TEXT: Record<IncidentStatus, string> = {
  confirmed: "Confirmed: two or more cited sources, or an official statement plus a cited publisher",
  developing: "Developing: credible reporting, but details or the toll may still change",
  unconfirmed: "Unconfirmed: a single source or incomplete corroboration",
};

const stamp = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(date);
};

export default function IncidentDetailPage({ id, initialRecord }: { id: string; initialRecord: IncidentRecord | null }) {
  const [record, setRecord] = useState<IncidentRecord | null>(initialRecord); const [loading, setLoading] = useState(!initialRecord); const [failed, setFailed] = useState(false); const [notFound, setNotFound] = useState(false); const [offline, setOffline] = useState(false);
  const load = useCallback(async () => { if (!id) return; setLoading(true); setFailed(false); setNotFound(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine); try { const response = await fetch(`/api/attacks/${id}`, { cache: "no-store" }); if (response.status === 404) { setNotFound(true); return; } if (!response.ok) throw new Error("Record unavailable"); const payload = await response.json(); setRecord(payload.attack as IncidentRecord); } catch { setFailed(true); } finally { setLoading(false); } }, [id]);
  useEffect(() => { load(); }, [load]);
  const summary = useSummary();
  const row = useMemo(() => record ? toSummaryRow(record) : null, [record]);
  const stateRows = useMemo(() => summary.data && row ? summary.data.records.filter((item) => item.s === row.s) : [], [summary.data, row]);

  if (loading && !record) return <PageSkeleton title="Incident" />;
  if (notFound) return <EmptyState title="Record not found" action={<Link className="btn" href="/incidents">Browse incidents</Link>}>This record may not exist or may no longer be included in the public record.</EmptyState>;
  if (failed && !record) return <ErrorState offline={offline} retry={load} />;
  if (!record || !row) return null;

  const sources = record.sources ?? [];
  const place = placeName(row);
  const created = stamp(record.createdAt); const updated = stamp(record.updatedAt);
  const firstPublished = sources.map((source) => source.publishedAt).filter(Boolean).sort()[0];
  const impacts: [string, number | null, CasualtyCountMetadata | undefined, string, string | null][] = [
    ["Killed", record.casualties.killed, record.casualtyMeta?.killed, "No deaths reported", "#e5484d"],
    ["Abducted", record.casualties.kidnapped, record.casualtyMeta?.kidnapped, "No abductions reported", "#3e8ee6"],
    ["Injured", record.casualties.injured, record.casualtyMeta?.injured, "No injuries reported", null],
    ["Displaced", record.casualties.displaced, record.casualtyMeta?.displaced, "No displacement reported", null],
  ];

  return <div className="inc-page">
    <nav className="crumbs" aria-label="Breadcrumb"><Link href="/incidents">Incidents</Link><span aria-hidden="true">/</span><Link href={`/states/${stateSlug(row.s)}`}>{row.s}</Link><span aria-hidden="true">/</span><span>{place}</span></nav>
    {failed ? <div className="notice">The record could not be refreshed. This is the last successful copy. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}
    <div className="inc-layout">
      <div className="inc-main">
        <section className="card">
          <div className="inc-hero"><div>
            <span className="status-pill">{STATUS_TEXT[record.status]}</span>
            <h1 className={place.length > 18 ? "long" : undefined}>{place}</h1>
            <div className="where">{placeLine(row)}. {incidentDateLabel(record, true)}</div>
            <p className="headline">{record.title}</p>
          </div><Locator state={row.s} /></div>
        </section>

        <section className="figs" aria-label="Reported human impact">{impacts.map(([label, value, meta, zero, color]) => <ImpactFigure key={label} label={label} value={value} meta={meta} zeroLabel={zero} color={color} />)}</section>

        <section className="card" aria-labelledby="account-title">
          <div className="card-head"><div><h2 id="account-title">What the report says</h2><p>Details are quoted from the source where the record holds the text.</p></div></div>
          <dl className="facts">
            <dt>What happened</dt><dd>{record.description || "No narrative summary is available for this record."}</dd>
            <dt>Where</dt><dd>{locationLabel(record.location)}. Location precision: {locationPrecisionLabel(record.location)}.{record.location.notes ? <blockquote>{record.location.notes}</blockquote> : null}</dd>
            <dt>When</dt><dd>{incidentDateLabel(record, true)}, recorded to {DATE_PRECISION_LABEL[record.datePrecision || "exact_day"] ?? "the day"}.{record.dateEvidence ? <blockquote>&ldquo;{record.dateEvidence}&rdquo;</blockquote> : null}</dd>
            <dt>Attributed to</dt><dd>{record.group || "Unknown"}, as named in reporting. Not independently attributed.</dd>
          </dl>
        </section>

        <section className="card" aria-labelledby="sources-title">
          <div className="card-head"><div><h2 id="sources-title">Sources</h2><p>{sources.length} {sources.length === 1 ? "report" : "reports"}. Each opens on the publisher&apos;s site.</p></div></div>
          {sources.length ? sources.map((source, index) => <a className="src" key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer">
            <span><b>{source.title || "Source title not recorded"}</b><span className="dim" style={{ fontSize: 13 }}>{source.publisher || "Publisher not recorded"}{source.publishedAt ? `, ${stamp(source.publishedAt)} WAT` : ""}</span><span className="sr-only"> (opens in a new tab)</span></span>
            <span className="btn" style={{ height: 34 }} aria-hidden="true">Read</span>
          </a>) : <p className="dim" style={{ margin: 0 }}>No source links were returned for this record.</p>}
          <div className="card-foot"><span>Something wrong or missing?</span><Link className="text-link" href="/about#corrections">How corrections work</Link></div>
        </section>

        <section className="card" aria-labelledby="history-title">
          <div className="card-head"><div><h2 id="history-title">Record history</h2><p>Times are West Africa Time.</p></div></div>
          <ol className="timeline">
            <li><span><b>{incidentDateLabel(record, true)}</b><span className="muted">The attack</span></span></li>
            {firstPublished ? <li><span><b>{stamp(firstPublished)}</b><span className="muted">First cited report published</span></span></li> : null}
            {created ? <li><span><b>{created}</b><span className="muted">Added to NATracker</span></span></li> : null}
            {updated && updated !== created ? <li><span><b>{updated}</b><span className="muted">Last updated</span></span></li> : null}
          </ol>
        </section>
      </div>

      <aside className="inc-rail">
        <section className="card" aria-labelledby="share-title">
          <div className="card-head" style={{ marginBottom: 12 }}><div><h2 id="share-title">Share this incident</h2><p>The link opens with this preview.</p></div></div>
          <LinkPreview row={row} />
          <ShareActions row={row} />
        </section>
        {stateRows.length && summary.data ? <section className="card" aria-labelledby="state-title">
          <div className="card-head" style={{ marginBottom: 8 }}><div><h2 id="state-title">{row.s} in {summary.data.year}</h2><p>{fmt(stateRows.length)} attacks since 1 January</p></div><Link className="text-link" href={`/states/${stateSlug(row.s)}`}>State page</Link></div>
          <div className="inc-figs" style={{ marginBottom: 12 }}><span className="pill pill--k"><span className="key" />{fmt(total(stateRows, "killed"))} killed</span><span className="pill pill--a"><span className="key" />{fmt(total(stateRows, "abducted"))} abducted</span></div>
          <div className="dim" style={{ fontSize: 12, marginBottom: 4 }}>Attacks per month</div>
          <ColumnChart rows={stateRows} period="year" measure="attacks" today={summary.data.today} height={130} />
          <ul className="rows" style={{ marginTop: 8 }}>{stateRows.filter((item) => item.id !== row.id).slice(0, 3).map((item) => <RowItem key={item.id} row={item} />)}</ul>
        </section> : null}
      </aside>
    </div>
    <div className="m-share"><NativeShareButton row={row} /><CopyLink url={`${SITE_URL}/incidents/${record._id}`} /></div>
  </div>;
}

function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="btn" onClick={async () => { try { await navigator.clipboard.writeText(url); setDone(true); } catch { setDone(false); } }}>{done ? "Link copied" : "Copy link"}</button>;
}

function ImpactFigure({ label, value, meta, zeroLabel, color }: { label: string; value: number | null; meta?: CasualtyCountMetadata; zeroLabel: string; color: string | null }) {
  // Zero/not-reported and unknown stay distinct, exactly as displayValue and casualtyDetail define them.
  const valueLabel = displayValue(value, zeroLabel, meta);
  const quiet = value === 0 || meta?.precision === "not_reported" || valueLabel === "Unknown";
  const quote = !quiet ? meta?.sourceText : undefined;
  return <div className="fig">
    <span className="lab">{color ? <span className="key" style={{ color }} /> : null}{label}</span>
    {quiet ? <div className="nr">{valueLabel === "Unknown" ? "Figure unknown" : valueLabel}</div> : <b className={/[a-z]/i.test(valueLabel) ? "text" : undefined}>{valueLabel}</b>}
    <small>{quote ? `“${quote}”` : casualtyDetail(value, meta)}</small>
  </div>;
}
