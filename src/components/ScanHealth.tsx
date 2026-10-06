"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScanHealthData, PublicScanRun } from "@/lib/scan-health";

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function errorCount(run: PublicScanRun | null): number {
  if (!run) return 0;
  return run.counts.searchFailures
    + run.counts.fetchFailures
    + run.counts.feedFailures
    + run.counts.ingestErrors
    + run.counts.deepseekErrors;
}

export default function ScanHealth() {
  const [health, setHealth] = useState<ScanHealthData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const response = await fetch("/api/scan-health", { cache: "no-store" });
      if (!response.ok) throw new Error("Scan health request failed");
      setHealth(await response.json());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!health) {
    return <section className={`panel ${failed ? "panel--caution" : ""}`} aria-live="polite">
      <span className="eyebrow">Collection health</span>
      <p className="supporting">{failed ? "Scan health is unavailable. Published records remain accessible." : "Loading collection coverage…"}</p>
      {failed ? <button className="text-link" type="button" onClick={load}>Retry</button> : null}
    </section>;
  }

  const completed = health.lastCompleted;
  const latest = health.latestAttempt;
  const errors = errorCount(latest);
  const latestDiffers = latest && completed && latest.runId !== completed.runId;
  const statusClass = health.warning ? "panel--caution" : completed?.coverageStatus === "COMPLETE" ? "panel--notice" : "";

  return <section className={`panel ${statusClass}`} aria-labelledby="scan-health-title">
    <div className="panel-heading">
      <div>
        <span className="eyebrow">Collection health</span>
        <h2 id="scan-health-title">Latest scan coverage</h2>
        <p className="panel-subtitle">Last automated collection and gaps in coverage.</p>
      </div>
      <span className={`status ${!health.warning && completed?.coverageStatus === "COMPLETE" ? "status--confirmed" : ""}`}>
        {health.warning ? health.warning.replace("bootstrap", "starting") : completed?.coverageStatus.replace("_", " ") || "No run"}
      </span>
    </div>

    {health.warningMessage ? <p className="supporting" role="status" style={{ marginBottom: "1rem", fontWeight: 700 }}>{health.warningMessage}</p> : null}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(9rem,1fr))", gap: ".75rem" }}>
      <div className="queue-item" style={{ display: "grid", alignContent: "start", justifyContent: "stretch" }}><strong>{completed ? `${completed.completedStates}/${completed.totalStates}` : "Pending"}</strong><span>jurisdictions covered</span></div>
      <div className="queue-item" style={{ display: "grid", alignContent: "start", justifyContent: "stretch" }}><strong style={{ fontSize: "1rem", lineHeight: 1.35 }}>{formatDate(completed?.finishedAt || completed?.startedAt)}</strong><span>last completed, Lagos time</span></div>
      <div className="queue-item" style={{ display: "grid", alignContent: "start", justifyContent: "stretch" }}><strong>{errors}</strong><span>latest attempt errors</span></div>
      <div className="queue-item" style={{ display: "grid", alignContent: "start", justifyContent: "stretch" }}><strong>{health.reviewQueue.pending}</strong><span>items awaiting review</span></div>
    </div>

    {latestDiffers ? <p className="supporting" style={{ marginTop: "1rem" }}>Latest attempt: <strong>{latest.coverageStatus.replace("_", " ")}</strong>, started {formatDate(latest.startedAt)}.</p> : null}
    {latest?.failedStates.length ? <p className="supporting" style={{ marginTop: ".5rem" }}>Coverage errors: {latest.failedStates.join(", ")}.</p> : null}
  </section>;
}
