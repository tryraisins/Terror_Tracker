"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface BarChartProps {
  data: { label: string; value: number; killed?: number; kidnapped?: number; partial?: boolean }[];
  title?: string;
  maxBars?: number;
  mode?: "incidents" | "impact";
  partialNote?: string;
}

const INCIDENT_SERIES = [{ key: "attacks" as const, label: "Incidents", color: "var(--chart-incidents)" }];
const IMPACT_SERIES = [
  { key: "deaths" as const, label: "Deaths", color: "var(--signal)" },
  { key: "kidnapped" as const, label: "Abducted", color: "var(--ochre)" },
];

function formatValue(value: number) {
  return value.toLocaleString("en-NG");
}

export default function BarChart({ data, title, maxBars = 12, mode = "incidents", partialNote }: BarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const [measured, setMeasured] = useState(960);
  const plotRef = useRef<HTMLDivElement>(null);
  const tableId = useId();

  // Draw at the container's real pixel width so labels keep their size on phones.
  useEffect(() => {
    const node = plotRef.current;
    if (!node) return;
    const update = () => setMeasured(Math.max(Math.round(node.clientWidth), 280));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const displayData = data.slice(0, maxBars);
  const series = mode === "impact" ? IMPACT_SERIES : INCIDENT_SERIES;
  const valuesFor = (item: (typeof displayData)[number]) => mode === "impact" ? [item.killed ?? 0, item.kidnapped ?? 0] : [item.value];
  const maxValue = Math.max(...displayData.flatMap(valuesFor), 1);
  const peakIndex = mode === "incidents" ? displayData.reduce((best, item, index) => item.partial ? best : (best < 0 || item.value > displayData[best].value ? index : best), -1) : -1;

  const compact = measured < 560;
  const width = measured;
  const height = compact ? 250 : 320;
  const padding = { top: 26, right: 2, bottom: compact ? 44 : 50, left: 2 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / Math.max(displayData.length, 1);
  const groupInnerWidth = groupWidth * (compact ? 0.78 : 0.74);
  const groupMargin = (groupWidth - groupInnerWidth) / 2;
  const barGap = series.length > 1 ? Math.max(groupInnerWidth * 0.08, 2) : 0;
  const barWidth = Math.max((groupInnerWidth - barGap * (series.length - 1)) / series.length, 3);
  const showValues = !(compact && series.length > 1);

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
  const activeLeft = activeIndex === null ? "50%" : `${Math.min(Math.max(((activeGroupX + groupInnerWidth / 2) / width) * 100, 14), 86)}%`;
  const activeTop = active ? `${Math.max(((height - padding.bottom - (Math.max(...valuesFor(active)) / maxValue) * chartHeight) / height) * 100 - 6, 4)}%` : "0";
  const label = mode === "incidents" ? "Monthly reported incident counts" : "Monthly reported deaths and abductions";

  return <div className="bar-chart">
    {title ? <h3 className="bar-chart__title">{title}</h3> : null}
    <div className="bar-chart__plot" ref={plotRef}>
      <svg className="bar-chart__svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}>
        <title>{label}</title>
        <line className="bar-chart__baseline" x1={0} y1={height - padding.bottom} x2={width} y2={height - padding.bottom} />
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
            <rect className="bar-chart__hit" x={padding.left + groupWidth * index} y={padding.top - 20} width={groupWidth} height={chartHeight + 20} />
            {values.map((value, seriesIndex) => {
              const barHeight = value > 0 ? Math.max((value / maxValue) * chartHeight, 2) : 0;
              const x = groupX + seriesIndex * (barWidth + barGap);
              const y = height - padding.bottom - barHeight;
              const peak = index === peakIndex;
              return <g key={series[seriesIndex].key}>
                <rect className={`bar-chart__bar ${item.partial ? "bar-chart__bar--partial" : ""} ${peak ? "bar-chart__bar--peak" : ""}`} x={x} y={y} width={barWidth} height={barHeight} fill={item.partial ? undefined : peak ? "var(--signal)" : series[seriesIndex].color} />
                {showValues ? <text className={`bar-chart__value ${peak ? "bar-chart__value--peak" : ""}`} x={x + barWidth / 2} y={y - 7} textAnchor="middle">{formatValue(value)}</text> : null}
              </g>;
            })}
            <text className={`bar-chart__x-label ${item.partial ? "bar-chart__x-label--partial" : ""}`} x={groupX + groupInnerWidth / 2} y={height - padding.bottom + 20} textAnchor="middle">{compact ? item.label.slice(0, 1) : item.label.toUpperCase()}</text>
            {item.partial ? <text className="bar-chart__partial-label" x={groupX + groupInnerWidth / 2} y={height - padding.bottom + 34} textAnchor="middle">{compact ? "part" : "PARTIAL"}</text> : null}
          </g>;
        })}
      </svg>
      {active ? <div className="bar-chart__tooltip" style={{ left: activeLeft, top: activeTop }} role="status"><strong>{active.label}{active.partial ? " (partial month)" : ""}</strong>{series.map((entry, index) => <span key={entry.key}><i style={{ background: entry.color }} />{entry.label} <b>{formatValue(valuesFor(active)[index])}</b></span>)}</div> : null}
    </div>
    {series.length > 1 ? <div className="bar-chart__legend" aria-label="Chart key">{series.map((entry) => <span key={entry.key}><i style={{ background: entry.color }} />{entry.label}</span>)}</div> : null}
    <button className="text-link bar-chart__table-toggle" type="button" aria-expanded={showDataTable} aria-controls={tableId} onClick={() => setShowDataTable((current) => !current)}>{showDataTable ? "Hide data table" : "Show data table"}</button>
    <div className="bar-chart__table-wrap" id={tableId} hidden={!showDataTable}>
      <table className="bar-chart__table"><caption className="sr-only">{label}</caption><thead><tr><th scope="col">Month</th>{series.map((entry) => <th scope="col" key={entry.key}>{mode === "incidents" ? "Incident records" : entry.label}</th>)}</tr></thead><tbody>{displayData.map((item) => <tr key={`table-${item.label}`}><th scope="row">{item.label}{item.partial ? " (partial)" : ""}</th>{valuesFor(item).map((value, index) => <td key={`${item.label}-${series[index].key}`}>{formatValue(value)}</td>)}</tr>)}</tbody></table>
      {displayData.some((item) => item.partial) ? <p className="bar-chart__partial-note">* {partialNote || "The current calendar month is incomplete; its count covers available records only."}</p> : null}
    </div>
    <ul className="sr-only">{displayData.map((item) => <li key={`summary-${item.label}`}>{item.label}: {series.map((entry, index) => `${formatValue(valuesFor(item)[index])} ${entry.label.toLowerCase()}`).join(", ")}.</li>)}</ul>
  </div>;
}
