import { type IncidentStatus, statusLabel } from "@/lib/incident-view";

/** Reporting status as plain text, so it never competes with the killed and abducted colours. */
export default function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`status status--${status}`}>{statusLabel(status)}</span>;
}
