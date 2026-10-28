"use client";

import { useEffect, useState } from "react";

type Freshness = { lastCompletedAt: string | null };

const scanTime = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(new Date(value));

/**
 * When the record was last refreshed. Deliberately says nothing about coverage
 * health: overdue or failed scans are surfaced by email and in the admin panel,
 * not to readers.
 */
export default function ScanStatus() {
  const [scan, setScan] = useState<Freshness | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/scan-health", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((payload) => { if (!cancelled) setScan(payload); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const finished = scan?.lastCompletedAt;
  if (!finished) return null;
  return <span className="scan-status">Last source scan {scanTime(finished)} WAT</span>;
}
