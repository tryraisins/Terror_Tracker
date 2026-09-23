/**
 * search-led-scan.ts
 *
 * Manual / GitHub Actions trigger of the free (non-Gemini) search-led
 * discovery pipeline over the trailing 48-hour window, followed by the
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
import { VALID_STATE_NAMES } from "../src/lib/normalize-state";
import { collectSearchLedIncidents, ingestSearchLedAttacks } from "../src/lib/search-led-discovery";
import { DuplicateCheckerService } from "../src/lib/duplicate-checker";

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  const lookbackHours = Number(process.env.INCIDENT_LOOKBACK_HOURS || 96);
  if (!Number.isInteger(lookbackHours) || lookbackHours < 24 || lookbackHours > 336) {
    throw new Error("INCIDENT_LOOKBACK_HOURS must be an integer between 24 and 336");
  }
  const runStartedAt = new Date().toISOString();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const states = [...VALID_STATE_NAMES];
  console.log(`Scanning ${states.length} states over the trailing ${lookbackHours}-hour incident window...`);

  const { attacks, report } = await collectSearchLedIncidents(states, lookbackHours);
  console.log("Search report:", JSON.stringify(report));

  const ingest = attacks.length > 0
    ? await ingestSearchLedAttacks(attacks, `SearchLedScan/${lookbackHours}h`)
    : { inserted: 0, merged: 0, errors: 0 };
  console.log("Ingest:", JSON.stringify(ingest));

  const since = new Date(Date.now() - Math.max(5 * 24, lookbackHours) * 60 * 60 * 1000);
  const dup = await DuplicateCheckerService.findDuplicatesForRecentIncidents(since);
  const dupCount = dup.reduce((n, d) => n + d.candidates.length, 0);
  console.log(`Duplicate candidates: ${dupCount} across ${dup.length} state(s)`);

  const coverageStatus = report.queriesRun !== states.length || report.fetchFailures.length > 0 || report.searchFailures.length > 0 || ingest.errors > 0
    ? "INCOMPLETE"
    : report.reviewLeads.length > 0
      ? "REVIEW_REQUIRED"
      : "COMPLETE";
  const result = {
    runStartedAt,
    runFinishedAt: new Date().toISOString(),
    coverageStatus,
    statesScanned: states,
    report,
    candidates: attacks.map((attack) => ({
      title: attack.title,
      date: attack.date,
      location: attack.location,
      casualties: attack.casualties,
      status: attack.status,
      sources: attack.sources,
    })),
    ingest,
    duplicateCheck: { candidatePairs: dupCount, statesWithCandidates: dup.length },
  };

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
      `- Jurisdictions: ${report.queriesRun}/${states.length}`,
      `- URLs: ${report.urlsDiscovered} found, ${report.urlsFetched} fetched, ${report.fetchRetries} retry attempts, ${report.errors} unresolved fetch errors`,
      `- Search provider errors: ${report.searchFailures.length}`,
      `- Candidates: ${report.candidates} admitted, ${report.reviewLeads.length} sent to review, ${report.rejected} rejected`,
      `- Database: ${ingest.inserted} inserted, ${ingest.merged} merged, ${ingest.errors} errors`,
      `- DeepSeek: ${report.deepseekCalls} calls, ${report.deepseekConfirmed} confirmed, ${report.deepseekRejected} rejected, ${report.deepseekErrors} errors`,
      "",
      "### Most common rejection reasons",
      "",
      topRejections,
      "",
      "### Fetch failures",
      "",
      report.fetchFailures.length ? `- ${report.fetchFailures.length} failures. Full URLs and errors are in the uploaded artifact.` : "- None",
      "",
    ].join("\n"), "utf8");
  }

  await mongoose.disconnect();
  console.log("Done.");
  if (coverageStatus === "INCOMPLETE") {
    throw new Error("Scan coverage is incomplete; inspect the uploaded report and rerun after resolving provider or article-fetch failures.");
  }
}

run().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
