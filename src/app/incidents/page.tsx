"use client";

import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState, LoadingState, RecordListSkeleton } from "@/components/DataState";
import DateRangePicker from "@/components/DateRangePicker";
import RecordCard from "@/components/RecordCard";
import SearchableSelect from "@/components/SearchableSelect";
import { SORT_OPTIONS, STATE_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "@/lib/filter-options";
import { IncidentRecord } from "@/lib/incident-view";

type Pagination = { page: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
type Totals = { killed: number; injured: number; kidnapped: number };

const IMPACT_CHOICES = [["", "Any"], ["killed", "Killed"], ["kidnapped", "Abducted"], ["injured", "Injured"]] as const;
const PAGE_SIZE = 12;

function nigeriaDayBoundary(date: string, endOfDay = false) {
  return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+01:00`).toISOString();
}

function dateRangeLabel(startDate: string, endDate: string) {
  const format = (date: string) => new Date(`${date}T00:00:00.000+01:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
  if (startDate && endDate) return `${format(startDate)} – ${format(endDate)}`;
  if (startDate) return `From ${format(startDate)}`;
  return endDate ? `Until ${format(endDate)}` : "";
}

const lagosDay = (offsetDays = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(Date.now() - offsetDays * 86_400_000));

function pageList(current: number, total: number) {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => index > 0 && page - sorted[index - 1] > 1 ? ["gap", page] : [page]) as (number | "gap")[];
}

export default function IncidentsPage() {
  const [records, setRecords] = useState<IncidentRecord[]>([]); const [pagination, setPagination] = useState<Pagination | null>(null); const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [offline, setOffline] = useState(false); const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const [state, setState] = useState(""); const [status, setStatus] = useState(""); const [casualtyType, setCasualtyType] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [sort, setSort] = useState("date_desc"); const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromMap = params.get("state"); const fromSearch = params.get("search");
    if (fromMap) { setState(fromMap); setShowFilters(true); }
    if (fromSearch) { setSearchInput(fromSearch); setSearch(fromSearch); }
  }, []);
  // Only the newest request may update the page; a slower, older response (for example the
  // unfiltered first load before a ?search= deep link applies) must not overwrite filtered results.
  const latestRequest = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sort });
      if (search) query.set("search", search); if (state) query.set("state", state); if (status) query.set("status", status); if (casualtyType) query.set("casualtyType", casualtyType);
      if (startDate) query.set("startDate", nigeriaDayBoundary(startDate)); if (endDate) query.set("endDate", nigeriaDayBoundary(endDate, true));
      const response = await fetch(`/api/attacks?${query}`, { cache: "no-store" }); if (!response.ok) throw new Error("Unable to load records"); const payload = await response.json();
      if (requestId !== latestRequest.current) return;
      setRecords(payload.attacks ?? []); setPagination(payload.pagination ?? null); setTotals(payload.totals ?? null);
    } catch { if (requestId === latestRequest.current) setFailed(true); } finally { if (requestId === latestRequest.current) setLoading(false); }
  }, [page, search, state, status, casualtyType, startDate, endDate, sort]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1); }, 350); return () => window.clearTimeout(timer); }, [searchInput]);

  const clear = () => { setSearchInput(""); setSearch(""); setState(""); setStatus(""); setCasualtyType(""); setStartDate(""); setEndDate(""); setSort("date_desc"); setPage(1); };
  const setRange = (start: string, end: string) => { setStartDate(start); setEndDate(end); setPage(1); };
  const hasFilters = Boolean(search || state || status || casualtyType || startDate || endDate || sort !== "date_desc");
  const activeCount = [state, status, casualtyType, startDate || endDate, sort !== "date_desc" ? sort : ""].filter(Boolean).length;
  const showResultSkeleton = loading && records.length > 0;
  const rangeLabel = dateRangeLabel(startDate, endDate);
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label.toLowerCase() ?? "newest first";
  const quickRanges = [["Last 7 days", lagosDay(6), lagosDay()], ["Last 30 days", lagosDay(29), lagosDay()], [`This year`, `${lagosDay().slice(0, 4)}-01-01`, lagosDay()]] as const;
  const firstShown = pagination && pagination.total ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const lastShown = pagination ? Math.min(pagination.page * PAGE_SIZE, pagination.total) : 0;

  return <div className="page-wrap">
    <header className="page-head">
      <div className="page-head__copy"><span className="kicker kicker--signal">Incident archive</span><h1 className="page-title">Incident records</h1><p className="lede">Search and compare reported incidents without losing source and uncertainty context.</p></div>
      {totals ? <aside className="view-totals" aria-label="Human impact in this view">
        <span className="kicker">Human impact in this view · {pagination?.total.toLocaleString("en-NG") ?? "—"} {pagination?.total === 1 ? "record" : "records"}</span>
        <div className="view-totals__row"><span className="view-totals__item view-totals__item--killed"><strong>{totals.killed.toLocaleString("en-NG")}</strong> killed</span><span className="view-totals__item"><strong>{totals.kidnapped.toLocaleString("en-NG")}</strong> abducted</span><span className="view-totals__item"><strong>{totals.injured.toLocaleString("en-NG")}</strong> injured</span></div>
        <p className="fine">Totals combine exact counts, estimates and range midpoints. Each record labels which it uses.</p>
      </aside> : null}
    </header>

    <div className="archive-search">
      <div className="search-field search-field--large"><MagnifyingGlassIcon aria-hidden="true" /><label className="sr-only" htmlFor="record-search">Search incident records</label><input id="record-search" type="search" className="control" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title, location, group or source" /></div>
      <button className="button-quiet filter-toggle" type="button" aria-expanded={showFilters} aria-controls="incident-filter-options" onClick={() => setShowFilters(!showFilters)}><AdjustmentsHorizontalIcon aria-hidden="true" />{showFilters ? "Hide filters" : "Filters"}{activeCount ? <span className="filter-toggle__count">{activeCount}</span> : null}</button>
    </div>

    <div className="archive">
      <aside id="incident-filter-options" className={`filter-rail ${showFilters ? "filter-rail--open" : ""}`} aria-label="Incident filters">
        <fieldset className="filter-group"><legend>Date range</legend><DateRangePicker startDate={startDate} endDate={endDate} onChange={setRange} />
          <div className="quick-ranges">{quickRanges.map(([label, start, end]) => <button key={label} type="button" aria-pressed={startDate === start && endDate === end} onClick={() => setRange(start, end)}>{label}</button>)}</div>
        </fieldset>
        <div className="filter-group"><label htmlFor="state-filter" className="filter-group__label">State</label><SearchableSelect inputId="state-filter" ariaLabel="Filter records by state" options={STATE_FILTER_OPTIONS} value={state} onChange={(value) => { setState(value); setPage(1); }} /></div>
        <fieldset className="filter-group"><legend>Evidence status</legend><div className="choice-list">{STATUS_FILTER_OPTIONS.map((option) => <label key={option.value || "any"} className="choice"><input type="radio" name="status-filter" value={option.value} checked={status === option.value} onChange={() => { setStatus(option.value); setPage(1); }} /><span><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</span></label>)}</div></fieldset>
        <fieldset className="filter-group"><legend>Human impact</legend><div className="segmented segmented--fill">{IMPACT_CHOICES.map(([value, label]) => <button key={value || "any"} type="button" aria-pressed={casualtyType === value} onClick={() => { setCasualtyType(value); setPage(1); }}>{label}</button>)}</div></fieldset>
        <div className="filter-group"><label htmlFor="sort-filter" className="filter-group__label">Sort</label><SearchableSelect inputId="sort-filter" ariaLabel="Sort incident records" options={SORT_OPTIONS} value={sort} onChange={(value) => { setSort(value); setPage(1); }} /></div>
        {hasFilters ? <button type="button" className="text-link" onClick={clear}>Clear all filters</button> : null}
      </aside>

      <section className="results" aria-label="Incident records">
        <div className="results__head">
          <p className="results__count"><strong>{pagination?.total.toLocaleString("en-NG") ?? "—"}</strong> {pagination?.total === 1 ? "record" : "records"} · {sortLabel}</p>
          {pagination && pagination.total ? <span className="fine">Showing {firstShown}–{lastShown} of {pagination.total.toLocaleString("en-NG")}</span> : null}
        </div>
        {hasFilters ? <div className="filter-chips">{search ? <span className="chip">“{search}”</span> : null}{state ? <span className="chip">{state}</span> : null}{status ? <span className="chip">{status}</span> : null}{casualtyType ? <span className="chip">{IMPACT_CHOICES.find(([value]) => value === casualtyType)?.[1]}</span> : null}{rangeLabel ? <span className="chip">{rangeLabel}</span> : null}<button type="button" className="text-link" onClick={clear}>Clear all</button></div> : null}
        <div className="record-heads" aria-hidden="true"><span>Date</span><span>Record</span><span>Human impact</span><span>Evidence</span></div>
        {loading && !records.length ? <LoadingState label="Loading incident records" /> : null}
        {failed && !records.length ? <ErrorState offline={offline} retry={load} /> : null}
        {failed && records.length ? <div className="notice">The latest request did not complete; showing the last successful page. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}
        {!loading && !failed && !records.length ? <EmptyState title="No records match these filters" action={<button className="button-secondary" type="button" onClick={clear}>Reset filters</button>}>Try removing one or more filters, or use a broader search term.</EmptyState> : null}
        {showResultSkeleton ? <RecordListSkeleton /> : null}
        {!showResultSkeleton && records.length ? <div className="record-list" aria-live="polite" aria-busy={loading}>{records.map((record) => <RecordCard key={record._id} incident={record} />)}</div> : null}
        {pagination && pagination.totalPages > 1 ? <nav className="pagination" aria-label="Record pagination">
          <button type="button" className="button-quiet" disabled={!pagination.hasPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span className="pagination__pages">{pageList(pagination.page, pagination.totalPages).map((item, index) => item === "gap" ? <span key={`gap-${index}`} className="pagination__gap">…</span> : <button key={item} type="button" className="pagination__page" aria-current={item === pagination.page ? "page" : undefined} aria-label={`Page ${item}`} disabled={loading} onClick={() => setPage(item)}>{item}</button>)}</span>
          <span className="pagination__label">Page {pagination.page} of {pagination.totalPages}</span>
          <button type="button" className="button-quiet" disabled={!pagination.hasNext || loading} onClick={() => setPage((value) => value + 1)}>Next</button>
        </nav> : null}
      </section>
    </div>
  </div>;
}
