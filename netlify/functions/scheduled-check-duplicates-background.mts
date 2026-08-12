import type { Config, BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { DuplicateCheckerService } from "../../src/lib/duplicate-checker";

// Every 27 minutes
export const config: Config = {
  schedule: "*/27 * * * *",
};

const handler: BackgroundHandler = async () => {
  try {
    await connectDB();

    const sinceDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    console.log(
      `[Scheduled Dup Check] Checking incidents since ${sinceDate.toISOString()}`,
    );

    const stateResults =
      await DuplicateCheckerService.findDuplicatesForRecentIncidents(sinceDate);
    const allCandidates = stateResults.flatMap((r) => r.candidates);

    console.log(
      `[Scheduled Dup Check] ${allCandidates.length} candidate pair(s) across ${stateResults.length} state(s)`,
    );

    if (allCandidates.length === 0) {
      console.log("[Scheduled Dup Check] No duplicates found.");
      return;
    }

    const results =
      await DuplicateCheckerService.processDuplicates(allCandidates);

    const merges = results.filter((r) => r.type === "MERGE").length;
    console.log(
      `[Scheduled Dup Check] Complete — merged: ${merges}, confirmed-unique: ${results.length - merges}`,
    );
  } catch (error) {
    console.error("[Scheduled Dup Check] Fatal error:", error);
  }
};

export { handler };
