"use client";

import { useId, useState } from "react";

export type MonthMeasure = "attacks" | "killed" | "kidnapped";
export type DayFigures = { date: string; count: number; killed: number; kidnapped: number };
export type MonthFigures = { month: number; count: number; killed: number; kidnapped: number; partial: boolean };

const NOUN: Record<MonthMeasure, string> = { attacks: "attacks", killed: "killed", kidnapped: "abducted" };
const formatValue = (value: number) => value.toLocaleString("en-NG");
const monthName = (month: number, year: number) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
const RECENT_DAYS = 7;

/**
 * The year as a daily record: one tick per day, grouped by month, taller for more reported.
 * The last seven days are highlighted. On narrow screens the ticks become one bar per month.
 */
export default function YearChart({ days, months, year, throughDay, mode, partialNote }: {
  days: DayFigures[]; months: MonthFigures[]; year: number; throughDay: number; mode: MonthMeasure; partialNote?: string;
}) {
  const [showDataTable, setShowDataTable] = useState(false);
  const tableId = useId();
  if (!months.length) return <p className="supporting">No monthly records are available.</p>;

  const lookup = new Map(days.map((day) => [day.date, day]));
  const pick = (item?: { count: number; killed: number; kidnapped: number }) => !item ? 0 : mode === "attacks" ? item.count : mode === "killed" ? item.killed : item.kidnapped;
  const currentMonth = months[months.length - 1].month;
  const lengths = months.map((month) => month.month === currentMonth ? throughDay : new Date(Date.UTC(year, month.month, 0)).getUTCDate());
  const columns = months.map((month, position) => {
    const ticks = Array.from({ length: lengths[position] }, (_, index) => {
      const key = `${year}-${String(month.month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
      return { key, value: pick(lookup.get(key)) };
    });
    return { month, ticks, start: lengths.slice(0, position).reduce((sum, length) => sum + length, 0) };
  });
  const totalDays = lengths.reduce((sum, length) => sum + length, 0);
  const maxDay = Math.max(1, ...columns.flatMap((column) => column.ticks.map((tick) => tick.value)));
  const maxMonth = Math.max(1, ...months.map(pick));
  const noun = NOUN[mode];
  const label = `Reported ${mode === "attacks" ? "attacks" : `people ${noun}`} by day, grouped by month`;

  return <div className={`year-chart year-chart--${mode}`}>
    <ol className="year-chart__days" aria-label={label}>
      {columns.map(({ month, ticks, start }) => {
        return <li key={month.month} className={`year-chart__month ${month.partial ? "year-chart__month--partial" : ""}`} style={{ flexGrow: ticks.length }} aria-label={`${monthName(month.month, year)}${month.partial ? " (partial month)" : ""}: ${formatValue(pick(month))} ${noun}`}>
          <div className="year-chart__ticks" aria-hidden="true">
            {ticks.map((tick, index) => <span key={tick.key} className={`year-chart__tick ${tick.value ? "" : "year-chart__tick--empty"} ${start + index >= totalDays - RECENT_DAYS ? "year-chart__tick--recent" : ""}`} style={tick.value ? { height: `${Math.max((tick.value / maxDay) * 100, 4)}%` } : undefined} />)}
          </div>
          <div className="year-chart__label" aria-hidden="true">
            <span className="year-chart__name">{monthName(month.month, year)}{month.partial ? "*" : ""}</span>
            <span className="year-chart__total">{formatValue(pick(month))}</span>
          </div>
        </li>;
      })}
    </ol>

    <ol className="year-chart__bars" aria-label={`Reported ${mode === "attacks" ? "attacks" : `people ${noun}`} by month`}>
      {months.map((month) => <li key={month.month} className={`year-chart__bar-col ${month.partial ? "year-chart__bar-col--partial" : ""}`} aria-label={`${monthName(month.month, year)}${month.partial ? " (partial month)" : ""}: ${formatValue(pick(month))} ${noun}`}>
        <span className="year-chart__plot" aria-hidden="true">
          <span className="year-chart__bar-value">{formatValue(pick(month))}</span>
          <span className="year-chart__bar" style={{ height: `${pick(month) > 0 ? Math.max((pick(month) / maxMonth) * 100, 2) : 0}%` }} />
        </span>
        <span className="year-chart__bar-name" aria-hidden="true">{monthName(month.month, year).slice(0, 1)}{month.partial ? "*" : ""}</span>
      </li>)}
    </ol>

    {months.some((month) => month.partial) ? <p className="fine year-chart__note">* {partialNote || "The current month is incomplete."}</p> : null}
    <button className="text-link year-chart__table-toggle" type="button" aria-expanded={showDataTable} aria-controls={tableId} onClick={() => setShowDataTable((current) => !current)}>{showDataTable ? "Hide data table" : "Show data table"}</button>
    <div className="year-chart__table-wrap" id={tableId} hidden={!showDataTable}>
      <table className="data-table"><caption className="sr-only">Monthly records</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Attacks</th><th scope="col">Killed</th><th scope="col">Abducted</th></tr></thead>
        <tbody>{months.map((month) => <tr key={`row-${month.month}`}><th scope="row">{monthName(month.month, year)}{month.partial ? " (partial)" : ""}</th><td>{formatValue(month.count)}</td><td>{formatValue(month.killed)}</td><td>{formatValue(month.kidnapped)}</td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}
