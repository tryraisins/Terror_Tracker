/**
 * search-led-scan.ts
 *
 * Manual / GitHub Actions trigger of the free (non-Gemini) search-led
 * discovery pipeline over a seven-day window (fourteen for weekly catch-up), followed by the
 * report-only duplicate check. This mirrors the whole-year backfill:
 * DuckDuckGo/Bing free search with a Brave Search API fallback, direct article
 * fetch (Jina reader fallback), regex extraction, and SHA-256 dedup ingestion.
 *
 * Run:
 *   npx tsx scripts/search-led-scan.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { VALID_STATE_NAMES } from "../src/lib/normalize-state";

function readPositiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  const lookbackHours = Number(process.env.INCIDENT_LOOKBACK_HOURS || 168);
  if (!Number.isInteger(lookbackHours) || lookbackHours < 24 || lookbackHours > 336) {
    throw new Error("INCIDENT_LOOKBACK_HOURS must be an integer between 24 and 336");
  }
  const runStartedAt = new Date().toISOString();
  const runId = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_RUN_ID}:${process.env.GITHUB_RUN_ATTEMPT || "1"}` : `local:${randomUUID()}`;
  // Load collectors after dotenv so their configuration reflects this run.
  const { collectSearchLedIncidents, ingestSearchLedAttacks } = await import("../src/lib/search-led-discovery");
  const { DuplicateCheckerService } = await import("../src/lib/duplicate-checker");
  const { persistIncidentReviews, persistDuplicateReviewPairs, retryIncidentReviews } = await import("../src/lib/incident-review");
  const { default: ScanRun } = await import("../src/lib/models/ScanRun");
  const { assertActiveAttackDateIntegrity } = await import("../src/lib/attack-data-integrity");
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      console.warn(`Database connection unavailable; retrying startup (${attempt}/3).`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  console.log("Connected to MongoDB");

  const states = [...VALID_STATE_NAMES];
  await ScanRun.create({ runId, startedAt: runStartedAt, coverageStatus: "RUNNING", totalStates: states.length,
    lookbackHours, source: process.env.SCAN_SOURCE || "manual" });
  try {
    await assertActiveAttackDateIntegrity("Search-led preflight");
    const reviewRetries = await retryIncidentReviews(readPositiveNumber("INCIDENT_REVIEW_RETRY_LIMIT", 5));
    console.log(`Scanning ${states.length} states over the trailing ${lookbackHours}-hour incident window...`);

    const { attacks, report } = await collectSearchLedIncidents(states, lookbackHours);
    console.log("Search report:", JSON.stringify(report));

    const ingest = attacks.length > 0
      ? await ingestSearchLedAttacks(attacks, `SearchLedScan/${lookbackHours}h`)
      : { inserted: 0, merged: 0, errors: 0, reviewRequired: [] };
    console.log("Ingest:", JSON.stringify(ingest));
    let reviewQueued = await persistIncidentReviews(report, ingest, attacks);
    await assertActiveAttackDateIntegrity("Search-led postflight");

    const since = new Date(Date.now() - Math.max(5 * 24, lookbackHours) * 60 * 60 * 1000);
    const dup = await DuplicateCheckerService.findDuplicatesForRecentIncidents(since);
    const dupCount = dup.reduce((n, d) => n + d.candidates.length, 0);
    const storedDuplicateReviews = await persistDuplicateReviewPairs(dup.flatMap((stateResult) => stateResult.candidates));
    reviewQueued += storedDuplicateReviews;
    console.log(`Duplicate candidates: ${dupCount} across ${dup.length} state(s)`);

    const fetchFailureBudget = Math.max(
      readPositiveNumber("SCAN_MAX_FETCH_FAILURES", 3),
      Math.ceil(report.urlsFetched * readPositiveNumber("SCAN_FETCH_FAILURE_TOLERANCE_RATIO", 0.1)),
    );

    const failedStates = report.jurisdictions.filter((item) => item.status === "FAILED").map((item) => item.state);
    const hardIncomplete = report.queriesRun !== states.length
      || failedStates.length > 0
      || ingest.errors > 0
      || reviewRetries.errors > 0
      || report.deepseekErrors > 0
      || report.fetchFailures.length > fetchFailureBudget;
    const coverageStatus = hardIncomplete
      ? "INCOMPLETE"
      : report.fetchFailures.length > 0 || report.feedFailures.length > 0 || report.jurisdictions.some((item) => item.status === "DEGRADED")
        ? "DEGRADED"
        : report.reviewLeads.length > 0 || ingest.reviewRequired.length > 0 || storedDuplicateReviews > 0
          ? "REVIEW_REQUIRED"
          : "COMPLETE";
    const result = {
      runStartedAt,
      runId,
      runFinishedAt: new Date().toISOString(),
      coverageStatus,
      reviewQueued,
      reviewRetries,
      fetchFailureBudget,
      statesScanned: states,
      report,
      candidates: attacks.map((attack) => ({
        title: attack.title,
        date: attack.date,
        datePrecision: attack.datePrecision,
        dateRange: attack.dateRange,
        dateEvidence: attack.dateEvidence,
        location: attack.location,
        casualties: attack.casualties,
        status: attack.status,
        sources: attack.sources,
      })),
      ingest,
      duplicateCheck: {
        candidatePairs: dupCount,
        statesWithCandidates: dup.length,
        deepSeekAssessments: dup.flatMap((stateResult) => stateResult.candidates).filter((candidate) => candidate.deepSeekClassification).length,
        candidates: dup.flatMap((stateResult) => stateResult.candidates.map((candidate) => ({
          state: stateResult.state,
          reportA: { id: String(candidate.reportA._id), title: candidate.reportA.title, date: candidate.reportA.date, town: candidate.reportA.location.town },
          reportB: { id: String(candidate.reportB._id), title: candidate.reportB.title, date: candidate.reportB.date, town: candidate.reportB.location.town },
          heuristicScore: candidate.heuristicScore,
          heuristicReason: candidate.reason,
          deepSeekClassification: candidate.deepSeekClassification || "not_assessed",
          deepSeekReason: candidate.deepSeekReason || "",
        }))),
      },
    };
    await ScanRun.updateOne({ runId }, { $set: {
      finishedAt: result.runFinishedAt, coverageStatus, completedStates: states.length - failedStates.length,
      failedStates, jurisdictions: report.jurisdictions.map(({ errors, ...jurisdiction }) => ({ ...jurisdiction, providerErrors: errors })),
      counts: { urlsDiscovered: report.urlsDiscovered, urlsFetched: report.urlsFetched, fetchRetries: report.fetchRetries,
        fetchFailures: report.fetchFailures.length, searchFailures: report.searchFailures.length, feedFailures: report.feedFailures.length,
        admitted: report.candidates, rejected: report.rejected, inserted: ingest.inserted + reviewRetries.inserted, merged: ingest.merged + reviewRetries.merged,
        reviewQueued, duplicateReviews: ingest.reviewRequired.length + storedDuplicateReviews, ingestErrors: ingest.errors + reviewRetries.errors,
        braveFallbackCalls: report.braveFallbackCalls, deepseekCalls: report.deepseekCalls, deepseekConfirmed: report.deepseekConfirmed,
        deepseekRejected: report.deepseekRejected, deepseekReviewRequired: report.deepseekReviewRequired, deepseekErrors: report.deepseekErrors },
    } }, { runValidators: true });

    if (process.env.SCAN_REPORT_PATH) {
      await mkdir(dirname(process.env.SCAN_REPORT_PATH), { recursive: true });
      await writeFile(process.env.SCAN_REPORT_PATH, JSON.stringify(result, null, 2), "utf8");
      console.log(`Detailed scan report saved to ${process.env.SCAN_REPORT_PATH}`);
    }

    if (process.env.GITHUB_STEP_SUMMARY) {
      const topRejections = Object.entries(report.rejectionReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, count]) => `- ${count} × ${reason}`)
        .join("\n") || "- None";
      await appendFile(process.env.GITHUB_STEP_SUMMARY, [
        "## Incident scan",
        "",
        `- Window: ${report.windowStart} to ${report.windowEnd} (${lookbackHours} hours)`,
        `- Coverage status: **${coverageStatus}**`,
        `- State coverage: ${states.length - failedStates.length}/${states.length}; failed: ${failedStates.join(", ") || "none"}`,
        `- Persistent review: ${reviewQueued} new leads; ${reviewRetries.processed} retried, ${reviewRetries.resolved} resolved`,
        `- Publisher feeds: ${report.feedUrlsDiscovered} URLs found; ${report.feedFailures.length} unavailable feeds`,
        `- Jurisdictions: ${report.queriesRun}/${states.length}`,
        `- URLs: ${report.urlsDiscovered} found, ${report.urlsFetched} fetched, ${report.fetchRetries} retry attempts, ${report.fetchFailures.length} unresolved fetch errors (budget ${fetchFailureBudget})`,
        `- Search provider errors: ${report.searchFailures.length}`,
        `- Candidates: ${report.candidates} admitted, ${report.reviewLeads.length} sent to review, ${report.rejected} rejected`,
        `- Database: ${ingest.inserted} inserted, ${ingest.merged} merged, ${ingest.reviewRequired.length} duplicate conflicts held for review, ${ingest.errors} errors`,
        `- DeepSeek: ${report.deepseekCalls} calls, ${report.deepseekConfirmed} confirmed, ${report.deepseekRejected} rejected, ${report.deepseekReviewRequired} held for review, ${report.deepseekErrors} errors`,
        "",
        "### Most common rejection reasons",
        "",
        topRejections,
        "",
        "### Fetch failures",
        "",
        report.fetchFailures.length ? `- ${report.fetchFailures.length} unresolved fetch failures (budget ${fetchFailureBudget}). Full URLs and errors are in the uploaded artifact.` : "- None",
        "",
      ].join("\n"), "utf8");
    }

    console.log("Done.");
    if (coverageStatus === "INCOMPLETE") {
      throw new Error("Scan coverage is incomplete; inspect the uploaded report and rerun after resolving provider or article-fetch failures.");
    }
  } catch (error) {
    // Preserve a completed INCOMPLETE report; unexpected failures must never look like a healthy scan.
    await ScanRun.updateOne({ runId, coverageStatus: "RUNNING" }, { $set: { coverageStatus: "FAILED", finishedAt: new Date() } });
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
