import Link from "next/link";
import { IncidentRecord, impactParts, incidentDateLabel, locationLabel } from "@/lib/incident-view";
import StatusBadge from "./StatusBadge";

const knownLga = (location: IncidentRecord["location"]) => location.lga && location.lga.toLowerCase() !== "unknown" ? `${location.lga}${/lga$/i.test(location.lga) ? "" : " LGA"}` : "";

/** Short, consistent place label: "Benue · Ukum LGA" (or a reading form: "Ukum LGA, Benue"). */
export function placeLabel(location: IncidentRecord["location"], reading = false) {
  const lga = knownLga(location);
  if (!lga) return locationLabel(location, true);
  return reading ? `${lga}, ${location.state}` : [location.state, lga].filter(Boolean).join(" · ");
}

const impactKind =(part: string) => part.includes("killed") ? "killed" : part.includes("abducted") ? "abducted" : part.includes("injured") ? "injured" : "displaced";

export function ImpactList({ incident }: { incident: IncidentRecord }) {
  const impact = impactParts(incident.casualties, incident.casualtyMeta);
  if (!impact.length) return <span className="impact impact--none">Not reported</span>;
  return <>{impact.map((part) => <span key={part} className={`impact impact--${impactKind(part)}`}>{part}</span>)}</>;
}

export function RecordDate({ incident }: { incident: IncidentRecord }) {
  if ((incident.datePrecision || "exact_day") === "exact_day") {
    const date = new Date(incident.date);
    if (!Number.isNaN(date.valueOf())) {
      const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "Africa/Lagos" }).format(date);
      return <time className="record-date" dateTime={incident.date}><span className="record-date__day">{part({ day: "2-digit" })}</span><span className="record-date__month">{part({ month: "short", year: "numeric" })}</span></time>;
    }
  }
  return <span className="record-date record-date--text">{incidentDateLabel(incident)}</span>;
}

export default function RecordCard({ incident, compact = false, selectable, selected, onSelect }: { incident: IncidentRecord; compact?: boolean; selectable?: boolean; selected?: boolean; onSelect?: (checked: boolean) => void }) {
  const sources = incident.sources?.length || 0;
  return <article className={`record-row ${compact ? "record-row--compact" : ""}`}>
    <div className="record-row__date"><RecordDate incident={incident} /></div>
    <div className="record-row__body">
      <span className="record-row__place">{placeLabel(incident.location)}</span>
      <h3 className="record-row__title"><Link href={`/incidents/${incident._id}`}>{incident.title}</Link></h3>
      {!compact && incident.description ? <p className="record-row__description">{incident.description}</p> : null}
      <span className="record-row__actor">Attributed to: {incident.group || "not recorded"}</span>
    </div>
    <div className="record-row__impact"><ImpactList incident={incident} /></div>
    <div className="record-row__evidence">
      {selectable ? <label className="sr-only">Select {incident.title}<input type="checkbox" checked={selected} onChange={(event) => onSelect?.(event.target.checked)} /></label> : null}
      <StatusBadge status={incident.status} />
      <span className="evidence-count">{sources} {sources === 1 ? "source" : "sources"}</span>
    </div>
  </article>;
}
