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

export default function BarChart({ data, title, color = "var(--color-blood)", maxBars = 12 }: BarChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const barsRef = useRef<HTMLDivElement[]>([]);

    const displayData = data.slice(0, maxBars);
    const maxValue = Math.max(...displayData.map((d) => d.value), 1);

    useEffect(() => {
        barsRef.current.forEach((bar, i) => {
            if (!bar) return;
            const percent = (displayData[i]?.value / maxValue) * 100;
            gsap.fromTo(
                bar,
                { height: "0%" },
                { height: `${percent}%`, duration: 0.8, delay: i * 0.06, ease: "power3.out" }
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

            <div ref={containerRef} className="flex items-end gap-2 h-48">
                {displayData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                        {/* Tooltip */}
                        <div
                            className="opacity-0 group-hover:opacity-100 text-xs font-semibold mb-1 transition-opacity
              px-2 py-1 rounded-lg whitespace-nowrap"
                            style={{
                                background: "var(--bg-card)",
                                color: "var(--text-primary)",
                                boxShadow: "var(--shadow-soft)",
                            }}
                        >
                            {item.value}
                            {item.killed !== undefined && (
                                <span className="text-urgent ml-1">({item.killed} killed)</span>
                            )}
                        </div>

                        {/* Bar */}
                        <div className="w-full relative flex items-end justify-center" style={{ height: "100%" }}>
                            <div
                                ref={(el) => { if (el) barsRef.current[i] = el; }}
                                className="w-full max-w-[40px] rounded-t-lg transition-all duration-300
                  group-hover:opacity-90"
                                style={{
                                    background: `linear-gradient(to top, ${color}, ${color}88)`,
                                    height: "0%",
                                }}
                            />
                        </div>

                        {/* Label */}
                        <p
                            className="text-[10px] font-medium mt-2 text-center truncate w-full"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {isNaN(Number(item.label)) ? item.label : MONTH_NAMES[Number(item.label) - 1] || item.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
