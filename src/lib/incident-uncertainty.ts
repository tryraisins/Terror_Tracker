export const LOCATION_PRECISION_VALUES = [
  "exact",
  "surrounding_area",
  "approximate_lga",
  "approximate_state",
  "unknown",
] as const;

export type LocationPrecision = (typeof LOCATION_PRECISION_VALUES)[number];

export const CASUALTY_FIELDS = ["killed", "injured", "kidnapped", "displaced"] as const;
export type CasualtyField = (typeof CASUALTY_FIELDS)[number];

export const CASUALTY_PRECISION_VALUES = [
  "exact",
  "estimate",
  "range",
  "unknown",
  "not_reported",
] as const;

export type CasualtyPrecision = (typeof CASUALTY_PRECISION_VALUES)[number];

export type CasualtyValues = Record<CasualtyField, number | null>;

export interface CasualtyCountMetadata {
  precision: CasualtyPrecision;
  min?: number | null;
  max?: number | null;
  estimate?: number | null;
  sourceText?: string;
  note?: string;
}

export type CasualtyMetadata = Partial<Record<CasualtyField, CasualtyCountMetadata>>;

function isCasualtyPrecision(value: unknown): value is CasualtyPrecision {
  return typeof value === "string" && CASUALTY_PRECISION_VALUES.includes(value as CasualtyPrecision);
}

export function normalizeCasualtyValue(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.trunc(value));
}

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  return cleaned || undefined;
}

export function normalizeCasualtyAssessment(
  value: unknown,
  rawMeta?: Partial<CasualtyCountMetadata> | null,
): CasualtyCountMetadata | undefined {
  const normalizedValue = normalizeCasualtyValue(value);
  const precision = isCasualtyPrecision(rawMeta?.precision)
    ? rawMeta.precision
    : normalizedValue == null
      ? undefined
      : normalizedValue === 0
        ? "not_reported"
        : "exact";

  if (!precision) return undefined;

  let min = normalizeCasualtyValue(rawMeta?.min);
  let max = normalizeCasualtyValue(rawMeta?.max);
  let estimate = normalizeCasualtyValue(rawMeta?.estimate);

  if (precision === "exact") {
    const exact = normalizedValue ?? estimate ?? min ?? max;
    if (exact == null) return { precision: "unknown", note: rawMeta?.note };
    min = exact;
    max = exact;
    estimate = exact;
  }

  if (precision === "not_reported") {
    min = 0;
    max = 0;
    estimate = 0;
  }

  if (precision === "estimate" && estimate == null) {
    estimate = normalizedValue ?? min ?? max ?? null;
  }

  if (precision === "range") {
    min = min ?? normalizedValue ?? estimate ?? null;
    max = max ?? normalizedValue ?? estimate ?? null;
    if (min != null && max != null && min > max) [min, max] = [max, min];
    estimate = estimate ?? (min != null && max != null ? Math.round((min + max) / 2) : min ?? max ?? null);
  }

  return {
    precision,
    min,
    max,
    estimate,
    sourceText: cleanText(rawMeta?.sourceText, 300),
    note: cleanText(rawMeta?.note, 500),
  };
}

export function casualtyRepresentativeValue(
  value: unknown,
  meta?: CasualtyCountMetadata,
): number | null {
  const normalizedValue = normalizeCasualtyValue(value);
  if (!meta) return normalizedValue;
  if (meta.precision === "unknown") return null;
  if (meta.precision === "not_reported") return 0;
  if (meta.precision === "range") {
    return normalizeCasualtyValue(meta.estimate)
      ?? (
        meta.min != null && meta.max != null
          ? Math.round((meta.min + meta.max) / 2)
          : normalizeCasualtyValue(meta.min) ?? normalizeCasualtyValue(meta.max)
      );
  }
  if (meta.precision === "estimate") return normalizeCasualtyValue(meta.estimate) ?? normalizedValue;
  return normalizedValue ?? normalizeCasualtyValue(meta.estimate) ?? normalizeCasualtyValue(meta.min);
}

export function normalizeCasualtyFields(
  casualties?: Partial<CasualtyValues> | null,
  casualtyMeta?: CasualtyMetadata | null,
): { casualties: CasualtyValues; casualtyMeta: CasualtyMetadata } {
  const normalizedCasualties = {} as CasualtyValues;
  const normalizedMeta: CasualtyMetadata = {};

  for (const field of CASUALTY_FIELDS) {
    const assessment = normalizeCasualtyAssessment(casualties?.[field], casualtyMeta?.[field]);
    normalizedCasualties[field] = casualtyRepresentativeValue(casualties?.[field], assessment);
    if (assessment) normalizedMeta[field] = assessment;
  }

  return { casualties: normalizedCasualties, casualtyMeta: normalizedMeta };
}

function boundsFor(value: number | null, meta?: CasualtyCountMetadata) {
  if (meta?.precision === "unknown") return null;
  const representative = casualtyRepresentativeValue(value, meta);
  if (representative == null) return null;
  return {
    min: normalizeCasualtyValue(meta?.min) ?? representative,
    max: normalizeCasualtyValue(meta?.max) ?? representative,
    estimate: normalizeCasualtyValue(meta?.estimate) ?? representative,
    precision: meta?.precision ?? (representative === 0 ? "not_reported" : "exact"),
  };
}

export function mergeCasualtyAssessments(
  existingCasualties?: Partial<CasualtyValues> | null,
  existingMeta?: CasualtyMetadata | null,
  incomingCasualties?: Partial<CasualtyValues> | null,
  incomingMeta?: CasualtyMetadata | null,
): { casualties: CasualtyValues; casualtyMeta: CasualtyMetadata; hasConflict: boolean } {
  const existing = normalizeCasualtyFields(existingCasualties, existingMeta);
  const incoming = normalizeCasualtyFields(incomingCasualties, incomingMeta);
  const casualties = {} as CasualtyValues;
  const casualtyMeta: CasualtyMetadata = {};
  let hasConflict = false;

  for (const field of CASUALTY_FIELDS) {
    const existingBounds = boundsFor(existing.casualties[field], existing.casualtyMeta[field]);
    const incomingBounds = boundsFor(incoming.casualties[field], incoming.casualtyMeta[field]);

    if (!existingBounds && !incomingBounds) {
      casualties[field] = null;
      const unknownMeta = existing.casualtyMeta[field] ?? incoming.casualtyMeta[field];
      if (unknownMeta) casualtyMeta[field] = { ...unknownMeta, precision: "unknown" };
      continue;
    }

    if (!existingBounds || !incomingBounds) {
      const selected = existingBounds ? existing : incoming;
      casualties[field] = selected.casualties[field];
      if (selected.casualtyMeta[field]) casualtyMeta[field] = selected.casualtyMeta[field];
      continue;
    }

    const min = Math.min(existingBounds.min, incomingBounds.min);
    const max = Math.max(existingBounds.max, incomingBounds.max);
    const sameNumber = min === max;
    const uncertain =
      existingBounds.precision === "range" ||
      incomingBounds.precision === "range" ||
      existingBounds.precision === "estimate" ||
      incomingBounds.precision === "estimate";

    if (sameNumber && !uncertain) {
      casualties[field] = min;
      casualtyMeta[field] = { precision: min === 0 ? "not_reported" : "exact", min, max, estimate: min };
      continue;
    }

    hasConflict = hasConflict || !sameNumber;
    const estimate = sameNumber
      ? existingBounds.estimate
      : Math.round((existingBounds.estimate + incomingBounds.estimate) / 2);
    casualties[field] = estimate;
    casualtyMeta[field] = {
      precision: sameNumber ? "estimate" : "range",
      min,
      max,
      estimate,
      note: sameNumber
        ? "At least one cited source reports this as an approximate figure."
        : "Conflicting credible victim counts are preserved as a range.",
    };
  }

  return { casualties, casualtyMeta, hasConflict };
}
