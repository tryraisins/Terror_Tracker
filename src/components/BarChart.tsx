"use client";

import { useState } from "react";

interface BarChartProps {
    data: { label: string; value: number; killed?: number; kidnapped?: number; }[];
    title: string;
    maxBars?: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SERIES = [
    { key: "attacks" as const, label: "Attacks",   color: "#8B1A1A" },
    { key: "deaths"  as const, label: "Deaths",    color: "#EF4444" },
    { key: "kidnapped" as const, label: "Kidnapped", color: "#F59E0B" },
];

export default function BarChart({ data, title, maxBars = 12 }: BarChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const displayData = data.slice(0, maxBars);
    const maxValue = Math.max(
        ...displayData.map((d) => Math.max(d.value, d.killed ?? 0, d.kidnapped ?? 0)),
        5
    );

    // SVG dimensions
    const width = 600;
    const height = 280;
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartWidth  = width  - padding.left - padding.right;
    const chartHeight = height - padding.top  - padding.bottom;

    const groupWidth     = chartWidth / (displayData.length || 1);
    const barGroupMargin = groupWidth * 0.1;
    const barGroupWidth  = groupWidth * 0.8;
    const barGap         = barGroupWidth * 0.05;
    const barWidth       = (barGroupWidth - 2 * barGap) / 3;

    const gridLines = 5;

    return (
        <div className="glass-card rounded-2xl p-6 w-full h-full flex flex-col">
            <h3
                className="text-base font-semibold mb-4"
                style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
                {title}
            </h3>

            {displayData.length === 0 ? (
                <div className="flex items-center justify-center flex-1 h-48">
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        No data available yet
                    </p>
                </div>
            ) : (
                <>
                    <div className="w-full relative" style={{ aspectRatio: "2/1" }}>
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            {/* Grid Lines & Y-Axis Labels */}
                            {Array.from({ length: gridLines + 1 }).map((_, i) => {
                                const value = (maxValue / gridLines) * i;
                                const y = height - padding.bottom - (value / maxValue) * chartHeight;
                                return (
                                    <g key={i}>
                                        <line
                                            x1={padding.left}
                                            y1={y}
                                            x2={width - padding.right}
                                            y2={y}
                                            stroke="var(--border-subtle)"
                                            strokeWidth="1"
                                            strokeDasharray="4 4"
                                        />
                                        <text
                                            x={padding.left - 8}
                                            y={y + 4}
                                            textAnchor="end"
                                            fontSize="10"
                                            fill="var(--text-muted)"
                                        >
                                            {Math.round(value)}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Grouped Bars */}
                            {displayData.map((d, i) => {
                                const groupX = padding.left + groupWidth * i + barGroupMargin;
                                const vals = [d.value, d.killed ?? 0, d.kidnapped ?? 0];

                                return (
                                    <g
                                        key={i}
                                        onMouseEnter={() => setHoveredIndex(i)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        {SERIES.map((s, j) => {
                                            const val = vals[j];
                                            const bh = (val / maxValue) * chartHeight;
                                            const renderH = Math.max(bh, val === 0 ? 0 : 2);
                                            const x = groupX + j * (barWidth + barGap);
                                            const y = height - padding.bottom - renderH;

                                            return (
                                                <rect
                                                    key={s.key}
                                                    x={x}
                                                    y={y}
                                                    width={barWidth}
                                                    height={renderH}
                                                    fill={s.color}
                                                    rx="3"
                                                    opacity={hoveredIndex === i ? 1 : 0.82}
                                                    className="transition-opacity duration-200 cursor-pointer"
                                                />
                                            );
                                        })}

                                        {/* X-Axis label centred under group */}
                                        <text
                                            x={groupX + barGroupWidth / 2}
                                            y={height - padding.bottom + 16}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill="var(--text-muted)"
                                        >
                                            {isNaN(Number(d.label))
                                                ? d.label
                                                : MONTH_NAMES[Number(d.label) - 1] || d.label}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Tooltip */}
                        {hoveredIndex !== null && displayData[hoveredIndex] && (() => {
                            const d = displayData[hoveredIndex];
                            const tallest = Math.max(d.value, d.killed ?? 0, d.kidnapped ?? 0);
                            const groupX = padding.left + groupWidth * hoveredIndex + barGroupMargin;
                            const leftPct = (groupX + barGroupWidth / 2) / width * 100;
                            const topPct  = (height - padding.bottom - Math.max((tallest / maxValue) * chartHeight, 2)) / height * 100;
                            return (
                                <div
                                    className="absolute pointer-events-none bg-black/85 text-white text-xs rounded px-2.5 py-1.5 z-50 transform -translate-x-1/2 -translate-y-full"
                                    style={{ left: `${leftPct}%`, top: `${topPct}%`, marginTop: "-8px" }}
                                >
                                    <div className="font-semibold text-center mb-0.5">
                                        {isNaN(Number(d.label))
                                            ? d.label
                                            : MONTH_NAMES[Number(d.label) - 1] || d.label}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: SERIES[0].color }} />
                                        Attacks: {d.value}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: SERIES[1].color }} />
                                        Deaths: {d.killed ?? 0}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: SERIES[2].color }} />
                                        Kidnapped: {d.kidnapped ?? 0}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Legend — bottom left */}
                    <div className="flex items-center gap-5 mt-3">
                        {SERIES.map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div
                                    className="w-3 h-3 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: color, opacity: 0.9 }}
                                />
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
