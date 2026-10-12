"use client";

import { useEffect, useState } from "react";

type ScanSummary = { stale: boolean; lastCompleted: { finishedAt: string | null } | null };

const scanTime = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(new Date(value));

/** Freshness of the record: when the last source scan finished, and whether it is overdue. */
export default function ScanStatus() {
  const [scan, setScan] = useState<ScanSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/scan-health", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((payload) => { if (!cancelled) setScan(payload); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const finished = scan?.lastCompleted?.finishedAt;
  if (!finished) return null;
  return <span className={`scan-status ${scan?.stale ? "scan-status--stale" : ""}`}>{scan?.stale ? "Source scan overdue; last completed" : "Last source scan"} {scanTime(finished)} WAT</span>;
}
