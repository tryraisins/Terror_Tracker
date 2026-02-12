"use client";

import { useEffect, useState, useCallback } from "react";
import AttackCard from "@/components/AttackCard";
import { AttackCardSkeleton } from "@/components/Skeletons";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XCircleIcon,
    AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
    "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const SORT_OPTIONS = [
    { value: "date_desc", label: "Latest First" },
    { value: "date_asc", label: "Oldest First" },
    { value: "casualties_desc", label: "Most Casualties" },
];

interface AttackData {
    _id: string;
    title: string;
    description: string;
    date: string;
    location: { state: string; lga: string; town: string; };
    group: string;
    casualties: { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null; };
    sources: { url: string; title: string; publisher: string; }[];
    status: "confirmed" | "unconfirmed" | "developing";
    tags: string[];
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export default function IncidentsPage() {
    const [attacks, setAttacks] = useState<AttackData[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [search, setSearch] = useState("");
    const [state, setState] = useState("");
    const [status, setStatus] = useState("");
    const [sort, setSort] = useState("date_desc");
    const [page, setPage] = useState(1);

    const fetchAttacks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "12");
            params.set("sort", sort);
            if (search) params.set("search", search);
            if (state) params.set("state", state);
            if (status) params.set("status", status);

            const res = await fetch(`/api/attacks?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAttacks(data.attacks);
            setPagination(data.pagination);
        } catch (err) {
            console.error("Error fetching attacks:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search, state, status, sort]);

    useEffect(() => {
        fetchAttacks();
    }, [fetchAttacks]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setState("");
        setStatus("");
        setSort("date_desc");
        setPage(1);
    };

    const hasActiveFilters = search || state || status || sort !== "date_desc";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1
                    className="text-3xl sm:text-4xl font-bold mb-2 animate-fade-in-up"
                    style={{ fontFamily: "var(--font-heading)" }}
                >
                    Incident Reports
                </h1>
                <p className="text-base animate-fade-in-up stagger-1" style={{ color: "var(--text-secondary)" }}>
                    Browse, search, and filter all tracked incidents.
                    {pagination && (
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                            {" "}{pagination.total} total incidents
                        </span>
                    )}
                </p>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-card rounded-2xl p-4 mb-6 animate-fade-in-up stagger-2">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: "var(--text-muted)" }}
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search incidents, locations, groups..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium
                border transition-all duration-300 outline-none
                focus:ring-2 focus:ring-blood/30"
                            style={{
                                background: "var(--bg-secondary)",
                                borderColor: "var(--border-subtle)",
                                color: "var(--text-primary)",
                            }}
                            id="search-input"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <XCircleIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
              border transition-all duration-300 ${showFilters ? "ring-2 ring-blood/30" : ""}`}
                        style={{
                            background: showFilters ? "var(--accent)" : "var(--bg-secondary)",
                            borderColor: "var(--border-subtle)",
                            color: showFilters ? "#fff" : "var(--text-secondary)",
                        }}
                        id="filter-toggle"
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-urgent" />
                        )}
                    </button>
                </div>

                {/* Expanded Filters */}
                <div
                    className={`overflow-hidden transition-all duration-400 ease-out
            ${showFilters ? "max-h-60 opacity-100 mt-4" : "max-h-0 opacity-0"}
          `}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        {/* State filter */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
                                style={{ color: "var(--text-muted)" }}>
                                State
                            </label>
                            <select
                                value={state}
                                onChange={(e) => { setState(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all
                  focus:ring-2 focus:ring-blood/30"
                                style={{
                                    background: "var(--bg-secondary)",
                                    borderColor: "var(--border-subtle)",
                                    color: "var(--text-primary)",
                                }}
                                id="state-filter"
                            >
                                <option value="">All States</option>
                                {NIGERIAN_STATES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status filter */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
                                style={{ color: "var(--text-muted)" }}>
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all
                  focus:ring-2 focus:ring-blood/30"
                                style={{
                                    background: "var(--bg-secondary)",
                                    borderColor: "var(--border-subtle)",
                                    color: "var(--text-primary)",
                                }}
                                id="status-filter"
                            >
                                <option value="">All Statuses</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="unconfirmed">Unconfirmed</option>
                                <option value="developing">Developing</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5"
                                style={{ color: "var(--text-muted)" }}>
                                Sort By
                            </label>
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all
                  focus:ring-2 focus:ring-blood/30"
                                style={{
                                    background: "var(--bg-secondary)",
                                    borderColor: "var(--border-subtle)",
                                    color: "var(--text-primary)",
                                }}
                                id="sort-select"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-3 text-xs font-semibold flex items-center gap-1 transition-colors hover:text-blood-light"
                            style={{ color: "var(--accent)" }}
                            id="clear-filters"
                        >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            Clear all filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <AttackCardSkeleton key={i} />)}
                </div>
            ) : attacks.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {attacks.map((attack, i) => (
                            <AttackCard key={attack._id} attack={attack} index={i} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={!pagination.hasPrev}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                  border transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
                  hover:bg-[var(--border-subtle)]"
                                style={{
                                    borderColor: "var(--border-subtle)",
                                    color: "var(--text-secondary)",
                                }}
                                id="prev-page"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                                Previous
                            </button>

                            <span className="text-sm font-medium px-4" style={{ color: "var(--text-muted)" }}>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!pagination.hasNext}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                  border transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
                  hover:bg-[var(--border-subtle)]"
                                style={{
                                    borderColor: "var(--border-subtle)",
                                    color: "var(--text-secondary)",
                                }}
                                id="next-page"
                            >
                                Next
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <FunnelIcon className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                        No Incidents Found
                    </h3>
                    <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                        {hasActiveFilters
                            ? "Try adjusting your filters or search terms."
                            : "No incidents have been recorded yet. The cron job will populate data once configured."}
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-sm font-semibold transition-colors hover:text-blood-light"
                            style={{ color: "var(--accent)" }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
