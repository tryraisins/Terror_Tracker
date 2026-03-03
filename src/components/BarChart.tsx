"use client";

import { useState } from "react";

interface BarChartProps {
    data: { label: string; value: number; killed?: number; }[];
    title: string;
    color?: string;
    maxBars?: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BarChart({ data, title, color = "#8B1A1A", maxBars = 12 }: BarChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const displayData = data.slice(0, maxBars);
    const maxValue = Math.max(...displayData.map((d) => d.value), 5); // Default to 5 if no data

    // Dimensions
    const width = 600;
    const height = 300;
    const padding = { top: 40, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = (chartWidth / displayData.length) * 0.6;
    const gap = (chartWidth / displayData.length) * 0.4;

    // Grid lines count
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
                                        x={padding.left - 10}
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

                        {/* Bars */}
                        {displayData.map((d, i) => {
                            const x = padding.left + (chartWidth / displayData.length) * i + gap / 2;
                            const barHeight = (d.value / maxValue) * chartHeight;
                            const y = height - padding.bottom - barHeight;

                            // Ensure minimum visibility for 0 values if needed, or just 0
                            const renderHeight = Math.max(barHeight, d.value === 0 ? 2 : 0);

                            return (
                                <g
                                    key={i}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <rect
                                        x={x}
                                        y={height - padding.bottom - renderHeight}
                                        width={barWidth}
                                        height={renderHeight}
                                        fill={color}
                                        rx="4"
                                        opacity={hoveredIndex === i ? 1 : 0.8}
                                        className="transition-opacity duration-200 cursor-pointer"
                                    />
                                    {/* Label X-Axis */}
                                    <text
                                        x={x + barWidth / 2}
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

                    {/* Tooltip Overlay */}
                    {hoveredIndex !== null && displayData[hoveredIndex] && (
                        <div
                            className="absolute pointer-events-none bg-black/80 text-white text-xs rounded px-2 py-1 z-50 transform -translate-x-1/2 -translate-y-full"
                            style={{
                                left: `${(padding.left + (chartWidth / displayData.length) * hoveredIndex + gap / 2 + barWidth / 2) / width * 100}%`,
                                top: `${(height - padding.bottom - (Math.max((displayData[hoveredIndex].value / maxValue) * chartHeight, 2))) / height * 100}%`,
                                marginTop: "-8px"
                            }}
                        >
                            <div className="font-semibold text-center">
                                {isNaN(Number(displayData[hoveredIndex].label))
                                    ? displayData[hoveredIndex].label
                                    : MONTH_NAMES[Number(displayData[hoveredIndex].label) - 1] || displayData[hoveredIndex].label}
                            </div>
                            <div>Attacks: {displayData[hoveredIndex].value}</div>
                            {displayData[hoveredIndex].killed !== undefined && displayData[hoveredIndex].killed! > 0 && (
                                <div className="text-red-300">Deaths: {displayData[hoveredIndex].killed}</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

