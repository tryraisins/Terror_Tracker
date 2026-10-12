import { type IncidentStatus, statusLabel } from "@/lib/incident-view";

/** Neutral status mark: solid dot confirmed, filled ring developing, hollow ring unconfirmed. */
export default function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`status status--${status}`}><i aria-hidden="true" />{statusLabel(status)}</span>;
}
