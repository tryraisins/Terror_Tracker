import {
  type CasualtyCountMetadata,
  type CasualtyField,
  type CasualtyMetadata,
  type CasualtyValues,
  type LocationPrecision,
  casualtyRepresentativeValue,
} from "./incident-uncertainty";

export type IncidentStatus = "confirmed" | "developing" | "unconfirmed";

export interface IncidentRecord {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: {
    state: string;
    lga: string;
    town: string;
    precision?: LocationPrecision;
    notes?: string;
  };
  group: string;
  casualties: CasualtyValues;
  casualtyMeta?: CasualtyMetadata;
  sources: { url: string; title: string; publisher: string }[];
  status: IncidentStatus;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date not recorded" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Africa/Lagos" }).format(date).toUpperCase();
}

export function formatDateLong(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Not recorded" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(date);
}

export function locationLabel(location: IncidentRecord["location"], compact = false) {
  const precision = location.precision || "exact";
  const town = knownLocationPart(location.town);
  const lga = knownLocationPart(location.lga);
  const state = location.state || "Location unknown";

  if (precision === "approximate_state" || (!town && !lga)) {
    return compact ? state : `${state} - state-level location`;
  }

  if ((precision === "approximate_lga" || precision === "surrounding_area") && lga && !town) {
    return compact ? `${lga}, ${state}` : `${lga} area - ${state}`;
  }

  const known = [town, lga].filter(Boolean);
  return compact ? [known[0], state].filter(Boolean).join(", ") : [...known, state].filter(Boolean).join(" - ");
}

export function locationPrecisionLabel(location: IncidentRecord["location"]) {
  switch (location.precision || "exact") {
    case "surrounding_area":
      return "surrounding area";
    case "approximate_lga":
      return "approximate LGA";
    case "approximate_state":
      return "state-level";
    case "unknown":
      return "location uncertain";
    default:
      return "exact location";
  }
}

export function displayValue(
  value: number | null | undefined,
  zeroLabel = "No reported impact",
  meta?: CasualtyCountMetadata,
) {
  if (value == null && meta?.precision !== "range" && meta?.precision !== "estimate") return "Unknown";
  if (meta?.precision === "range") {
    const min = meta.min ?? value ?? meta.estimate;
    const max = meta.max ?? value ?? meta.estimate;
    if (min == null && max == null) return "Unknown";
    if (min != null && max != null && min !== max) return `${min.toLocaleString("en-NG")}-${max.toLocaleString("en-NG")}`;
    return (min ?? max ?? 0).toLocaleString("en-NG");
  }
  const estimate = casualtyRepresentativeValue(value, meta);
  if (meta?.precision === "estimate" && estimate != null) return `About ${estimate.toLocaleString("en-NG")}`;
  if (estimate == null) return "Unknown";
  if (estimate === 0) return zeroLabel;
  return estimate.toLocaleString("en-NG");
}

export function casualtyDetail(value: number | null | undefined, meta?: CasualtyCountMetadata) {
  if (meta?.precision === "range") return "reported range";
  if (meta?.precision === "estimate") return "estimated figure";
  if (meta?.precision === "exact") return "exact reported figure";
  if (meta?.precision === "not_reported" || value === 0) return "not reported for this impact";
  if (value == null) return "impact reported; figure unknown";
  return "reported figure";
}

export function impactParts(casualties: IncidentRecord["casualties"], casualtyMeta?: CasualtyMetadata) {
  const items = [
    [casualties.killed, "killed"], [casualties.injured, "injured"], [casualties.kidnapped, "abducted"], [casualties.displaced, "displaced"],
  ] as const satisfies readonly (readonly [number | null, string])[];
  const fields = ["killed", "injured", "kidnapped", "displaced"] as const;
  return items.reduce<string[]>((result, [value, label], index) => {
    const field = fields[index] as CasualtyField;
    const meta = casualtyMeta?.[field];
    const representative = casualtyRepresentativeValue(value, meta);
    if (representative != null && representative > 0) {
      const qualifier = meta?.precision === "estimate" ? " est." : meta?.precision === "range" ? " range" : "";
      result.push(`${displayValue(value, undefined, meta)} ${label}${qualifier}`);
    }
    return result;
  }, []);
}

export function statusLabel(status: IncidentStatus) {
  return status === "confirmed" ? "Confirmed" : status === "developing" ? "Developing" : "Unconfirmed";
}

function knownLocationPart(value?: string) {
  return value && value.toLowerCase() !== "unknown" ? value : "";
}
