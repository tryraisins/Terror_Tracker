"use client";

import { useState, type KeyboardEvent } from "react";

interface BarChartProps {
  data: { label: string; value: number; killed?: number; kidnapped?: number }[];
  title?: string;
  maxBars?: number;
}

const SERIES = [
  { key: "attacks" as const, label: "Attacks", color: "var(--chart-attacks)" },
  { key: "deaths" as const, label: "Deaths", color: "var(--chart-deaths)" },
  { key: "kidnapped" as const, label: "Kidnapped", color: "var(--chart-kidnapped)" },
];

function formatValue(value: number) {
  return value.toLocaleString("en-NG");
}

export default function BarChart({ data, title, maxBars = 12 }: BarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map((item) => Math.max(item.value, item.killed ?? 0, item.kidnapped ?? 0)), 1);

  const width = 960;
  const height = 360;
  const padding = { top: 30, right: 24, bottom: 62, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / Math.max(displayData.length, 1);
  const groupInnerWidth = groupWidth * 0.72;
  const groupMargin = (groupWidth - groupInnerWidth) / 2;
  const barGap = Math.max(groupInnerWidth * 0.07, 2);
  const barWidth = Math.max((groupInnerWidth - barGap * (SERIES.length - 1)) / SERIES.length, 4);
  const gridLines = 4;

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex((current) => current === index ? null : index);
    }
  };

  if (!displayData.length) return <div className="bar-chart bar-chart--empty"><p className="supporting">No data available yet.</p></div>;

  const active = activeIndex === null ? null : displayData[activeIndex];
  const activeGroupX = activeIndex === null ? 0 : padding.left + groupWidth * activeIndex + groupMargin;
  const activeLeft = activeIndex === null ? "50%" : `${Math.min(Math.max(((activeGroupX + groupInnerWidth / 2) / width) * 100, 12), 88)}%`;
  const activeTop = active ? `${Math.max(((height - padding.bottom - (Math.max(active.value, active.killed ?? 0, active.kidnapped ?? 0) / maxValue) * chartHeight) / height) * 100 - 3, 12)}%` : "0";

  return <div className="bar-chart">
    {title ? <h3 className="bar-chart__title">{title}</h3> : null}
    <div className="bar-chart__plot">
      <svg className="bar-chart__svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grouped monthly chart showing attacks, deaths, and kidnapped victims">
        <title>Monthly attacks, deaths, and kidnapped victims</title>
        {Array.from({ length: gridLines + 1 }).map((_, index) => {
          const value = Math.round((maxValue / gridLines) * (gridLines - index));
          const y = padding.top + (chartHeight / gridLines) * index;
          return <g key={value}><line className="bar-chart__grid-line" x1={padding.left} y1={y} x2={width - padding.right} y2={y} /><text className="bar-chart__y-label" x={padding.left - 10} y={y + 4} textAnchor="end">{formatValue(value)}</text></g>;
        })}
        {displayData.map((item, index) => {
          const groupX = padding.left + groupWidth * index + groupMargin;
          const values = [item.value, item.killed ?? 0, item.kidnapped ?? 0];
          const isActive = activeIndex === index;
          return <g
            className={`bar-chart__group ${isActive ? "bar-chart__group--active" : ""}`}
            key={`${item.label}-${index}`}
            tabIndex={0}
            role="button"
            aria-label={`${item.label}: ${formatValue(item.value)} attacks, ${formatValue(item.killed ?? 0)} deaths, ${formatValue(item.kidnapped ?? 0)} kidnapped`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <line className="bar-chart__focus-line" x1={groupX + groupInnerWidth / 2} y1={padding.top} x2={groupX + groupInnerWidth / 2} y2={height - padding.bottom} />
            {values.map((value, seriesIndex) => {
              const barHeight = value > 0 ? Math.max((value / maxValue) * chartHeight, 3) : 0;
              const x = groupX + seriesIndex * (barWidth + barGap);
              const y = height - padding.bottom - barHeight;
              return <rect className="bar-chart__bar" key={SERIES[seriesIndex].key} x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={SERIES[seriesIndex].color} />;
            })}
            <text className="bar-chart__x-label" x={groupX + groupInnerWidth / 2} y={height - padding.bottom + 28} textAnchor="middle">{item.label}</text>
          </g>;
        })}
      </svg>
      {active ? <div className="bar-chart__tooltip" style={{ left: activeLeft, top: activeTop }} role="status"><strong>{active.label}</strong><span><i style={{ background: SERIES[0].color }} />Attacks <b>{formatValue(active.value)}</b></span><span><i style={{ background: SERIES[1].color }} />Deaths <b>{formatValue(active.killed ?? 0)}</b></span><span><i style={{ background: SERIES[2].color }} />Kidnapped <b>{formatValue(active.kidnapped ?? 0)}</b></span></div> : null}
    </div>
    <div className="bar-chart__legend" aria-label="Chart key">{SERIES.map((series) => <span key={series.key}><i style={{ background: series.color }} />{series.label}</span>)}</div>
    <ul className="sr-only">{displayData.map((item) => <li key={`summary-${item.label}`}>{item.label}: {formatValue(item.value)} attacks, {formatValue(item.killed ?? 0)} deaths, {formatValue(item.kidnapped ?? 0)} kidnapped.</li>)}</ul>
  </div>;
}
