"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AttackCard from "@/components/AttackCard";
import LoginModal from "@/components/LoginModal";
import { AttackCardSkeleton } from "@/components/Skeletons";
import {
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

// Reuse constants from incidents page
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

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [attacks, setAttacks] = useState<AttackData[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [availableSources, setAvailableSources] = useState<string[]>([]);
    const [isDeletingSource, setIsDeletingSource] = useState(false);

    // Filter state
    const [search, setSearch] = useState("");
    const [state, setState] = useState("");
    const [status, setStatus] = useState("");
    const [casualtyType, setCasualtyType] = useState("");
    const [source, setSource] = useState("");
    const [sort, setSort] = useState("date_desc");
    const [page, setPage] = useState(1);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAttacks = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "12");
            params.set("sort", sort);
            if (search) params.set("search", search);
            if (state) params.set("state", state);
            if (status) params.set("status", status);
            if (source) params.set("source", source);
            if (casualtyType) params.set("casualtyType", casualtyType);

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
    }, [isAuthenticated, page, search, state, status, casualtyType, source, sort]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/check");
                if (res.ok) {
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error("Auth check failed", err);
            } finally {
                setIsCheckingAuth(false);
            }
        };
        checkAuth();
    }, []);

    // Fetch sources on mount if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetch("/api/admin/sources")
                .then(res => res.json())
                .then(data => {
                    if (data.sources) setAvailableSources(data.sources);
                })
                .catch(err => console.error("Failed to fetch sources", err));
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAttacks();
        }
    }, [isAuthenticated, fetchAttacks]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const deleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} incidents? This cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch("/api/admin/incidents/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });

            if (!res.ok) throw new Error("Delete failed");

            // clear selection and refresh
            clearSelection();
            fetchAttacks();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete incidents.");
        } finally {
            setIsDeleting(false);
        }
    };

    const deleteBySource = async () => {
        if (!source) return;
        if (!confirm(`DANGER: Are you sure you want to delete ALL incidents from "${source}"? This action cannot be undone.`)) return;

        setIsDeletingSource(true);
        try {
            const res = await fetch("/api/admin/incidents/delete-by-source", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source }),
            });

            if (!res.ok) throw new Error("Delete failed");
            const data = await res.json();

            alert(`Successfully deleted ${data.deletedCount} incidents from ${source}.`);

            setSource(""); // Reset source filter
            fetchAttacks(); // Refresh list
        } catch (err) {
            console.error("Delete by source error:", err);
            alert("Failed to delete incidents by source.");
        } finally {
            setIsDeletingSource(false);
        }
    };

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setState("");
        setStatus("");
        setCasualtyType("");
        setSource("");
        setSort("date_desc");
        setPage(1);
    };

    const hasActiveFilters = search || state || status || casualtyType || source || sort !== "date_desc";

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blood"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginModal onSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 pt-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
                        <span className="bg-blood text-white text-sm px-2 py-1 rounded">ADMIN</span>
                        Incident Management
                    </h1>
                    <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                        Manage and delete incident entries.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Source Bulk Delete Action */}
                    {!selectedIds.size && source && (
                        <div className="flex items-center gap-4 bg-orange-500/10 border border-orange-500/20 px-4 py-3 rounded-xl animate-fade-in-up">
                            <span className="font-semibold text-orange-500">
                                Filtering: {source}
                            </span>
                            <div className="h-4 w-px bg-orange-500/20" />
                            <button
                                onClick={deleteBySource}
                                disabled={isDeletingSource}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                <TrashIcon className="w-4 h-4" />
                                {isDeletingSource ? "Deleting..." : `Delete All by Source`}
                            </button>
                        </div>
                    )}

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-fade-in-up">
                            <span className="font-semibold text-red-500">
                                {selectedIds.size} selected
                            </span>
                            <div className="h-4 w-px bg-red-500/20" />
                            <button
                                onClick={clearSelection}
                                className="text-sm font-medium hover:underline text-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteSelected}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                <TrashIcon className="w-4 h-4" />
                                {isDeleting ? "Deleting..." : "Delete Selected"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-card rounded-2xl p-4 mb-6">
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
                            placeholder="Search incidents..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 outline-none focus:ring-2 focus:ring-blood/30"
                            style={{
                                background: "var(--bg-secondary)",
                                borderColor: "var(--border-subtle)",
                                color: "var(--text-primary)",
                            }}
                        />
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
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Filters
                    </button>
                </div>

                {/* Expanded Filters Reuse */}
                <div className={`overflow-hidden transition-all duration-400 ease-out ${showFilters ? "max-h-60 opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        {/* State */}
                        <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border bg-black/20 border-white/10 text-white">
                            <option value="">All States</option>
                            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {/* Status */}
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border bg-black/20 border-white/10 text-white">
                            <option value="">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="unconfirmed">Unconfirmed</option>
                            <option value="developing">Developing</option>
                        </select>
                        {/* Casualty */}
                        <select value={casualtyType} onChange={(e) => setCasualtyType(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border bg-black/20 border-white/10 text-white">
                            <option value="">Any Casualty</option>
                            <option value="killed">Killed</option>
                            <option value="injured">Injured</option>
                            <option value="kidnapped">Kidnapped</option>
                        </select>
                        {/* Sort */}
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border bg-black/20 border-white/10 text-white">
                            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        {/* Source Filter */}
                        <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border bg-black/20 border-white/10 text-white">
                            <option value="">All Sources</option>
                            {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-red-500 hover:text-red-400">Clear Filters</button>
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
                            <AttackCard
                                key={attack._id}
                                attack={attack}
                                index={i}
                                isSelectable={true}
                                isSelected={selectedIds.has(attack._id)}
                                onToggleSelect={() => toggleSelect(attack._id)}
                            />
                        ))}
                    </div>
                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">Prev</button>
                            <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50">Next</button>
                        </div>
                    )}
                </>
            ) : (
                <div className="glass-card rounded-2xl p-12 text-center text-gray-500">
                    No incidents found.
                </div>
            )}
        </div>
    );
}
