"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import {
    MapPinIcon,
    ExclamationTriangleIcon,
    FireIcon,
} from "@heroicons/react/24/outline";

// Approximate coordinates for Nigerian states (center points)
const STATE_COORDS: Record<string, { x: number; y: number; }> = {
    "Abia": { x: 62, y: 72 },
    "Adamawa": { x: 72, y: 38 },
    "Akwa Ibom": { x: 56, y: 80 },
    "Anambra": { x: 55, y: 68 },
    "Bauchi": { x: 60, y: 32 },
    "Bayelsa": { x: 48, y: 82 },
    "Benue": { x: 58, y: 54 },
    "Borno": { x: 76, y: 22 },
    "Cross River": { x: 60, y: 76 },
    "Delta": { x: 46, y: 76 },
    "Ebonyi": { x: 60, y: 68 },
    "Edo": { x: 44, y: 68 },
    "Ekiti": { x: 38, y: 58 },
    "Enugu": { x: 56, y: 64 },
    "FCT": { x: 50, y: 46 },
    "Gombe": { x: 66, y: 32 },
    "Imo": { x: 54, y: 72 },
    "Jigawa": { x: 58, y: 20 },
    "Kaduna": { x: 50, y: 30 },
    "Kano": { x: 54, y: 22 },
    "Katsina": { x: 48, y: 18 },
    "Kebbi": { x: 32, y: 22 },
    "Kogi": { x: 48, y: 56 },
    "Kwara": { x: 36, y: 48 },
    "Lagos": { x: 28, y: 68 },
    "Nasarawa": { x: 56, y: 46 },
    "Niger": { x: 42, y: 36 },
    "Ogun": { x: 28, y: 64 },
    "Ondo": { x: 36, y: 62 },
    "Osun": { x: 34, y: 56 },
    "Oyo": { x: 30, y: 54 },
    "Plateau": { x: 58, y: 40 },
    "Rivers": { x: 52, y: 80 },
    "Sokoto": { x: 36, y: 16 },
    "Taraba": { x: 66, y: 44 },
    "Yobe": { x: 70, y: 22 },
    "Zamfara": { x: 42, y: 22 },
};

interface StateData {
    state: string;
    count: number;
}

export default function ThreatMapPage() {
    const [stateData, setStateData] = useState<StateData[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [stateAttacks, setStateAttacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/stats");
                if (!res.ok) return;
                const data = await res.json();
                setStateData(data.byState || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!mapRef.current || loading) return;
        const dots = mapRef.current.querySelectorAll(".threat-dot");
        gsap.fromTo(
            dots,
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                stagger: 0.05,
                ease: "back.out(1.7)",
            }
        );
    }, [stateData, loading]);

    async function handleStateClick(stateName: string) {
        setSelectedState(stateName);
        try {
            const res = await fetch(`/api/attacks?state=${encodeURIComponent(stateName)}&limit=5`);
            if (!res.ok) return;
            const data = await res.json();
            setStateAttacks(data.attacks || []);
        } catch (err) {
            console.error(err);
        }
    }

    const maxCount = Math.max(...stateData.map((s) => s.count), 1);

    function getHeatColor(count: number): string {
        const ratio = count / maxCount;
        if (ratio > 0.7) return "var(--color-urgent)";
        if (ratio > 0.4) return "var(--color-flame)";
        if (ratio > 0.2) return "var(--color-caution)";
        return "var(--color-sand)";
    }

    function getDotSize(count: number): number {
        const ratio = count / maxCount;
        return 12 + ratio * 28;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Threat Map
                </h1>
                <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                    Geographic distribution of attacks across Nigerian states. Larger dots indicate higher attack frequency.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Area */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 relative overflow-hidden animate-fade-in-up stagger-1">
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                            Threat Intensity
                        </span>
                        <div className="flex items-center gap-3">
                            {[
                                { color: "var(--color-sand)", label: "Low" },
                                { color: "var(--color-caution)", label: "Medium" },
                                { color: "var(--color-flame)", label: "High" },
                                { color: "var(--color-urgent)", label: "Critical" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                                    <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Container */}
                    <div
                        ref={mapRef}
                        className="relative w-full rounded-xl overflow-hidden"
                        style={{
                            aspectRatio: "1 / 1.1",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-subtle)",
                        }}
                    >
                        {/* Grid overlay */}
                        <div className="absolute inset-0 bg-dot-grid opacity-30" />

                        {/* Nigeria outline approximation — subtle border */}
                        <div
                            className="absolute inset-[10%] rounded-[40%_30%_30%_35%] border-2 opacity-10"
                            style={{ borderColor: "var(--color-sand)" }}
                        />

                        {/* State dots */}
                        {stateData.map((sd) => {
                            const coords = STATE_COORDS[sd.state];
                            if (!coords) return null;
                            const size = getDotSize(sd.count);
                            const color = getHeatColor(sd.count);
                            const isSelected = selectedState === sd.state;

                            return (
                                <button
                                    key={sd.state}
                                    className="threat-dot absolute transform -translate-x-1/2 -translate-y-1/2 
                    rounded-full transition-all duration-300 group z-10"
                                    style={{
                                        left: `${coords.x}%`,
                                        top: `${coords.y}%`,
                                        width: size,
                                        height: size,
                                        background: color,
                                        boxShadow: isSelected
                                            ? `0 0 0 4px ${color}44, 0 0 20px ${color}33`
                                            : `0 0 10px ${color}33`,
                                        opacity: 0,
                                    }}
                                    onClick={() => handleStateClick(sd.state)}
                                    aria-label={`${sd.state}: ${sd.count} attacks`}
                                >
                                    {/* Pulse */}
                                    <span
                                        className="absolute inset-0 rounded-full animate-ping"
                                        style={{ background: color, opacity: 0.2 }}
                                    />

                                    {/* Tooltip */}
                                    <div
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                    px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold z-20"
                                        style={{
                                            background: "var(--bg-card)",
                                            color: "var(--text-primary)",
                                            boxShadow: "var(--shadow-elevated)",
                                        }}
                                    >
                                        <span style={{ color }}>{sd.state}</span>: {sd.count} attack{sd.count !== 1 ? "s" : ""}
                                    </div>
                                </button>
                            );
                        })}

                        {/* Empty state */}
                        {stateData.length === 0 && !loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <MapPinIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                        No geographical data available yet
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar — State Detail */}
                <div className="animate-fade-in-up stagger-2">
                    {selectedState ? (
                        <div className="glass-card rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPinIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
                                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                                    {selectedState} State
                                </h3>
                            </div>

                            <div className="flex items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                                <div className="text-center">
                                    <p className="text-2xl font-bold" style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}>
                                        {stateData.find((s) => s.state === selectedState)?.count || 0}
                                    </p>
                                    <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                        Attacks
                                    </p>
                                </div>
                            </div>

                            {/* Recent attacks in this state */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                                    Recent Incidents
                                </h4>
                                {stateAttacks.length > 0 ? (
                                    <div className="space-y-3">
                                        {stateAttacks.map((attack: any) => (
                                            <div
                                                key={attack._id}
                                                className="p-3 rounded-xl transition-all duration-200 hover:bg-[var(--border-subtle)]"
                                                style={{ border: "1px solid var(--border-subtle)" }}
                                            >
                                                <h5 className="text-sm font-semibold mb-1 line-clamp-2">{attack.title}</h5>
                                                <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                                                    <span>{new Date(attack.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</span>
                                                    <span>•</span>
                                                    <span>{attack.group}</span>
                                                </div>
                                                {attack.casualties?.killed > 0 && (
                                                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold" style={{ color: "var(--color-urgent)" }}>
                                                        <FireIcon className="w-3 h-3" />
                                                        {attack.casualties.killed} killed
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        No recent incidents in this state
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl p-8 text-center">
                            <ExclamationTriangleIcon
                                className="w-10 h-10 mx-auto mb-3"
                                style={{ color: "var(--text-muted)" }}
                            />
                            <h3 className="text-base font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                                Select a Region
                            </h3>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                Click on any threat dot on the map to view detailed incident data for that state.
                            </p>
                        </div>
                    )}

                    {/* Top affected states list */}
                    {stateData.length > 0 && (
                        <div className="glass-card rounded-2xl p-6 mt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
                                Most Affected States
                            </h4>
                            <div className="space-y-2">
                                {stateData.slice(0, 8).map((sd, i) => (
                                    <button
                                        key={sd.state}
                                        onClick={() => handleStateClick(sd.state)}
                                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm
                      transition-all duration-200 hover:bg-[var(--border-subtle)]"
                                        style={{
                                            background: selectedState === sd.state ? "var(--border-subtle)" : undefined,
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                                                style={{
                                                    background: `${getHeatColor(sd.count)}22`,
                                                    color: getHeatColor(sd.count),
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                                                {sd.state}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                                            {sd.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
