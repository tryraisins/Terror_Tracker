"use client";

import { useId, useState, type KeyboardEvent } from "react";

interface BarChartProps {
  data: { label: string; value: number; killed?: number; kidnapped?: number; partial?: boolean }[];
  title?: string;
  maxBars?: number;
  mode?: "incidents" | "impact";
  partialNote?: string;
}

const INCIDENT_SERIES = [{ key: "attacks" as const, label: "Incidents", color: "var(--chart-attacks)" }];
const IMPACT_SERIES = [
  { key: "deaths" as const, label: "Deaths", color: "var(--chart-deaths)" },
  { key: "kidnapped" as const, label: "Abducted", color: "var(--chart-kidnapped)" },
];

function formatValue(value: number) {
  return value.toLocaleString("en-NG");
}

export default function BarChart({ data, title, maxBars = 12, mode = "incidents", partialNote }: BarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const tableId = useId();
  const displayData = data.slice(0, maxBars);
  const series = mode === "impact" ? IMPACT_SERIES : INCIDENT_SERIES;
  const valuesFor = (item: (typeof displayData)[number]) => mode === "impact" ? [item.killed ?? 0, item.kidnapped ?? 0] : [item.value];
  const maxValue = Math.max(...displayData.flatMap(valuesFor), 1);

  const width = 960;
  const height = 360;
  const padding = { top: 30, right: 24, bottom: 62, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / Math.max(displayData.length, 1);
  const groupInnerWidth = groupWidth * 0.72;
  const groupMargin = (groupWidth - groupInnerWidth) / 2;
  const barGap = Math.max(groupInnerWidth * 0.07, 2);
  const barWidth = Math.max((groupInnerWidth - barGap * (series.length - 1)) / series.length, 4);
  const gridLines = 4;

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === "Escape") {
      setActiveIndex(null);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex((current) => current === index ? null : index);
    }
  };

  if (!displayData.length) return <div className="bar-chart bar-chart--empty"><p className="supporting">No data available yet.</p></div>;

  const active = activeIndex === null ? null : displayData[activeIndex];
  const activeGroupX = activeIndex === null ? 0 : padding.left + groupWidth * activeIndex + groupMargin;
  const activeLeft = activeIndex === null ? "50%" : `${Math.min(Math.max(((activeGroupX + groupInnerWidth / 2) / width) * 100, 12), 88)}%`;
  const activeTop = active ? `${Math.max(((height - padding.bottom - (Math.max(...valuesFor(active)) / maxValue) * chartHeight) / height) * 100 - 3, 12)}%` : "0";

  return <div className="bar-chart">
    {title ? <h3 className="bar-chart__title">{title}</h3> : null}
    <div className="bar-chart__plot">
      <svg className="bar-chart__svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={mode === "incidents" ? "Monthly reported incident counts" : "Monthly reported deaths and abductions"}>
        <title>{mode === "incidents" ? "Monthly reported incident counts" : "Monthly reported deaths and abductions"}</title>
        {Array.from({ length: gridLines + 1 }).map((_, index) => {
          const value = Math.round((maxValue / gridLines) * (gridLines - index));
          const y = padding.top + (chartHeight / gridLines) * index;
          return <g key={value}><line className="bar-chart__grid-line" x1={padding.left} y1={y} x2={width - padding.right} y2={y} /><text className="bar-chart__y-label" x={padding.left - 10} y={y + 4} textAnchor="end">{formatValue(value)}</text></g>;
        })}
        {displayData.map((item, index) => {
          const groupX = padding.left + groupWidth * index + groupMargin;
          const values = valuesFor(item);
          const isActive = activeIndex === index;
          return <g
            className={`bar-chart__group ${isActive ? "bar-chart__group--active" : ""}`}
            key={`${item.label}-${index}`}
            tabIndex={0}
            role="button"
            aria-label={`${item.label}${item.partial ? " (partial month)" : ""}: ${series.map((entry, seriesIndex) => `${formatValue(values[seriesIndex])} ${entry.label.toLowerCase()}`).join(", ")}`}
            aria-pressed={isActive}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={(event) => { event.stopPropagation(); setActiveIndex(index); }}
          >
            <line className="bar-chart__focus-line" x1={groupX + groupInnerWidth / 2} y1={padding.top} x2={groupX + groupInnerWidth / 2} y2={height - padding.bottom} />
            {values.map((value, seriesIndex) => {
              const barHeight = value > 0 ? Math.max((value / maxValue) * chartHeight, 3) : 0;
              const x = groupX + seriesIndex * (barWidth + barGap);
              const y = height - padding.bottom - barHeight;
              return <rect className={`bar-chart__bar ${item.partial ? "bar-chart__bar--partial" : ""}`} key={series[seriesIndex].key} x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={series[seriesIndex].color} />;
            })}
            <text className="bar-chart__x-label" x={groupX + groupInnerWidth / 2} y={height - padding.bottom + 28} textAnchor="middle">{item.label}{item.partial ? "*" : ""}</text>
          </g>;
        })}
      </svg>
      {active ? <div className="bar-chart__tooltip" style={{ left: activeLeft, top: activeTop }} role="status"><strong>{active.label}{active.partial ? " (partial month)" : ""}</strong>{series.map((entry, index) => <span key={entry.key}><i style={{ background: entry.color }} />{entry.label} <b>{formatValue(valuesFor(active)[index])}</b></span>)}</div> : null}
    </div>
    <div className="bar-chart__legend" aria-label="Chart key">{series.map((entry) => <span key={entry.key}><i style={{ background: entry.color }} />{entry.label}</span>)}</div>
    <button className="text-link bar-chart__table-toggle" type="button" aria-expanded={showDataTable} aria-controls={tableId} onClick={() => setShowDataTable((current) => !current)}>{showDataTable ? "Hide data table" : "Show data table"}</button>
    <div className="bar-chart__table-wrap" id={tableId} hidden={!showDataTable}>
      <table className="bar-chart__table"><caption className="sr-only">{mode === "incidents" ? "Monthly reported incident counts" : "Monthly reported deaths and abductions"}</caption><thead><tr><th scope="col">Month</th>{series.map((entry) => <th scope="col" key={entry.key}>{mode === "incidents" ? "Incident records" : entry.label}</th>)}</tr></thead><tbody>{displayData.map((item) => <tr key={`table-${item.label}`}><th scope="row">{item.label}{item.partial ? " (partial)" : ""}</th>{valuesFor(item).map((value, index) => <td key={`${item.label}-${series[index].key}`}>{formatValue(value)}</td>)}</tr>)}</tbody></table>
      {displayData.some((item) => item.partial) ? <p className="bar-chart__partial-note">* {partialNote || "The current calendar month is incomplete; its count covers available records only."}</p> : null}
    </div>
    <ul className="sr-only">{displayData.map((item) => <li key={`summary-${item.label}`}>{item.label}: {series.map((entry, index) => `${formatValue(valuesFor(item)[index])} ${entry.label.toLowerCase()}`).join(", ")}.</li>)}</ul>
  </div>;
}
