"use client";

import { useId, useState } from "react";

export type MonthMeasure = "attacks" | "killed" | "kidnapped";

interface BarChartProps {
  data: { label: string; value: number; killed?: number; kidnapped?: number; partial?: boolean }[];
  mode?: MonthMeasure;
  partialNote?: string;
}

const MEASURE: Record<MonthMeasure, { noun: string; tone: string }> = {
  attacks: { noun: "attacks", tone: "attacks" },
  killed: { noun: "killed", tone: "killed" },
  kidnapped: { noun: "abducted", tone: "abducted" },
};

const formatValue = (value: number) => value.toLocaleString("en-NG");

/** Monthly columns with the value printed above each bar. The partial month is outlined, never filled. */
export default function BarChart({ data, mode = "attacks", partialNote }: BarChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const tableId = useId();
  if (!data.length) return <p className="supporting">No monthly records are available.</p>;

  const valueOf = (item: BarChartProps["data"][number]) => mode === "attacks" ? item.value : (mode === "killed" ? item.killed : item.kidnapped) ?? 0;
  const max = Math.max(...data.map(valueOf), 1);
  const peak = data.reduce((best, item, index) => item.partial ? best : (best < 0 || valueOf(item) > valueOf(data[best]) ? index : best), -1);
  const { noun, tone } = MEASURE[mode];
  const label = `Reported ${noun === "attacks" ? "attacks" : `people ${noun}`} by month`;

  return <div className={`month-chart month-chart--${tone}`}>
    <ol className="month-chart__cols" aria-label={label}>
      {data.map((item, index) => {
        const value = valueOf(item);
        return <li key={`${item.label}-${index}`} className={`month-chart__col ${item.partial ? "month-chart__col--partial" : ""} ${index === peak ? "month-chart__col--peak" : ""}`} aria-label={`${item.label}${item.partial ? " (partial month)" : ""}: ${formatValue(value)} ${noun}`}>
          <div className="month-chart__plot" aria-hidden="true">
            <span className="month-chart__value">{formatValue(value)}</span>
            <span className="month-chart__bar" style={{ height: `${value > 0 ? Math.max((value / max) * 100, 1.5) : 0}%` }} />
          </div>
          <div className="month-chart__label" aria-hidden="true">
            <span className="month-chart__month"><span className="month-chart__month-long">{item.label}</span><span className="month-chart__month-short">{item.label.slice(0, 1)}</span>{item.partial ? "*" : ""}</span>
            {mode === "attacks" && item.killed !== undefined ? <span className="month-chart__sub">{formatValue(item.killed)} killed</span> : null}
          </div>
        </li>;
      })}
    </ol>
    {data.some((item) => item.partial) ? <p className="fine month-chart__note">* {partialNote || "The current month is incomplete."}</p> : null}
    <button className="text-link month-chart__table-toggle" type="button" aria-expanded={showDataTable} aria-controls={tableId} onClick={() => setShowDataTable((current) => !current)}>{showDataTable ? "Hide data table" : "Show data table"}</button>
    <div className="month-chart__table-wrap" id={tableId} hidden={!showDataTable}>
      <table className="data-table"><caption className="sr-only">Monthly records</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Attacks</th><th scope="col">Killed</th><th scope="col">Abducted</th></tr></thead>
        <tbody>{data.map((item) => <tr key={`row-${item.label}`}><th scope="row">{item.label}{item.partial ? " (partial)" : ""}</th><td>{formatValue(item.value)}</td><td>{formatValue(item.killed ?? 0)}</td><td>{formatValue(item.kidnapped ?? 0)}</td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}
