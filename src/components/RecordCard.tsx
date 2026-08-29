import Link from "next/link";
import { IncidentRecord, formatDate, impactParts, locationLabel, statusLabel } from "@/lib/incident-view";

export default function RecordCard({ incident, selectable, selected, onSelect }: { incident: IncidentRecord; selectable?: boolean; selected?: boolean; onSelect?: (checked: boolean) => void }) {
  const impact = impactParts(incident.casualties);
  const statusClass = incident.status === "confirmed" ? "status--confirmed" : incident.status === "developing" ? "status--developing" : "";
  return <article className={`record-card record-card--${incident.status}`}>
    <div><div className="record-card__date">{formatDate(incident.date)}</div><div className="record-card__place">{locationLabel(incident.location, true)}</div></div>
    <div>
      <h3 className="record-card__title">{incident.title}</h3>
      <p className="record-card__description">{incident.description}</p>
      <div className="record-card__actor">{incident.group || "Actor not recorded"}</div>
      {impact.length > 0 ? <div className="record-card__impact">{impact.join(" · ")}</div> : <div className="record-card__impact">Human impact not reported</div>}
    </div>
    <div className="record-card__evidence">
      {selectable ? <label className="sr-only">Select {incident.title}<input type="checkbox" checked={selected} onChange={(event) => onSelect?.(event.target.checked)} /></label> : null}
      <span className={`status ${statusClass}`}>{statusLabel(incident.status)}</span>
      <span className="evidence-count">{incident.sources?.length || 0} {incident.sources?.length === 1 ? "source" : "sources"}</span>
      <Link href={`/incidents/${incident._id}`} className="text-link">Open record →</Link>
    </div>
  </article>;
}
