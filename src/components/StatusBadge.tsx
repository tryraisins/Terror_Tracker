import { type IncidentStatus, statusLabel } from "@/lib/incident-view";

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`status status--${status}`}>{statusLabel(status)}</span>;
}
