"use client";

import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState, RecordListSkeleton } from "@/components/DataState";
import RecordCard from "@/components/RecordCard";
import SearchableSelect from "@/components/SearchableSelect";
import { CASUALTY_FILTER_OPTIONS, SORT_OPTIONS, STATE_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from "@/lib/filter-options";
import { IncidentRecord } from "@/lib/incident-view";

type Pagination = { page: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
type Totals = { killed: number; injured: number; kidnapped: number };

function nigeriaDayBoundary(date: string, endOfDay = false) {
  return new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+01:00`).toISOString();
}

function dateRangeLabel(startDate: string, endDate: string) {
  const format = (date: string) => new Date(`${date}T00:00:00.000+01:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
  if (startDate && endDate) return `${format(startDate)} – ${format(endDate)}`;
  if (startDate) return `From ${format(startDate)}`;
  return endDate ? `Until ${format(endDate)}` : "";
}

export default function IncidentsPage() {
  const [records, setRecords] = useState<IncidentRecord[]>([]); const [pagination, setPagination] = useState<Pagination | null>(null); const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [offline, setOffline] = useState(false); const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const [state, setState] = useState(""); const [status, setStatus] = useState(""); const [casualtyType, setCasualtyType] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [sort, setSort] = useState("date_desc"); const [page, setPage] = useState(1);

  useEffect(() => { if (typeof window !== "undefined") { const fromMap = new URLSearchParams(window.location.search).get("state"); if (fromMap) { setState(fromMap); setShowFilters(true); } } }, []);
  const load = useCallback(async () => {
    setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    try {
      const query = new URLSearchParams({ page: String(page), limit: "12", sort });
      if (search) query.set("search", search); if (state) query.set("state", state); if (status) query.set("status", status); if (casualtyType) query.set("casualtyType", casualtyType);
      if (startDate) query.set("startDate", nigeriaDayBoundary(startDate)); if (endDate) query.set("endDate", nigeriaDayBoundary(endDate, true));
      const response = await fetch(`/api/attacks?${query}`, { cache: "no-store" }); if (!response.ok) throw new Error("Unable to load records"); const payload = await response.json(); setRecords(payload.attacks ?? []); setPagination(payload.pagination ?? null); setTotals(payload.totals ?? null);
    } catch { setFailed(true); } finally { setLoading(false); }
  }, [page, search, state, status, casualtyType, startDate, endDate, sort]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1); }, 350); return () => window.clearTimeout(timer); }, [searchInput]);

  const clear = () => { setSearchInput(""); setSearch(""); setState(""); setStatus(""); setCasualtyType(""); setStartDate(""); setEndDate(""); setSort("date_desc"); setPage(1); };
  const hasFilters = Boolean(search || state || status || casualtyType || startDate || endDate || sort !== "date_desc");
  const showResultSkeleton = loading && records.length > 0;
  const rangeLabel = dateRangeLabel(startDate, endDate);

  return <div className="page-wrap">
    <header className="page-header page-header--simple"><div><span className="eyebrow">Incident archive</span><h1>Incident records</h1><p className="lede">Search and compare reported incidents without losing source and uncertainty context.</p></div></header>
    <section className="panel filter-panel" aria-label="Incident filters"><div className="search-row"><div className="search-wrap"><MagnifyingGlassIcon aria-hidden="true" /><label className="sr-only" htmlFor="record-search">Search incident records</label><input id="record-search" className="control" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title, location, group or source" /></div><button className="button-quiet" type="button" aria-expanded={showFilters} aria-controls="incident-filter-options" onClick={() => setShowFilters(!showFilters)}><AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />&nbsp; {showFilters ? "Hide filters" : "Show filters"}</button></div>
      <div id="incident-filter-options" className={`filters ${showFilters ? "filters--open" : ""}`}>
        <fieldset className="filter-label filter-label--range"><legend>Date range</legend><div className="date-range"><label><span>From</span><input className="control" type="date" value={startDate} max={endDate || undefined} onChange={(event) => { const next = event.target.value; setStartDate(next); if (endDate && endDate < next) setEndDate(next); setPage(1); }} /></label><label><span>To</span><input className="control" type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} /></label></div></fieldset>
        <label className="filter-label" htmlFor="state-filter">State<SearchableSelect inputId="state-filter" ariaLabel="Filter records by state" options={STATE_FILTER_OPTIONS} value={state} onChange={(value) => { setState(value); setPage(1); }} /></label>
        <label className="filter-label" htmlFor="status-filter">Status<SearchableSelect inputId="status-filter" ariaLabel="Filter records by evidence status" options={STATUS_FILTER_OPTIONS} value={status} onChange={(value) => { setStatus(value); setPage(1); }} /></label>
        <label className="filter-label" htmlFor="impact-filter">Human impact<SearchableSelect inputId="impact-filter" ariaLabel="Filter records by human impact" options={CASUALTY_FILTER_OPTIONS} value={casualtyType} onChange={(value) => { setCasualtyType(value); setPage(1); }} /></label>
        <label className="filter-label" htmlFor="sort-filter">Sort<SearchableSelect inputId="sort-filter" ariaLabel="Sort incident records" options={SORT_OPTIONS} value={sort} onChange={(value) => { setSort(value); setPage(1); }} /></label>
      </div>
    </section>
    <div className="filter-chips"><span className="chip">{pagination?.total ?? "—"} results</span>{state ? <span className="chip chip--burgundy">{state}</span> : null}{status ? <span className="chip chip--evidence">{status}</span> : null}{rangeLabel ? <span className="chip chip--range">{rangeLabel}</span> : null}{hasFilters ? <button type="button" className="text-link" onClick={clear}>Clear all filters</button> : null}</div>
    {totals ? <section className="panel summary-strip"><div><span className="eyebrow">Filtered human impact</span><div className="summary-strip__impacts"><span>{totals.killed.toLocaleString("en-NG")} killed</span><span>{totals.injured.toLocaleString("en-NG")} injured</span><span>{totals.kidnapped.toLocaleString("en-NG")} abducted</span></div></div><span className="summary-strip__fine">Counts are reported minimums; an unknown figure is kept separate from no reported impact.</span></section> : null}
    {loading && !records.length ? <LoadingState label="Loading incident records" /> : null}
    {failed && !records.length ? <ErrorState offline={offline} retry={load} /> : null}
    {failed && records.length ? <div className="panel panel--notice" style={{ marginBottom: "1rem", padding: "1rem" }}>The latest request did not complete; showing the last successful page. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}
    {!loading && !failed && !records.length ? <EmptyState title="No records match these filters" action={<button className="button-secondary" type="button" onClick={clear}>Reset filters</button>}>Try removing one or more filters, or use a broader search term.</EmptyState> : null}
    {showResultSkeleton ? <RecordListSkeleton /> : null}
    {!showResultSkeleton && records.length ? <section className="record-list" aria-live="polite" aria-busy={loading}>{records.map((record) => <RecordCard key={record._id} incident={record} />)}</section> : null}
    {pagination && pagination.totalPages > 1 ? <nav className="panel pagination" aria-label="Record pagination"><button type="button" className="button-quiet" disabled={!pagination.hasPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span className="pagination__label">Page {pagination.page} of {pagination.totalPages}</span><button type="button" className="button-quiet" disabled={!pagination.hasNext || loading} onClick={() => setPage((value) => value + 1)}>Next →</button></nav> : null}
  </div>;
}
