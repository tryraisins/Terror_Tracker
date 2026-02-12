"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface BarChartProps {
    data: { label: string; value: number; killed?: number; }[];
    title: string;
    color?: string;
    maxBars?: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BarChart({ data, title, color = "#8B1A1A", maxBars = 12 }: BarChartProps) {
    const barsRef = useRef<HTMLDivElement[]>([]);
    const hasAnimated = useRef(false);

    const displayData = data.slice(0, maxBars);
    const maxValue = Math.max(...displayData.map((d) => d.value), 1);

    useEffect(() => {
        if (hasAnimated.current) return;
        if (displayData.length === 0) return;

        // Small delay to ensure DOM refs are set
        const timer = setTimeout(() => {
            barsRef.current.forEach((bar, i) => {
                if (!bar) return;
                const value = displayData[i]?.value ?? 0;
                // Minimum 3% height so zero-value bars still show a baseline tick
                const percent = value === 0 ? 3 : (value / maxValue) * 100;
                gsap.fromTo(
                    bar,
                    { scaleY: 0 },
                    {
                        scaleY: 1,
                        duration: 0.8,
                        delay: i * 0.06,
                        ease: "power3.out",
                    }
                );
                // Set the actual height immediately (GSAP animates via scaleY)
                bar.style.height = `${percent}%`;
            });
            hasAnimated.current = true;
        }, 100);

        return () => clearTimeout(timer);
    }, [data, displayData, maxValue]);

    return (
        <div className="glass-card rounded-2xl p-6">
            <h3
                className="text-base font-semibold mb-6"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
                {title}
            </h3>

            {displayData.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        No data available yet
                    </p>
                </div>
            ) : (
                <div>
                    {/* Bars area */}
                    <div className="flex items-end gap-1" style={{ height: "160px" }}>
                        {displayData.map((item, i) => (
                            <div
                                key={i}
                                className="flex-1 flex flex-col items-center justify-end h-full relative group"
                            >
                                {/* Tooltip — absolutely positioned so it doesn't affect layout */}
                                <div
                                    className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 
                                        text-xs font-semibold transition-opacity z-10
                                        px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none"
                                    style={{
                                        background: "var(--bg-card)",
                                        color: "var(--text-primary)",
                                        boxShadow: "var(--shadow-soft)",
                                    }}
                                >
                                    {item.value}
                                    {item.killed !== undefined && item.killed > 0 && (
                                        <span style={{ color: "var(--color-urgent)", marginLeft: "4px" }}>
                                            ({item.killed} killed)
                                        </span>
                                    )}
                                </div>

                                {/* Bar */}
                                <div
                                    ref={(el) => { if (el) barsRef.current[i] = el; }}
                                    className="w-full rounded-t-md"
                                    style={{
                                        maxWidth: "36px",
                                        background: `linear-gradient(to top, ${color}, ${color}99)`,
                                        height: "0%",
                                        transformOrigin: "bottom",
                                        opacity: item.value === 0 ? 0.3 : 1,
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Labels row — separate from bars so layout doesn't interfere */}
                    <div className="flex gap-1 mt-2">
                        {displayData.map((item, i) => (
                            <p
                                key={i}
                                className="flex-1 text-[10px] font-medium text-center truncate"
                                style={{ color: "var(--text-muted)" }}
                            >
                                {isNaN(Number(item.label))
                                    ? item.label
                                    : MONTH_NAMES[Number(item.label) - 1] || item.label}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

