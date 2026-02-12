"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import {
    MapPinIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

// Nigerian state approximate center coordinates mapped to SVG viewBox (0 0 1000 1000)
// Transform: x = (lon - 2.5) / (12.5) * 1000, y = (14.0 - lat) / (10.0) * 1000
const STATE_POSITIONS: Record<string, { x: number; y: number; }> = {
    "Abia": { x: 400, y: 860 },
    "Adamawa": { x: 800, y: 470 },
    "Akwa Ibom": { x: 424, y: 910 },
    "Anambra": { x: 360, y: 780 },
    "Bauchi": { x: 584, y: 370 },
    "Bayelsa": { x: 310, y: 940 },
    "Benue": { x: 504, y: 650 },
    "Borno": { x: 860, y: 220 },
    "Cross River": { x: 470, y: 830 },
    "Delta": { x: 296, y: 850 },
    "Ebonyi": { x: 448, y: 770 },
    "Edo": { x: 280, y: 740 },
    "Ekiti": { x: 246, y: 640 },
    "Enugu": { x: 400, y: 740 },
    "FCT": { x: 400, y: 490 },
    "Gombe": { x: 700, y: 370 },
    "Imo": { x: 370, y: 850 },
    "Jigawa": { x: 560, y: 180 },
    "Kaduna": { x: 410, y: 340 },
    "Kano": { x: 500, y: 200 },
    "Katsina": { x: 430, y: 110 },
    "Kebbi": { x: 200, y: 150 },
    "Kogi": { x: 350, y: 650 },
    "Kwara": { x: 230, y: 540 },
    "Lagos": { x: 110, y: 740 },
    "Nasarawa": { x: 490, y: 550 },
    "Niger": { x: 310, y: 400 },
    "Ogun": { x: 120, y: 700 },
    "Ondo": { x: 230, y: 680 },
    "Osun": { x: 200, y: 640 },
    "Oyo": { x: 160, y: 590 },
    "Plateau": { x: 536, y: 480 },
    "Rivers": { x: 370, y: 920 },
    "Sokoto": { x: 250, y: 90 },
    "Taraba": { x: 680, y: 580 },
    "Yobe": { x: 770, y: 200 },
    "Zamfara": { x: 320, y: 170 },
};

// Simplified Nigeria outline SVG path
const NIGERIA_OUTLINE = `
  M 60,760 
  C 60,720 62,680 70,640 
  C 75,610 80,580 85,550 
  C 90,520 88,490 90,460 
  C 92,430 90,400 92,370 
  C 95,330 100,290 110,250 
  C 120,210 135,170 150,130 
  C 160,100 170,75 190,55 
  L 220,40 260,30 310,25 360,20 
  L 420,18 480,20 540,25 
  L 590,30 640,40 680,55 
  C 700,65 720,80 740,95 
  L 760,115 780,140 800,170 
  L 820,200 840,230 850,260 
  C 870,280 885,300 900,330 
  C 920,360 935,385 945,400 
  L 955,380 970,350 980,330 
  L 990,300 995,270 990,240 
  C 985,220 975,200 965,185 
  L 960,210 950,240 940,270 
  C 930,285 920,295 910,310 
  L 900,330
  M 900,330
  C 890,350 880,370 870,395 
  C 860,420 850,445 840,465 
  C 830,490 815,515 800,535 
  C 785,555 770,575 755,595 
  C 740,615 720,635 700,650 
  C 680,665 660,680 640,695 
  L 610,720 580,745 560,770 
  C 540,790 525,810 510,830 
  L 490,855 475,880 465,905 
  C 455,925 448,940 440,955 
  L 420,960 400,955 380,945 
  C 368,935 355,940 340,950 
  L 315,960 290,950 268,935 
  C 250,920 235,905 220,895 
  L 200,880 175,860 155,840 
  C 135,820 115,800 100,785 
  L 80,770 60,760 Z
`;

// A simpler filled polygon for the Nigeria shape background
const NIGERIA_POLYGON = "60,760 62,720 70,640 80,580 90,460 92,370 110,250 135,170 170,75 190,55 220,40 310,25 420,18 540,25 640,40 720,80 760,115 800,170 840,230 900,330 945,400 970,350 990,300 995,270 990,240 965,185 940,160 920,140 910,130 920,150 940,180 960,210 970,240 985,260 990,290 980,330 955,380 945,400 900,330 870,395 840,465 800,535 755,595 700,650 640,695 580,745 510,830 465,905 440,955 400,955 340,950 290,950 220,895 155,840 100,785 60,760";

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
        fetchMapData();
    }, []);

    useEffect(() => {
        if (!loading && svgRef.current) {
            const dots = svgRef.current.querySelectorAll(".threat-dot");
            gsap.fromTo(
                dots,
                { scale: 0, opacity: 0, transformOrigin: "center center" },
                { scale: 1, opacity: 1, duration: 0.5, stagger: 0.03, ease: "back.out(1.7)" }
            );
        }
    }, [loading, stateData]);

    async function fetchMapData() {
        try {
            const res = await fetch("/api/attacks?limit=500&sort=date&order=desc");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();

            const grouped: Record<string, StateData> = {};

            for (const attack of data.attacks || []) {
                const state = attack.location?.state || "Unknown";
                if (!grouped[state]) {
                    grouped[state] = {
                        state,
                        count: 0,
                        killed: 0,
                        injured: 0,
                        kidnapped: 0,
                        recentAttacks: [],
                    };
                }
                grouped[state].count++;
                grouped[state].killed += attack.casualties?.killed || 0;
                grouped[state].injured += attack.casualties?.injured || 0;
                grouped[state].kidnapped += attack.casualties?.kidnapped || 0;
                if (grouped[state].recentAttacks.length < 5) {
                    grouped[state].recentAttacks.push(attack);
                }
            }

            setStateData(grouped);
        } catch (err) {
            console.error("Error fetching map data:", err);
        } finally {
            setLoading(false);
        }
    }

    const maxCount = Math.max(1, ...Object.values(stateData).map((s) => s.count));

    function getDotColor(count: number): string {
        const intensity = count / maxCount;
        if (intensity > 0.7) return "var(--color-urgent)";
        if (intensity > 0.4) return "var(--color-ember)";
        if (intensity > 0.15) return "var(--color-caution)";
        return "var(--color-safe)";
    }

    function getDotRadius(count: number): number {
        const intensity = count / maxCount;
        return 6 + intensity * 18;
    }

    const selected = selectedState ? stateData[selectedState] : null;

    // Sort states by count for the sidebar ranking
    const rankedStates = Object.values(stateData)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

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
                        className="glass-card rounded-2xl p-4 sm:p-6 relative overflow-hidden"
                        style={{ minHeight: "500px" }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <div className="shimmer w-16 h-16 rounded-full" />
                            </div>
                        ) : (
                            <svg
                                ref={svgRef}
                                viewBox="0 0 1060 1000"
                                className="w-full h-auto"
                                style={{ maxHeight: "700px" }}
                            >
                                {/* Background grid */}
                                <defs>
                                    <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                                        <path
                                            d="M 50 0 L 0 0 0 50"
                                            fill="none"
                                            stroke="var(--border-subtle)"
                                            strokeWidth="0.5"
                                            opacity="0.3"
                                        />
                                    </pattern>
                                    {/* Glow filter for dots */}
                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    {/* Pattern for Nigeria fill */}
                                    <pattern id="nigeriaFill" width="8" height="8" patternUnits="userSpaceOnUse">
                                        <rect width="8" height="8" fill="var(--bg-secondary)" />
                                        <circle cx="4" cy="4" r="0.5" fill="var(--text-muted)" opacity="0.15" />
                                    </pattern>
                                </defs>

                                <rect width="1060" height="1000" fill="url(#mapGrid)" />

                                {/* Nigeria outline - filled shape */}
                                <polygon
                                    points={NIGERIA_POLYGON}
                                    fill="url(#nigeriaFill)"
                                    stroke="var(--text-muted)"
                                    strokeWidth="2"
                                    opacity="0.85"
                                />

                                {/* Nigeria border path for a cleaner outline */}
                                <path
                                    d={NIGERIA_OUTLINE}
                                    fill="none"
                                    stroke="var(--text-muted)"
                                    strokeWidth="2.5"
                                    strokeLinejoin="round"
                                    opacity="0.6"
                                />

                                {/* Compass rose */}
                                <g transform="translate(950, 900)" opacity="0.4">
                                    <text
                                        x="0"
                                        y="-20"
                                        textAnchor="middle"
                                        fill="var(--text-muted)"
                                        fontSize="14"
                                        fontWeight="bold"
                                    >
                                        N
                                    </text>
                                    <line x1="0" y1="-15" x2="0" y2="15" stroke="var(--text-muted)" strokeWidth="1.5" />
                                    <polygon points="0,-15 -4,-8 4,-8" fill="var(--text-muted)" />
                                </g>

                                {/* State labels (for states without data - show as faint labels) */}
                                {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
                                    const data = stateData[state];
                                    if (data) return null; // Will be shown as dot
                                    return (
                                        <text
                                            key={state}
                                            x={pos.x}
                                            y={pos.y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="var(--text-muted)"
                                            fontSize="8"
                                            opacity="0.4"
                                        >
                                            {state}
                                        </text>
                                    );
                                })}

                                {/* Threat dots */}
                                {Object.entries(STATE_POSITIONS).map(([state, pos]) => {
                                    const data = stateData[state];
                                    if (!data) return null;

                                    const radius = getDotRadius(data.count);
                                    const color = getDotColor(data.count);
                                    const isSelected = selectedState === state;

                                    return (
                                        <g
                                            key={state}
                                            className="threat-dot cursor-pointer"
                                            onClick={() => setSelectedState(isSelected ? null : state)}
                                            style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                                        >
                                            {/* Pulse ring for high-threat states */}
                                            {data.count / maxCount > 0.5 && (
                                                <circle
                                                    cx={pos.x}
                                                    cy={pos.y}
                                                    r={radius + 4}
                                                    fill="none"
                                                    stroke={color}
                                                    strokeWidth="1.5"
                                                    opacity="0.3"
                                                >
                                                    <animate
                                                        attributeName="r"
                                                        values={`${radius + 2};${radius + 12};${radius + 2}`}
                                                        dur="2.5s"
                                                        repeatCount="indefinite"
                                                    />
                                                    <animate
                                                        attributeName="opacity"
                                                        values="0.3;0;0.3"
                                                        dur="2.5s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            )}

                                            {/* Main dot */}
                                            <circle
                                                cx={pos.x}
                                                cy={pos.y}
                                                r={radius}
                                                fill={color}
                                                opacity={isSelected ? 1 : 0.75}
                                                stroke={isSelected ? "#fff" : "none"}
                                                strokeWidth={isSelected ? 3 : 0}
                                                filter="url(#glow)"
                                                style={{ transition: "all 0.3s ease" }}
                                            />

                                            {/* Count label */}
                                            <text
                                                x={pos.x}
                                                y={pos.y}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                fill="#fff"
                                                fontSize={radius > 14 ? "11" : "8"}
                                                fontWeight="bold"
                                                style={{ pointerEvents: "none" }}
                                            >
                                                {data.count}
                                            </text>

                                            {/* State name label */}
                                            <text
                                                x={pos.x}
                                                y={pos.y + radius + 12}
                                                textAnchor="middle"
                                                fill="var(--text-secondary)"
                                                fontSize="9"
                                                fontWeight="600"
                                                style={{ pointerEvents: "none" }}
                                            >
                                                {state}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        )}

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 mt-4 px-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                Threat Level:
                            </span>
                            {[
                                { color: "var(--color-safe)", label: "Low" },
                                { color: "var(--color-caution)", label: "Moderate" },
                                { color: "var(--color-ember)", label: "High" },
                                { color: "var(--color-urgent)", label: "Critical" },
                            ].map((level) => (
                                <div key={level.label} className="flex items-center gap-1.5">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: level.color }}
                                    />
                                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                        {level.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Selected State Detail */}
                    {selected && (
                        <div className="glass-card rounded-2xl p-5 animate-fade-in-up">
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
                                <div className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Injured</div>
                                    <div className="text-xl font-bold" style={{ color: "var(--color-caution)" }}>
                                        {selected.injured}
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Kidnapped</div>
                                    <div className="text-xl font-bold" style={{ color: "var(--color-verified)" }}>
                                        {selected.kidnapped}
                                    </div>
                                </div>
                            </div>

                            {/* Recent attacks in state */}
                            <div>
                                <h4
                                    className="text-xs font-bold uppercase tracking-wider mb-3"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Recent Incidents
                                </h4>
                                <div className="space-y-2">
                                    {selected.recentAttacks.map((attack: any, i: number) => (
                                        <div
                                            key={attack._id || i}
                                            className="p-3 rounded-xl transition-colors hover:bg-[var(--border-subtle)]"
                                            style={{ background: "var(--bg-secondary)" }}
                                        >
                                            <p
                                                className="text-xs font-semibold leading-snug mb-1 line-clamp-2"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                {attack.title}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                                    {attack.date ? format(new Date(attack.date), "MMM d, yyyy") : "Unknown"}
                                                </span>
                                                {attack.casualties?.killed > 0 && (
                                                    <span
                                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                        style={{
                                                            background: "rgba(255,59,48,0.12)",
                                                            color: "var(--color-urgent)",
                                                        }}
                                                    >
                                                        {attack.casualties.killed} killed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ranked States */}
                    <div className="glass-card rounded-2xl p-5">
                        <h3
                            className="text-sm font-bold uppercase tracking-wider mb-4"
                            style={{
                                fontFamily: "var(--font-heading)",
                                color: "var(--text-muted)",
                            }}
                        >
                            Most Affected States
                        </h3>

                        {rankedStates.length === 0 ? (
                            <div className="text-center py-8">
                                <ExclamationTriangleIcon
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--text-muted)" }}
                                />
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    No data available yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {rankedStates.map((state, i) => {
                                    const barWidth = (state.count / maxCount) * 100;
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
                                            }}
                                        >
                                            {/* Background bar */}
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-xl opacity-8 transition-all duration-500"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    background: `linear-gradient(90deg, ${getDotColor(state.count)}20, transparent)`,
                                                }}
                                            />

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
                                                        style={{ color: getDotColor(state.count) }}
                                                    >
                                                        {state.count}
                                                    </span>
                                                    {state.killed > 0 && (
                                                        <span
                                                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                                            style={{
                                                                background: "rgba(255,59,48,0.1)",
                                                                color: "var(--color-urgent)",
                                                            }}
                                                        >
                                                            {state.killed}†
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
