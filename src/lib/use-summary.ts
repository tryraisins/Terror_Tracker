"use client";

import { useCallback, useEffect, useState } from "react";
import type { SummaryPayload } from "./summary";

// One request per page view, shared by the shell's status card and the page itself.
let pending: Promise<SummaryPayload> | null = null;

function fetchSummary(force = false) {
  if (!pending || force) {
    pending = fetch("/api/summary", { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("Summary request failed");
      return response.json() as Promise<SummaryPayload>;
    });
    pending.catch(() => { pending = null; });
  }
  return pending;
}

export function useSummary() {
  const [data, setData] = useState<SummaryPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let active = true;
    fetchSummary().then((payload) => { if (active) setData(payload); }).catch(() => { if (active) { setFailed(true); setOffline(!navigator.onLine); } });
    return () => { active = false; };
  }, []);
  const retry = useCallback(() => {
    setFailed(false);
    fetchSummary(true).then((payload) => { setData(payload); setOffline(false); }).catch(() => { setFailed(true); setOffline(!navigator.onLine); });
  }, []);
  return { data, failed, offline, retry };
}
