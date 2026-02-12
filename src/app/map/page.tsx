"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import {
    MapPinIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

// Precise Nigeria vector path (simplified for performance)
// ViewBox: 0 0 800 640
const NIGERIA_PATH = "M64.5,502.8 L64.5,502.8 L59.6,478.4 L69.3,456.4 L57.1,434.4 L57.1,434.4 L62,410 L81.5,402.7 L88.8,375.8 L76.6,356.3 L88.8,327 L88.8,295.2 L120.5,234.2 L149.8,209.8 L154.7,148.8 L164.5,126.8 L201.1,104.8 L223.1,68.2 L264.6,36.5 L303.7,29.1 L315.9,34 L369.6,26.7 L391.6,24.2 L455.1,19.4 L479.5,21.8 L540.6,31.6 L616.3,43.8 L677.3,73.1 L694.4,92.6 L718.8,119.5 L731.1,136.6 L750.6,183 L772.6,205 L775,224.5 L775,241.6 L792.1,263.6 L794.6,283.1 L784.8,300.2 L770.1,317.3 L760.4,324.6 L755.5,339.3 L748.2,341.7 L723.7,332 L699.3,310 L689.5,310 L665.1,317.3 L657.8,324.6 L648,322.2 L640.7,305.1 L626,295.3 L606.5,295.3 L589.4,307.5 L567.4,324.6 L552.8,346.6 L540.6,375.9 L523.5,397.9 L496.6,432 L477.1,454 L460,473.5 L428.2,490.6 L416,505.3 L389.2,497.9 L359.9,493 L328.1,495.5 L298.8,495.5 L269.5,476 L237.8,468.6 L213.3,454 L193.8,451.5 L176.7,461.3 L164.5,488.2 L149.8,505.3 L125.4,529.7 L98.5,527.2 L64.5,502.8 Z";

// State centers mapped to the 800x640 viewBox
const STATE_POSITIONS: Record<string, { x: number; y: number; }> = {
    "Abia": { x: 380, y: 500 },
    "Adamawa": { x: 700, y: 260 },
    "Akwa Ibom": { x: 400, y: 530 },
    "Anambra": { x: 350, y: 460 },
    "Bauchi": { x: 500, y: 200 },
    "Bayelsa": { x: 300, y: 530 },
    "Benue": { x: 430, y: 370 },
    "Borno": { x: 720, y: 130 },
    "Cross River": { x: 440, y: 480 },
    "Delta": { x: 280, y: 470 },
    "Ebonyi": { x: 410, y: 460 },
    "Edo": { x: 280, y: 410 },
    "Ekiti": { x: 240, y: 370 },
    "Enugu": { x: 380, y: 440 },
    "FCT": { x: 350, y: 290 },
    "Gombe": { x: 620, y: 220 },
    "Imo": { x: 360, y: 490 },
    "Jigawa": { x: 480, y: 100 },
    "Kaduna": { x: 360, y: 200 },
    "Kano": { x: 430, y: 110 },
    "Katsina": { x: 360, y: 60 },
    "Kebbi": { x: 150, y: 100 },
    "Kogi": { x: 320, y: 350 },
    "Kwara": { x: 200, y: 300 },
    "Lagos": { x: 130, y: 440 },
    "Nasarawa": { x: 400, y: 320 },
    "Niger": { x: 250, y: 250 },
    "Ogun": { x: 140, y: 400 },
    "Ondo": { x: 220, y: 400 },
    "Osun": { x: 190, y: 380 },
    "Oyo": { x: 160, y: 350 },
    "Plateau": { x: 480, y: 280 },
    "Rivers": { x: 340, y: 540 },
    "Sokoto": { x: 190, y: 60 },
    "Taraba": { x: 600, y: 340 },
    "Yobe": { x: 650, y: 120 },
    "Zamfara": { x: 270, y: 110 },
};

interface StateData {
    state: string;
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
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        // Initialize state data structure with 0s for all states ensure list is never empty
        const initialData: Record<string, StateData> = {};
        Object.keys(STATE_POSITIONS).forEach(state => {
            initialData[state] = {
                state,
                count: 0,
                killed: 0,
                injured: 0,
                kidnapped: 0,
                recentAttacks: []
            };
        });
        setStateData(initialData);

        fetchMapData();
    }, []);

    useEffect(() => {
        if (!loading && svgRef.current) {
            const dots = svgRef.current.querySelectorAll(".threat-dot");
            gsap.fromTo(
                dots,
                { scale: 0, opacity: 0, transformOrigin: "center center" },
                { scale: 1, opacity: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.7)" }
            );
        }
    }, [loading]);

    async function fetchMapData() {
        try {
            const res = await fetch("/api/attacks?limit=1000&sort=date&order=desc");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            setStateData(prev => {
                const next = { ...prev };

                for (const attack of data.attacks || []) {
                    // Normalize state name (e.g. "Lagos State" -> "Lagos")
                    let stateName = attack.location?.state || "Unknown";
                    stateName = stateName.replace(/\s+state$/i, "").trim();

                    // Handle FCT
                    if (stateName.toLowerCase().includes("abuja") || stateName.toLowerCase().includes("capital")) {
                        stateName = "FCT";
                    }

                    // Case-insensitive match against our map keys
                    const matchedKey = Object.keys(STATE_POSITIONS).find(
                        k => k.toLowerCase() === stateName.toLowerCase()
                    );

                    if (matchedKey) {
                        next[matchedKey].count++;
                        next[matchedKey].killed += attack.casualties?.killed || 0;
                        next[matchedKey].injured += attack.casualties?.injured || 0;
                        next[matchedKey].kidnapped += attack.casualties?.kidnapped || 0;
                        if (next[matchedKey].recentAttacks.length < 5) {
                            next[matchedKey].recentAttacks.push(attack);
                        }
                    }
                }
                return next;
            });
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

    const selected = selectedState ? stateData[selectedState] : null;

    // Sort states by count for the sidebar ranking
    const rankedStates = Object.values(stateData)
        .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state)); // Secondary sort by name

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
                    Geographic distribution of recorded attacks. Dot size and color represent incident
                    frequency. Click any state to view details.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Area */}
                <div className="lg:col-span-2">
                    <div
                        className="glass-card rounded-2xl p-4 sm:p-6 relative overflow-hidden flex items-center justify-center bg-black/20"
                        style={{ minHeight: "500px" }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10 bg-black/10 backdrop-blur-sm">
                                <div className="shimmer w-16 h-16 rounded-full" />
                            </div>
                        ) : null}

                        <svg
                            ref={svgRef}
                            viewBox="0 0 800 640"
                            className="w-full h-auto max-h-[600px]"
                            style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.3))" }}
                        >
                            <defs>
                                {/* Glow filter for dots */}
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="mapGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="var(--bg-secondary)" />
                                    <stop offset="100%" stopColor="var(--border-subtle)" />
                                </linearGradient>
                            </defs>

                            {/* Nigeria Map Path */}
                            <path
                                d={NIGERIA_PATH}
                                fill="url(#mapGradient)"
                                stroke="var(--border-glass)"
                                strokeWidth="1.5"
                                className="transition-all duration-300"
                            />

                            {/* Threat Dots */}
                            {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
                                const data = stateData[state];
                                if (!data) return null;

                                const radius = getDotRadius(data.count);
                                const color = getDotColor(data.count);
                                const isSelected = selectedState === state;
                                const hasActivity = data.count > 0;

                                return (
                                    <g
                                        key={state}
                                        className="threat-dot cursor-pointer group"
                                        onClick={() => setSelectedState(isSelected ? null : state)}
                                        style={{ transformOrigin: `${pos.x}px ${pos.y}px`, opacity: hasActivity || isSelected ? 1 : 0.4 }}
                                    >
                                        {/* Pulse ring for active states */}
                                        {hasActivity && (
                                            <circle
                                                cx={pos.x}
                                                cy={pos.y}
                                                r={radius + 8}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="1"
                                                opacity="0.2"
                                            >
                                                <animate
                                                    attributeName="r"
                                                    values={`${radius + 2};${radius + 15};${radius + 2}`}
                                                    dur="3s"
                                                    repeatCount="indefinite"
                                                />
                                                <animate
                                                    attributeName="opacity"
                                                    values="0.2;0;0.2"
                                                    dur="3s"
                                                    repeatCount="indefinite"
                                                />
                                            </circle>
                                        )}

                                        {/* Main Dot */}
                                        <circle
                                            cx={pos.x}
                                            cy={pos.y}
                                            r={radius}
                                            fill={isSelected ? "#fff" : color}
                                            filter={hasActivity ? "url(#glow)" : ""}
                                            className="transition-all duration-300 group-hover:scale-125"
                                        />

                                        {/* State Label (Always visible for context) */}
                                        <text
                                            x={pos.x}
                                            y={pos.y + radius + 10}
                                            textAnchor="middle"
                                            fill="var(--text-muted)"
                                            fontSize="8"
                                            fontWeight="500"
                                            className={`transition-opacity duration-300 ${isSelected || hasActivity ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            style={{ pointerEvents: "none" }}
                                        >
                                            {state}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Legend Overlay */}
                        <div className="absolute bottom-4 left-4 p-3 rounded-xl glass border border-white/5">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Intensity</span>
                                {[
                                    { color: "var(--color-safe)", label: "Low Activity" },
                                    { color: "var(--color-caution)", label: "Moderate" },
                                    { color: "var(--color-urgent)", label: "Critical" },
                                ].map(l => (
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
                <div className="lg:col-span-1 h-[600px] flex flex-col">
                    {/* Selected State Detail */}
                    {selected && (
                        <div className="glass-card rounded-2xl p-5 mb-4 animate-fade-in-up flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3
                                    className="text-lg font-bold"
                                    style={{ fontFamily: "var(--font-heading)" }}
                                >
                                    {selected.state}
                                </h3>
                                <button
                                    onClick={() => setSelectedState(null)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--border-subtle)] transition-colors"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Attacks</div>
                                    <div className="text-xl font-bold" style={{ color: "var(--color-blood-light)" }}>
                                        {selected.count}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Killed</div>
                                    <div className="text-xl font-bold" style={{ color: "var(--color-urgent)" }}>
                                        {selected.killed}
                                    </div>
                                </div>
                            </div>

                            {/* Recent attacks in state */}
                            {selected.recentAttacks.length > 0 ? (
                                <div>
                                    <h4
                                        className="text-xs font-bold uppercase tracking-wider mb-2"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        Latest Incident
                                    </h4>
                                    <div
                                        className="p-3 rounded-xl transition-colors hover:bg-[var(--border-subtle)]"
                                        style={{ background: "var(--bg-secondary)" }}
                                    >
                                        <p
                                            className="text-xs font-semibold leading-snug mb-1 line-clamp-2"
                                            style={{ color: "var(--text-primary)" }}
                                        >
                                            {selected.recentAttacks[0].title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                                {selected.recentAttacks[0].date ? format(new Date(selected.recentAttacks[0].date), "MMM d") : ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-center py-2 text-muted">No recent incidents recorded.</div>
                            )}
                        </div>
                    )}

                    {/* Ranked States List - Scrollable */}
                    <div className="glass-card rounded-2xl p-5 flex-1 overflow-hidden flex flex-col">
                        <h3
                            className="text-sm font-bold uppercase tracking-wider mb-4 flex-shrink-0"
                            style={{
                                fontFamily: "var(--font-heading)",
                                color: "var(--text-muted)",
                            }}
                        >
                            Affected Areas
                        </h3>

                        <div className="overflow-y-auto pr-2 space-y-1.5 flex-1 custom-scrollbar">
                            {rankedStates.map((state, i) => {
                                const barWidth = maxCount > 0 ? (state.count / maxCount) * 100 : 0;
                                const isActive = selectedState === state.state;
                                return (
                                    <button
                                        key={state.state}
                                        onClick={() =>
                                            setSelectedState(isActive ? null : state.state)
                                        }
                                        className="w-full text-left p-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--border-subtle)] group relative overflow-hidden"
                                        style={{
                                            background: isActive ? "var(--border-subtle)" : "transparent",
                                            opacity: state.count === 0 && !isActive ? 0.6 : 1
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
                                                    {state.state}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: state.count > 0 ? getDotColor(state.count) : "var(--text-muted)" }}
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
        </div>
    );
}
