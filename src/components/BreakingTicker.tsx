"use client";

import { useEffect, useState } from "react";

interface TickerItem {
    title: string;
    location: string;
    date: string;
}

export default function BreakingTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);

    useEffect(() => {
        async function fetchRecent() {
            try {
                const res = await fetch("/api/attacks?limit=8&sort=date_desc");
                if (!res.ok) return;
                const data = await res.json();
                if (data.attacks?.length) {
                    setItems(
                        data.attacks.map((a: { title: string; location: { state: string; }; date: string; }) => ({
                            title: a.title,
                            location: a.location?.state || "",
                            date: new Date(a.date).toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                            }),
                        }))
                    );
                }
            } catch {
                // Silent fail — ticker is non-critical
            }
        }
        fetchRecent();
    }, []);

    if (items.length === 0) return null;

    // Repeat items for seamless loop
    const repeated = [...items, ...items];

    return (
        <div className="fixed top-[5.5rem] left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-6xl overflow-hidden rounded-xl"
            style={{
                background: "linear-gradient(90deg, var(--color-blood), var(--color-ember))",
                boxShadow: "0 4px 16px rgba(139,26,26,0.3)",
            }}
        >
            <div className="flex items-center">
                {/* Static label */}
                <div
                    className="flex-shrink-0 px-4 py-2 text-xs font-bold tracking-widest uppercase text-white
          flex items-center gap-2 border-r border-white/20"
                >
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    BREAKING
                </div>

                {/* Scrolling ticker */}
                <div className="flex-1 overflow-hidden py-2">
                    <div className="ticker-scroll flex gap-12 whitespace-nowrap">
                        {repeated.map((item, i) => (
                            <span key={i} className="text-sm font-medium text-white/90 flex items-center gap-2">
                                <span className="inline-block w-1 h-1 bg-white/60 rounded-full" />
                                <span className="font-semibold">{item.location}:</span>
                                {item.title}
                                <span className="text-white/50">({item.date})</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
