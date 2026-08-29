export type IncidentStatus = "confirmed" | "developing" | "unconfirmed";

export interface IncidentRecord {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: { state: string; lga: string; town: string };
  group: string;
  casualties: { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };
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
  const known = [location.town, location.lga].filter((value) => value && value.toLowerCase() !== "unknown");
  return compact ? [known[0], location.state].filter(Boolean).join(", ") : [...known, location.state].filter(Boolean).join(" · ");
}

export function displayValue(value: number | null | undefined, zeroLabel = "No reported impact") {
  if (value == null) return "Unknown";
  if (value === 0) return zeroLabel;
  return value.toLocaleString("en-NG");
}

export function impactParts(casualties: IncidentRecord["casualties"]) {
  const items = [
    [casualties.killed, "killed"], [casualties.injured, "injured"], [casualties.kidnapped, "abducted"], [casualties.displaced, "displaced"],
  ] as const;
  return items.reduce<string[]>((result, [value, label]) => {
    if (value != null && value > 0) result.push(`${value.toLocaleString("en-NG")} ${label}`);
    return result;
  }, []);
}

export function statusLabel(status: IncidentStatus) {
  return status === "confirmed" ? "Confirmed" : status === "developing" ? "Developing" : "Unconfirmed";
}
