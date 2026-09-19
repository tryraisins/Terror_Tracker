import type { BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { assertActiveAttackDateIntegrity } from "../../src/lib/attack-data-integrity";
import { VALID_STATE_NAMES } from "../../src/lib/normalize-state";
import { collectSearchLedIncidents, ingestSearchLedAttacks } from "../../src/lib/search-led-discovery";
import { DuplicateCheckerService } from "../../src/lib/duplicate-checker";

/**
 * Daily search-led discovery (free engines + Brave fallback) over the trailing
 * 48-hour window, plus the report-only duplicate check. Fully free: no Gemini
 * or VertexAI calls anywhere in this path.
 */
const handler: BackgroundHandler = async () => {
  try {
    await connectDB();
    await assertActiveAttackDateIntegrity("Search-led discovery preflight");

    const { attacks, report } = await collectSearchLedIncidents([...VALID_STATE_NAMES], 48);
    console.log("[Scheduled Discovery] search report", report);

    const ingest = attacks.length > 0
      ? await ingestSearchLedAttacks(attacks, "ScheduledDiscovery/48h")
      : { inserted: 0, merged: 0, errors: 0 };
    console.log("[Scheduled Discovery] ingest", ingest);

    // Duplicate check on the same schedule (report-only heuristic, no AI).
    const since = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const dup = await DuplicateCheckerService.findDuplicatesForRecentIncidents(since);
    const dupCount = dup.reduce((n, d) => n + d.candidates.length, 0);
    console.log(`[Scheduled Discovery] duplicate candidates: ${dupCount} across ${dup.length} state(s)`);

    await assertActiveAttackDateIntegrity("Search-led discovery postflight");
  } catch (error) {
    console.error("[Scheduled Discovery] Fatal error:", error);
    throw error;
  }
};

export { handler };
