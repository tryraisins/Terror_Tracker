export const INCIDENT_DATE_PRECISION_VALUES = ["exact_day", "date_range", "month_only"] as const;

export type IncidentDatePrecision = (typeof INCIDENT_DATE_PRECISION_VALUES)[number];

export type IncidentDateRange = {
  start: Date;
  end: Date;
};

type DateLike = Date | string | null | undefined;

export type IncidentDateEvidenceInput = {
  date?: DateLike;
  eventDate?: DateLike;
  datePrecision?: IncidentDatePrecision | "unknown" | null;
  dateRange?: { start?: DateLike; end?: DateLike } | null;
};

export type NormalizedIncidentDate = {
  date: Date;
  datePrecision: IncidentDatePrecision;
  dateRange?: IncidentDateRange;
  interval: IncidentDateRange;
};

function validDate(value: DateLike): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function utcDayStart(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function utcDayEnd(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
}

function utcMonthStart(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function utcMonthEnd(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

/**
 * Converts exact-day, bounded-range and month-only evidence into one stable
 * storage anchor plus the interval it represents. The anchor is never evidence
 * of an exact day unless datePrecision is exact_day.
 */
export function normalizeIncidentDate(input: IncidentDateEvidenceInput): NormalizedIncidentDate | null {
  const precision = input.datePrecision || "exact_day";
  if (precision === "unknown") return null;

  const eventDate = validDate(input.eventDate) || validDate(input.date);
  if (precision === "exact_day") {
    if (!eventDate) return null;
    const date = utcDayStart(eventDate);
    return { date, datePrecision: precision, interval: { start: date, end: utcDayEnd(date) } };
  }

  const suppliedStart = validDate(input.dateRange?.start);
  const suppliedEnd = validDate(input.dateRange?.end);
  if (precision === "date_range") {
    if (!suppliedStart || !suppliedEnd) return null;
    const start = utcDayStart(suppliedStart);
    const end = utcDayEnd(suppliedEnd);
    if (start > end) return null;
    return { date: start, datePrecision: precision, dateRange: { start, end }, interval: { start, end } };
  }

  const monthReference = eventDate || suppliedStart || suppliedEnd;
  if (!monthReference) return null;
  if (suppliedStart && (suppliedStart.getUTCFullYear() !== monthReference.getUTCFullYear() || suppliedStart.getUTCMonth() !== monthReference.getUTCMonth())) return null;
  if (suppliedEnd && (suppliedEnd.getUTCFullYear() !== monthReference.getUTCFullYear() || suppliedEnd.getUTCMonth() !== monthReference.getUTCMonth())) return null;
  const start = utcMonthStart(monthReference);
  const end = utcMonthEnd(monthReference);
  return { date: start, datePrecision: "month_only", dateRange: { start, end }, interval: { start, end } };
}

export function incidentDateIntervalsOverlap(
  left: Pick<NormalizedIncidentDate, "interval">,
  right: Pick<NormalizedIncidentDate, "interval">,
  toleranceMs = 0,
): boolean {
  return left.interval.start.getTime() <= right.interval.end.getTime() + toleranceMs
    && right.interval.start.getTime() <= left.interval.end.getTime() + toleranceMs;
}

export function incidentDateKey(input: IncidentDateEvidenceInput): string {
  const normalized = normalizeIncidentDate(input);
  if (!normalized) return "unknown";
  const start = normalized.interval.start.toISOString().slice(0, 10);
  const end = normalized.interval.end.toISOString().slice(0, 10);
  return `${normalized.datePrecision}:${start}:${end}`;
}
