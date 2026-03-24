"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import {
    MapPinIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { NIGERIA_MAP_DATA, StateMapData } from "@/lib/mapData";

interface StateData extends StateMapData {
    count: number;
    killed: number;
    injured: number;
    kidnapped: number;
    recentAttacks: any[];
}

export default function ThreatMapPage() {
    const [stateData, setStateData] = useState<Record<string, StateData>>({});
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const svgRef = useRef<SVGSVGElement>(null);
    const incidentListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setStateData(buildEmptyStateData());
        fetchMapData();
    }, []);

    // Reset pagination and auto-scroll to incidents when state changes
    useEffect(() => {
        setCurrentPage(1);
        if (selectedState) {
            // Wait for the incident list to render before scrolling
            requestAnimationFrame(() => {
                incidentListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }
    }, [selectedState]);

    function buildEmptyStateData(): Record<string, StateData> {
        const emptyData: Record<string, StateData> = {};
        Object.values(NIGERIA_MAP_DATA).forEach((s) => {
            emptyData[s.name] = {
                ...s,
                count: 0,
                killed: 0,
                injured: 0,
                kidnapped: 0,
                recentAttacks: [],
            };
        });
        return emptyData;
    }

    useEffect(() => {
        if (!loading && svgRef.current) {
            // Animate dots
            const dots = svgRef.current.querySelectorAll(".threat-dot");
            gsap.fromTo(
                dots,
                { scale: 0, opacity: 0, transformOrigin: "center center" },
                { scale: 1, opacity: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.7)" }
            );

            // Animate paths (states)
            const paths = svgRef.current.querySelectorAll(".state-path");
            gsap.fromTo(paths, { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.01 });
        }
    }, [loading]);

    async function fetchMapData() {
        try {
            const res = await fetch("/api/attacks?limit=1000&sort=date_desc", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            const next = buildEmptyStateData();

            for (const attack of data.attacks || []) {
                // Normalize state name
                let stateName = attack.location?.state || "Unknown";
                stateName = stateName.replace(/\s+state$/i, "").trim();

                // Handle FCT variations
                if (
                    stateName.toLowerCase().includes("abuja") ||
                    stateName.toLowerCase().includes("capital") ||
                    stateName.toLowerCase() === "fct"
                ) {
                    stateName = "Federal Capital Territory";
                }

                // Case-insensitive match
                const matchedKey = Object.keys(next).find(
                    (k) => k.toLowerCase() === stateName.toLowerCase()
                );

                if (matchedKey) {
                    next[matchedKey].count++;
                    next[matchedKey].killed += attack.casualties?.killed || 0;
                    next[matchedKey].injured += attack.casualties?.injured || 0;
                    next[matchedKey].kidnapped += attack.casualties?.kidnapped || 0;
                    next[matchedKey].recentAttacks.push(attack);
                }
            }

            setStateData(next);
        } catch (err) {
            console.error("Error fetching map data:", err);
        } finally {
            setLoading(false);
        }
    }

    const maxCount = Math.max(1, ...Object.values(stateData).map((s) => s.count));

    function getDotColor(count: number): string {
        if (count === 0) return "var(--text-muted)";
        const intensity = count / maxCount;
        if (intensity > 0.7) return "var(--color-urgent)";
        if (intensity > 0.4) return "var(--color-ember)";
        if (intensity > 0.15) return "var(--color-caution)";
        return "var(--color-safe)";
    }

    function getDotRadius(count: number): number {
        if (count === 0) return 4;
        const intensity = count / maxCount;
        return 6 + intensity * 14;
    }

    function getFillOpacity(count: number): number {
        if (count === 0) return 0.2; // Base visibility
        // Scale opacity from 0.3 to 0.8 based on intensity
        return 0.3 + (count / maxCount) * 0.5;
    }

    const selected = selectedState ? stateData[selectedState] : null;

    // Pagination logic
    const itemsPerPage = 5;
    const totalPages = selected ? Math.ceil(selected.recentAttacks.length / itemsPerPage) : 0;
    const paginatedAttacks = selected 
        ? selected.recentAttacks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : [];

    // Sort states by count for ranking
    const rankedStates = Object.values(stateData)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 37); // Show all states in list if needed, or stick to top 15

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                    <div
                        className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                            background: "rgba(139,26,26,0.1)",
                            color: "var(--color-blood-light)",
                            border: "1px solid rgba(139,26,26,0.2)",
                        }}
                    >
                        <MapPinIcon className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                        Threat Geography
                    </div>
                </div>
                <h1
                    className="text-3xl sm:text-4xl font-bold mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                >
                    Nigeria Threat Map
                </h1>
                <p className="text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
                    Geographic distribution of recorded attacks. Hover over states to see details.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Area */}
                <div className="lg:col-span-2">
                    <div
                        className="glass-card rounded-2xl p-4 sm:p-6 relative overflow-hidden flex items-center justify-center bg-black/20 h-full"
                        style={{ minHeight: "660px" }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10 bg-black/10 backdrop-blur-sm">
                                <div className="shimmer w-16 h-16 rounded-full" />
                            </div>
                        ) : null}

                        <svg
                            ref={svgRef}
                            viewBox="0 0 1000 812"
                            className="w-full h-auto max-h-[700px]"
                            style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.3))" }}
                        >
                            <defs>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Render States */}
                            {Object.values(stateData).map((state) => {
                                const isSelected = selectedState === state.name;
                                const hasActivity = state.count > 0;
                                const fillColor = hasActivity ? getDotColor(state.count) : "var(--text-muted)";

                                return (
                                    <g key={state.id}
                                        onClick={() => setSelectedState(isSelected ? null : state.name)}
                                        className="cursor-pointer group transition-opacity duration-300"
                                    >
                                        <path
                                            d={state.path}
                                            className="state-path transition-all duration-300"
                                            fill={isSelected ? "rgba(255,255,255,0.1)" : "transparent"} // Fill only on selection/hover usually, or use low opacity
                                            style={{
                                                fill: isSelected ? "var(--accent)" : "transparent",
                                                fillOpacity: isSelected ? 0.2 : 0.05,
                                                stroke: isSelected ? "var(--text-primary)" : "rgba(255,255,255,0.25)",
                                                strokeWidth: isSelected ? 3.5 : 2
                                            }}
                                        />

                                        {/* Hover Overlay Path (invisible but broader target) */}
                                        <path
                                            d={state.path}
                                            fill="transparent"
                                            className="opacity-0 group-hover:opacity-10 transition-opacity duration-200"
                                            style={{ fill: "var(--text-primary)" }}
                                        />
                                    </g>
                                );
                            })}

                            {/* Render Dots on top */}
                            {Object.values(stateData).map((state) => {
                                const isSelected = selectedState === state.name;
                                const hasActivity = state.count > 0;
                                const color = getDotColor(state.count);
                                const radius = getDotRadius(state.count);

                                return (
                                    <g
                                        key={`dot-${state.id}`}
                                        className="threat-dot cursor-pointer group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedState(isSelected ? null : state.name);
                                        }}
                                        style={{ transformOrigin: `${state.x}px ${state.y}px`, opacity: hasActivity || isSelected ? 1 : 0.6 }}
                                    >
                                        {/* Pulse ring for active states - CSS Animation */}
                                        {hasActivity && (
                                            <circle
                                                cx={state.x}
                                                cy={state.y}
                                                r={radius}
                                                fill={color}
                                                className="animate-svg-pulse pointer-events-none"
                                                opacity="0.4"
                                            />
                                        )}

                                        <circle
                                            cx={state.x}
                                            cy={state.y}
                                            r={radius}
                                            fill={isSelected ? "#fff" : color}
                                            filter={hasActivity ? "url(#glow)" : ""}
                                            className="transition-transform duration-300 ease-out group-hover:scale-125 origin-center"
                                            style={{ transformBox: "fill-box" }}
                                        />

                                        {/* State Label */}
                                        <text
                                            x={state.x}
                                            y={state.y + radius + 14}
                                            textAnchor="middle"
                                            fill="#ffffff"
                                            fontSize="13"
                                            fontWeight="800"
                                            className={`transition-opacity duration-300 ${isSelected || hasActivity ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            style={{ pointerEvents: "none", textShadow: "0 2px 8px rgba(0,0,0,1)" }}
                                        >
                                            {state.name === "Federal Capital Territory" ? "FCT" : state.name}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Legend Overlay */}
                        <div className="absolute bottom-4 left-4 p-3 rounded-xl glass border border-white/5 pointer-events-none">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Intensity</span>
                                {[
                                    { color: "var(--color-safe)", label: "Low Activity" },
                                    { color: "var(--color-caution)", label: "Moderate" },
                                    { color: "var(--color-urgent)", label: "Critical" },
                                ].map((l) => (
                                    <div key={l.label} className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                                        <span className="text-[10px] text-secondary">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* Ranked States List */}
                    <div className="glass-card rounded-2xl p-5 overflow-hidden flex flex-col" style={{ minHeight: "660px", maxHeight: "660px" }}>
                        <h3
                            className="text-sm font-bold uppercase tracking-wider mb-4 flex-shrink-0"
                            style={{
                                fontFamily: "var(--font-heading)",
                                color: "var(--text-muted)",
                            }}
                        >
                            Affected Areas
                        </h3>

                        <div className="overflow-y-auto pr-2 space-y-1.5 flex-1 min-h-0 custom-scrollbar">
                            {rankedStates.map((state, i) => {
                                const barWidth = maxCount > 0 ? (state.count / maxCount) * 100 : 0;
                                const isActive = selectedState === state.name;
                                return (
                                    <button
                                        key={state.name}
                                        onClick={() => setSelectedState(isActive ? null : state.name)}
                                        className="w-full text-left p-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--border-subtle)] group relative overflow-hidden"
                                        style={{
                                            background: isActive ? "var(--border-subtle)" : "transparent",
                                            opacity: state.count === 0 && !isActive ? 0.6 : 1,
                                        }}
                                    >
                                        {/* Background bar for activity */}
                                        {state.count > 0 && (
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-xl opacity-10 transition-all duration-500"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    background: `linear-gradient(90deg, ${getDotColor(state.count)}, transparent)`,
                                                }}
                                            />
                                        )}

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                                                    style={{
                                                        background: "var(--border-subtle)",
                                                        color: "var(--text-muted)",
                                                    }}
                                                >
                                                    {i + 1}
                                                </span>
                                                <span
                                                    className="text-sm font-medium"
                                                    style={{ color: "var(--text-primary)" }}
                                                >
                                                    {state.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-bold tabular-nums"
                                                    style={{
                                                        fontFamily: "var(--font-mono)",
                                                        color: state.count > 0 ? getDotColor(state.count) : "var(--text-muted)",
                                                    }}
                                                >
                                                    {state.count}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Incident List Window */}
            {selected && (
                <div ref={incidentListRef} className="mt-8 animate-fade-in-up">
                    <div className="glass-card w-full rounded-2xl flex flex-col overflow-hidden border border-white/10">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                                    {selected.name} Incidents
                                </h2>
                                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                    {selected.count} Total Attacks | <span style={{ color: "var(--color-urgent)" }}>{selected.killed} Killed</span> | <span style={{ color: "var(--color-ember)" }}>{selected.injured} Injured</span> | <span style={{ color: "var(--color-caution)" }}>{selected.kidnapped} Kidnapped</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedState(null)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 max-h-[600px]">
                            {paginatedAttacks.length > 0 ? (
                                paginatedAttacks.map((attack: any, idx) => (
                                    <div key={idx} className="p-5 rounded-xl transition-colors hover:bg-[var(--border-subtle)]" style={{ background: "var(--bg-secondary)" }}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{attack.title}</h3>
                                            <span className="text-xs font-medium whitespace-nowrap ml-4" style={{ color: "var(--text-muted)" }}>
                                                {attack.date ? format(new Date(attack.date), "MMM d, yyyy") : ""}
                                            </span>
                                        </div>
                                        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{attack.description}</p>
                                        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                                            <div className="flex flex-wrap gap-4 text-xs font-bold">
                                                {attack.casualties?.killed > 0 && <span style={{ color: "var(--color-urgent)" }}>Killed: {attack.casualties.killed}</span>}
                                                {attack.casualties?.injured > 0 && <span style={{ color: "var(--color-ember)" }}>Injured: {attack.casualties.injured}</span>}
                                                {attack.casualties?.kidnapped > 0 && <span style={{ color: "var(--color-caution)" }}>Kidnapped: {attack.casualties.kidnapped}</span>}
                                                {(!attack.casualties?.killed && !attack.casualties?.injured && !attack.casualties?.kidnapped) && <span style={{ color: "var(--text-muted)" }}>No casualties reported</span>}
                                            </div>
                                            {(attack.sources && attack.sources.length > 0) && (
                                                <a
                                                    href={attack.sources[0].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold hover:underline flex items-center gap-1"
                                                    style={{ color: "var(--color-accent)" }}
                                                >
                                                    Source <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted">No incidents recorded for this state.</div>
                            )}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-white/10 flex items-center justify-between" style={{ background: "var(--bg-secondary)" }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                                    style={{
                                        background: currentPage === 1 ? "var(--border-subtle)" : "rgba(139,26,26,0.15)",
                                        color: currentPage === 1 ? "var(--text-muted)" : "var(--color-blood-light)",
                                        border: `1px solid ${currentPage === 1 ? "transparent" : "rgba(139,26,26,0.3)"}`,
                                    }}
                                >
                                    &larr; Previous
                                </button>
                                <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110"
                                    style={{
                                        background: currentPage === totalPages ? "var(--border-subtle)" : "rgba(139,26,26,0.15)",
                                        color: currentPage === totalPages ? "var(--text-muted)" : "var(--color-blood-light)",
                                        border: `1px solid ${currentPage === totalPages ? "transparent" : "rgba(139,26,26,0.3)"}`,
                                    }}
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
