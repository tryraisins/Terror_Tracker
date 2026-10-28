import Link from "next/link";
import { IncidentRecord, impactParts, incidentDateLabel, locationLabel } from "@/lib/incident-view";
import StatusBadge from "./StatusBadge";

const known = (value?: string | null) => value && value.toLowerCase() !== "unknown" ? value.trim() : "";
const knownLga = (location: IncidentRecord["location"]) => { const lga = known(location.lga); return lga ? `${lga}${/lga$/i.test(lga) ? "" : " LGA"}` : ""; };

/** Short, consistent place label: "Benue, Ukum LGA" (or a reading form: "Ukum LGA, Benue"). */
export function placeLabel(location: IncidentRecord["location"], reading = false) {
  const lga = knownLga(location);
  if (!lga) return locationLabel(location, true);
  return reading ? `${lga}, ${location.state}` : [location.state, lga].filter(Boolean).join(", ");
}

/** Place parts, most specific first: "Gwashi, Bukkuyum" and "Zamfara". Long town descriptions are left to the record page. */
export function placeParts(location: IncidentRecord["location"]) {
  const town = known(location.town);
  const lga = known(location.lga).replace(/\s+lga$/i, "");
  const local = [town && town.length <= 28 && town.toLowerCase() !== lga.toLowerCase() ? town : "", lga].filter(Boolean).join(", ");
  return { local, state: location.state || "State not recorded" };
}

/** Row place line, most specific first: "Gwashi, Bukkuyum, Zamfara". */
export function rowPlace(location: IncidentRecord["location"]) {
  const { local, state } = placeParts(location);
  return [local, state].filter(Boolean).join(", ");
}

const impactKind = (part: string) => part.includes("killed") ? "killed" : part.includes("abducted") ? "abducted" : part.includes("injured") ? "injured" : "displaced";

export function ImpactList({ incident }: { incident: IncidentRecord }) {
  const impact = impactParts(incident.casualties, incident.casualtyMeta);
  if (!impact.length) return <span className="impact impact--none">Not reported</span>;
  return <>{impact.map((part) => <span key={part} className={`impact impact--${impactKind(part)}`}>{part}</span>)}</>;
}

/** Calendar day of the record as stored; formatted at UTC noon so the day itself never shifts. */
export function recordDay(incident: Pick<IncidentRecord, "date" | "dateRange">) {
  const date = new Date(`${(incident.dateRange?.end || incident.date || "").slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function RecordDate({ incident }: { incident: IncidentRecord }) {
  const date = (incident.datePrecision || "exact_day") === "exact_day" ? recordDay(incident) : null;
  if (!date) return <span className="record-date record-date--text">{incidentDateLabel(incident)}</span>;
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(date);
  return <time className="record-date" dateTime={incident.date}><span className="record-date__day">{part({ day: "numeric" })}</span>{" "}<span className="record-date__month">{part({ month: "short" })}</span></time>;
}

/** One record in a list: date, headline, place, and the reported human impact. */
export default function RecordCard({ incident, detail = false, compact = false }: { incident: IncidentRecord; detail?: boolean; compact?: boolean }) {
  return <article className={`record-row ${compact ? "record-row--compact" : ""} ${detail ? "record-row--detail" : ""}`}>
    <div className="record-row__date"><RecordDate incident={incident} /></div>
    <div className="record-row__body">
      <h3 className="record-row__title"><Link href={`/incidents/${incident._id}`}>{rowPlace(incident.location)}</Link></h3>
      <p className="record-row__headline">{incident.title}</p>
      {detail ? <p className="record-row__place"><span>{incident.group || "Attribution not recorded"}</span><StatusBadge status={incident.status} /></p> : null}
    </div>
    <div className="record-row__impact"><ImpactList incident={incident} /></div>
  </article>;
}
