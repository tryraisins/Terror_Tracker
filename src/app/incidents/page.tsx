"use client";

import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import RecordCard from "@/components/RecordCard";
import { IncidentRecord } from "@/lib/incident-view";

const states = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
type Pagination = { page: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
type Totals = { killed: number; injured: number; kidnapped: number };

export default function IncidentsPage() {
  const [records, setRecords] = useState<IncidentRecord[]>([]); const [pagination, setPagination] = useState<Pagination | null>(null); const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [offline, setOffline] = useState(false); const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const [state, setState] = useState(""); const [status, setStatus] = useState(""); const [casualtyType, setCasualtyType] = useState(""); const [month, setMonth] = useState(""); const [sort, setSort] = useState("date_desc"); const [page, setPage] = useState(1);
  useEffect(() => { if (typeof window !== "undefined") { const fromMap = new URLSearchParams(window.location.search).get("state"); if (fromMap) { setState(fromMap); setShowFilters(true); } } }, []);
  const load = useCallback(async () => {
    setLoading(true); setFailed(false); setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    try { const query = new URLSearchParams({ page: String(page), limit: "12", sort }); if (search) query.set("search", search); if (state) query.set("state", state); if (status) query.set("status", status); if (casualtyType) query.set("casualtyType", casualtyType); if (month) query.set("month", month); const response = await fetch(`/api/attacks?${query}`, { cache: "no-store" }); if (!response.ok) throw new Error("Unable to load records"); const payload = await response.json(); setRecords(payload.attacks ?? []); setPagination(payload.pagination ?? null); setTotals(payload.totals ?? null); } catch { setFailed(true); } finally { setLoading(false); }
  }, [page, search, state, status, casualtyType, month, sort]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(searchInput); setPage(1); }, 350); return () => window.clearTimeout(timer); }, [searchInput]);
  const clear = () => { setSearchInput(""); setSearch(""); setState(""); setStatus(""); setCasualtyType(""); setMonth(""); setSort("date_desc"); setPage(1); };
  const hasFilters = Boolean(search || state || status || casualtyType || month || sort !== "date_desc");
  return <div className="page-wrap">
    <header className="page-header page-header--simple"><div><span className="eyebrow">Incident archive</span><h1>Incident records</h1><p className="lede">Search and compare reported incidents without losing source and uncertainty context.</p></div></header>
    <section className="panel filter-panel" aria-label="Incident filters"><div className="search-row"><div className="search-wrap"><MagnifyingGlassIcon aria-hidden="true" /><label className="sr-only" htmlFor="record-search">Search incident records</label><input id="record-search" className="control" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title, location, group or source" /></div><button className="button-quiet" type="button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />&nbsp; Filters</button></div>
      <div className={`filters ${showFilters ? "filters--open" : ""}`}>
        <label className="filter-label">Date<select className="control" value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }}><option value="">All recorded dates</option>{monthOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="filter-label">State<select className="control" value={state} onChange={(event) => { setState(event.target.value); setPage(1); }}><option value="">All states</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="filter-label">Status<select className="control" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Any status</option><option value="confirmed">Confirmed</option><option value="developing">Developing</option><option value="unconfirmed">Unconfirmed</option></select></label>
        <label className="filter-label">Human impact<select className="control" value={casualtyType} onChange={(event) => { setCasualtyType(event.target.value); setPage(1); }}><option value="">Any reported impact</option><option value="killed">People killed</option><option value="injured">People injured</option><option value="kidnapped">People abducted</option></select></label>
        <label className="filter-label">Sort<select className="control" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="date_desc">Newest first</option><option value="date_asc">Oldest first</option><option value="casualties_desc">Most affected</option></select></label>
      </div>
    </section>
    <div className="filter-chips"><span className="chip">{pagination?.total ?? "—"} results</span>{state ? <span className="chip chip--burgundy">{state}</span> : null}{status ? <span className="chip chip--evidence">{status}</span> : null}{hasFilters ? <button type="button" className="text-link" onClick={clear}>Clear all filters</button> : null}</div>
    {totals ? <section className="panel summary-strip"><div><span className="eyebrow">Filtered human impact</span><div className="summary-strip__impacts"><span>{totals.killed.toLocaleString("en-NG")} killed</span><span>{totals.injured.toLocaleString("en-NG")} injured</span><span>{totals.kidnapped.toLocaleString("en-NG")} abducted</span></div></div><span className="summary-strip__fine">Counts are reported minimums; missing values remain unknown.</span></section> : null}
    {loading && !records.length ? <LoadingState label="Loading incident records" /> : null}
    {failed && !records.length ? <ErrorState offline={offline} retry={load} /> : null}
    {failed && records.length ? <div className="panel panel--notice" style={{ marginBottom: "1rem", padding: "1rem" }}>The latest request did not complete; showing the last successful page. <button type="button" className="text-link" onClick={load}>Retry</button></div> : null}
    {!loading && !failed && !records.length ? <EmptyState title="No records match these filters" action={<button className="button-secondary" type="button" onClick={clear}>Reset filters</button>}>Try removing one or more filters, or use a broader search term.</EmptyState> : null}
    {records.length ? <section className="record-list" aria-live="polite">{records.map((record) => <RecordCard key={record._id} incident={record} />)}</section> : null}
    {pagination && pagination.totalPages > 1 ? <nav className="panel pagination" aria-label="Record pagination"><button type="button" className="button-quiet" disabled={!pagination.hasPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span className="pagination__label">Page {pagination.page} of {pagination.totalPages}</span><button type="button" className="button-quiet" disabled={!pagination.hasNext || loading} onClick={() => setPage((value) => value + 1)}>Next →</button></nav> : null}
  </div>;
}

function monthOptions() { const options: { value: string; label: string }[] = []; const now = new Date(); for (let date = new Date(now.getFullYear(), now.getMonth(), 1); date >= new Date(2026, 0, 1); date = new Date(date.getFullYear(), date.getMonth() - 1, 1)) options.push({ value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: date.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) }); return options; }
