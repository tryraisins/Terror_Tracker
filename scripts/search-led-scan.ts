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
import { VALID_STATE_NAMES } from "../src/lib/normalize-state";
import { collectSearchLedIncidents, ingestSearchLedAttacks } from "../src/lib/search-led-discovery";
import { DuplicateCheckerService } from "../src/lib/duplicate-checker";

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const states = [...VALID_STATE_NAMES];
  console.log(`Scanning ${states.length} states over the trailing 48-hour window...`);

  const { attacks, report } = await collectSearchLedIncidents(states, 48);
  console.log("Search report:", JSON.stringify(report));

  const ingest = attacks.length > 0
    ? await ingestSearchLedAttacks(attacks, "SearchLedScan/48h")
    : { inserted: 0, merged: 0, errors: 0 };
  console.log("Ingest:", JSON.stringify(ingest));

  const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const dup = await DuplicateCheckerService.findDuplicatesForRecentIncidents(since);
  const dupCount = dup.reduce((n, d) => n + d.candidates.length, 0);
  console.log(`Duplicate candidates: ${dupCount} across ${dup.length} state(s)`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
