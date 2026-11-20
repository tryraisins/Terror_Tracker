/** Slim public rows from /api/summary and the aggregations the V5 pages share. */
import type { IncidentRecord } from "./incident-view";
import { normalizeStateName } from "./normalize-state";

export interface SummaryRow {
  id: string;
  /** Nigeria calendar day of the incident, YYYY-MM-DD. */
  d: string;
  /** Present only when the day is not exact. */
  dp?: "month_only" | "date_range" | "unknown";
  /** Calendar bounds for a reported range, not an exact event day. */
  ds?: string;
  de?: string;
  t: string;
  town: string;
  lga: string;
  /** Canonical state name; FCT is "FCT". */
  s: string;
  g: string;
  k: number | null;
  ab: number | null;
  i: number | null;
  st: "confirmed" | "developing" | "unconfirmed";
  /** The killed or abducted figure is an open minimum ("20+"). */
  ko?: boolean;
  abo?: boolean;
}

export interface SummaryPayload { today: string; year: number; records: SummaryRow[] }

export function summaryDatePrecision(datePrecision?: string | null, tags?: string[]): SummaryRow["dp"] {
  if (datePrecision === "unknown"
    || (tags?.includes("date-uncertainty") === true && (!datePrecision || datePrecision === "exact_day"))) return "unknown";
  return datePrecision === "month_only" || datePrecision === "date_range" ? datePrecision : undefined;
}

export type Measure = "attacks" | "killed" | "abducted";
export type Period = "year" | "d90" | "d30";

export const MEASURES: Record<Measure, { label: string; short: string; noun: string; one: string; color: string }> = {
  attacks: { label: "Attacks", short: "Attacks", noun: "attacks", one: "attack", color: "#e5484d" },
  killed: { label: "People killed", short: "Killed", noun: "people killed", one: "person killed", color: "#c4cbc7" },
  abducted: { label: "People abducted", short: "Abducted", noun: "people abducted", one: "person abducted", color: "#3e8ee6" },
};
export const MEASURE_KEYS: Measure[] = ["attacks", "killed", "abducted"];
export const PERIODS: Record<Period, { label: string; days: number | null; phrase: string }> = {
  year: { label: "2026", days: null, phrase: "since 1 January" },
  d90: { label: "90 days", days: 90, phrase: "in the last 90 days" },
  d30: { label: "30 days", days: 30, phrase: "in the last 30 days" },
};
export const PERIOD_KEYS: Period[] = ["year", "d90", "d30"];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const fmt = (value: number) => value.toLocaleString("en-NG");
const dayMs = 86_400_000;
const dayValue = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Whole days between the record's day and today (0 = today). */
export const ageDays = (row: Pick<SummaryRow, "d">, today: string) => Math.round((dayValue(today) - dayValue(row.d)) / dayMs);
export const valueOf = (row: SummaryRow, measure: Measure) => measure === "attacks" ? 1 : measure === "killed" ? row.k ?? 0 : row.ab ?? 0;
export const total = (rows: SummaryRow[], measure: Measure) => rows.reduce((sum, row) => sum + valueOf(row, measure), 0);

/** Return the possible calendar days, never the internal unknown-date anchor. */
function dateBounds(row: SummaryRow): [string, string] | null {
  if (row.dp === "unknown") return null;
  if (row.dp === "date_range") return row.ds && row.de && row.ds <= row.de ? [row.ds, row.de] : null;
  if (row.dp === "month_only") {
    const month = row.d.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return null;
    const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
    return [`${month}-01`, last];
  }
  return row.d ? [row.d, row.d] : null;
}

/** Count an uncertain incident only when every possible day fits the interval. */
export function withinDates(row: SummaryRow, start: string, end: string) {
  const bounds = dateBounds(row);
  return !!bounds && bounds[0] >= start && bounds[1] <= end;
}
const dayAtOffset = (today: string, offset: number) => new Date(dayValue(today) - offset * dayMs).toISOString().slice(0, 10);
export function inPeriod(period: Period, today: string) {
  const days = PERIODS[period].days;
  const start = days == null ? `${today.slice(0, 4)}-01-01` : dayAtOffset(today, days - 1);
  const end = days == null ? `${today.slice(0, 4)}-12-31` : today;
  return (row: SummaryRow) => withinDates(row, start, end);
}
export function inPreviousPeriod(period: Period, today: string) {
  const days = PERIODS[period].days;
  return (row: SummaryRow) => days != null && withinDates(row, dayAtOffset(today, 2 * days - 1), dayAtOffset(today, days));
}

export function byKey(rows: SummaryRow[], measure: Measure, key: (row: SummaryRow) => string | null) {
  const out = new Map<string, number>();
  rows.forEach((row) => { const name = key(row); if (name) out.set(name, (out.get(name) ?? 0) + valueOf(row, measure)); });
  return [...out].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
export const byState = (rows: SummaryRow[], measure: Measure) => byKey(rows, measure, (row) => row.s || null);
export const known = (value?: string | null) => value && value.trim() && value.trim().toLowerCase() !== "unknown" ? value.trim() : "";

export interface Bucket { label: string; long: string; test: (row: SummaryRow) => boolean }

/** Months for the year, weeks for 90 days, days for 30 days, oldest first. */
export function buckets(period: Period, today: string): Bucket[] {
  if (period === "year") {
    const month = Number(today.slice(5, 7));
    return Array.from({ length: month }, (_, index) => ({
      label: MONTHS[index],
      long: `${MONTHS_LONG[index]}${index === month - 1 ? " (so far)" : ""}`,
      test: (row: SummaryRow) => {
        const start = `${today.slice(0, 4)}-${String(index + 1).padStart(2, "0")}-01`;
        const end = new Date(Date.UTC(Number(today.slice(0, 4)), index + 1, 0)).toISOString().slice(0, 10);
        return withinDates(row, start, end);
      },
    }));
  }
  const count = period === "d90" ? 13 : 30;
  const size = period === "d90" ? 7 : 1;
  const label = (offset: number) => { const date = new Date(dayValue(today) - offset * dayMs); return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`; };
  return Array.from({ length: count }, (_, index) => {
    const newest = (count - 1 - index) * size;
    const oldest = newest + size - 1;
    return {
      label: label(oldest),
      long: size === 1 ? label(newest) : `${label(oldest)} to ${label(newest)}`,
      test: (row: SummaryRow) => withinDates(row, dayAtOffset(today, oldest), dayAtOffset(today, newest)),
    };
  });
}

/** Five bins per measure; the same thresholds drive the map, heatmap and legend. */
export const BINS: Record<Measure, number[]> = { attacks: [1, 10, 20, 40, 60], killed: [1, 20, 50, 100, 200], abducted: [1, 20, 50, 100, 200] };
const STEPS = [0.32, 0.5, 0.66, 0.83, 1];
const BASE = [0x22, 0x26, 0x25];
export const EMPTY_FILL = "#1f2322";
function mix(hex: string, t: number) {
  const target = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `#${BASE.map((value, i) => Math.round(value + (target[i] - value) * t).toString(16).padStart(2, "0")).join("")}`;
}
export function binIndex(measure: Measure, value: number) {
  let index = -1;
  BINS[measure].forEach((threshold, i) => { if (value >= threshold) index = i; });
  return index;
}
export const binFill = (measure: Measure, index: number) => mix(MEASURES[measure].color, STEPS[index]);
export const fillFor = (measure: Measure, value: number) => value > 0 ? binFill(measure, binIndex(measure, value)) : EMPTY_FILL;
/** Dark ink on the two brightest bins, light ink elsewhere. */
export const inkFor = (measure: Measure, value: number) => value > 0 && binIndex(measure, value) >= 3 ? "#111312" : "#edf0ee";
export function binLabels(measure: Measure) {
  const bins = BINS[measure];
  return bins.map((threshold, i) => i < bins.length - 1 ? `${threshold}–${bins[i + 1] - 1}` : `${threshold}+`);
}

/** Most specific known place: town, else LGA, else the state. */
export function placeName(row: Pick<SummaryRow, "town" | "lga" | "s">) {
  const town = known(row.town);
  if (town && town.length <= 40) return town;
  return known(row.lga) || stateLabel(row.s);
}
export const stateLabel = (state: string) => state === "FCT" ? "FCT" : `${state} State`;
export function placeLine(row: Pick<SummaryRow, "town" | "lga" | "s">) {
  const place = placeName(row);
  if (place === stateLabel(row.s)) return "Exact place not reported";
  const lga = known(row.lga);
  return [lga && lga.toLowerCase() !== place.toLowerCase() ? `${lga.replace(/\s+lga$/i, "")} LGA` : "", stateLabel(row.s)].filter(Boolean).join(", ");
}
export function dayLabel(row: Pick<SummaryRow, "d" | "dp" | "ds" | "de">, long = false) {
  if (row.dp === "unknown") return "Incident date not established";
  if (row.dp === "date_range") {
    if (!row.ds || !row.de) return "Date range not available";
    const label = (value: string) => {
      const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
      return `${date.getUTCDate()} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    };
    return `${label(row.ds)} to ${label(row.de)}`;
  }
  const date = new Date(`${row.d}T12:00:00Z`);
  if (row.dp === "month_only") return `${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return long ? `${date.getUTCDate()} ${MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}` : `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}
export function agoLabel(row: Pick<SummaryRow, "d">, today: string) {
  const age = ageDays(row, today);
  return age <= 0 ? "today" : age === 1 ? "yesterday" : `${age} days ago`;
}
/** Today as a Nigeria calendar day, for pages that do not load the summary. */
export const lagosToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());

/** A full public record in the slim shape, so lists and sharing use one card. */
export function toSummaryRow(record: IncidentRecord): SummaryRow {
  const open = (field: "killed" | "kidnapped") => record.casualtyMeta?.[field]?.precision === "range" && record.casualtyMeta?.[field]?.max == null;
  return {
    id: record._id,
    // The stored calendar day, as recordDay reads it; formatting in Lagos could shift range ends.
    d: (record.dateRange?.end || record.date || "").slice(0, 10),
    dp: summaryDatePrecision(record.datePrecision, record.tags),
    ds: record.dateRange?.start?.slice(0, 10),
    de: record.dateRange?.end?.slice(0, 10),
    t: record.title,
    town: record.location?.town || "",
    lga: record.location?.lga || "",
    s: normalizeStateName(record.location?.state || "") || record.location?.state || "",
    g: (record.group || "Unknown").trim(),
    k: record.casualties?.killed ?? null,
    ab: record.casualties?.kidnapped ?? null,
    i: record.casualties?.injured ?? null,
    st: record.status,
    ko: open("killed") || undefined,
    abo: open("kidnapped") || undefined,
  };
}
export const stateSlug = (state: string) => state.toLowerCase().replace(/\s+/g, "-");
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
