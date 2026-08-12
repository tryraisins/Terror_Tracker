import type { Config, BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { fetchRecentAttacks } from "../../src/lib/gemini";
import { ingestAttacks } from "../../src/lib/ingest-attacks";

// Every hour
export const config: Config = {
  schedule: "0 * * * *",
};

const handler: BackgroundHandler = async () => {
  try {
    await connectDB();

    console.log("[Scheduled Update] Starting general attack data update...");

    const rawAttacks = await fetchRecentAttacks();
    console.log(`[Scheduled Update] Gemini returned ${rawAttacks.length} potential incidents`);

    if (rawAttacks.length === 0) {
      console.log("[Scheduled Update] No new attacks found");
      return;
    }

    const { saved, merged, errors } = await ingestAttacks(rawAttacks, "Scheduled Update");

    console.log(
      `[Scheduled Update] Complete — fetched: ${rawAttacks.length}, saved: ${saved}, merged: ${merged}, errors: ${errors}`,
    );
  } catch (error) {
    console.error("[Scheduled Update] Fatal error:", error);
  }
};

export { handler };
