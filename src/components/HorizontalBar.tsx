"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface HorizontalBarProps {
    data: { label: string; value: number; killed?: number; }[];
    title: string;
    color?: string;
}

export default function HorizontalBar({ data, title, color = "var(--color-ember)" }: HorizontalBarProps) {
    const barsRef = useRef<HTMLDivElement[]>([]);

    const maxValue = Math.max(...data.map((d) => d.value), 1);

    useEffect(() => {
        barsRef.current.forEach((bar, i) => {
            if (!bar) return;
            const percent = (data[i]?.value / maxValue) * 100;
            gsap.fromTo(
                bar,
                { width: "0%" },
                { width: `${percent}%`, duration: 0.8, delay: i * 0.08, ease: "power3.out" }
            );
        });
    }, [data]);

    return (
        <div className="glass-card rounded-2xl p-6">
            <h3
                className="text-base font-semibold mb-6"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
                {title}
            </h3>

            <div className="space-y-3">
                {data.slice(0, 10).map((item, i) => (
                    <div key={i} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                {item.label}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                    {item.value}
                                </span>
                                {item.killed !== undefined && item.killed > 0 && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                        style={{ background: "rgba(255,65,54,0.1)", color: "var(--color-urgent)" }}
                                    >
                                        {item.killed} killed
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                            <div
                                ref={(el) => { if (el) barsRef.current[i] = el; }}
                                className="h-full rounded-full transition-all"
                                style={{
                                    background: `linear-gradient(90deg, ${color}, ${color}99)`,
                                    width: "0%",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
