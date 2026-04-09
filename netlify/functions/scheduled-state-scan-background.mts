import type { Config, BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { fetchAttacksForStates } from "../../src/lib/gemini";
import { ingestAttacks } from "../../src/lib/ingest-attacks";

// Every 7 minutes — targeted per-state scan covering all 37 states in parallel
export const config: Config = {
  schedule: "*/7 * * * *",
};

/**
 * All 37 Nigerian states (including FCT) split into 6 geographic groups.
 * Each group is scanned in parallel every 13 minutes, ensuring every state
 * is checked at least once per run — catching incidents the general hourly
 * scan misses for lower-profile states like Gombe, Bayelsa, Jigawa, etc.
 */
const STATE_GROUPS: Record<string, string[]> = {
  Northeast: ["Borno", "Yobe", "Adamawa", "Gombe", "Bauchi", "Taraba"],
  Northwest: ["Kaduna", "Kano", "Katsina", "Zamfara", "Sokoto", "Kebbi", "Jigawa"],
  NorthCentral: ["Plateau", "Benue", "Niger", "Kwara", "FCT", "Kogi", "Nasarawa"],
  Southwest: ["Lagos", "Ogun", "Ondo", "Ekiti", "Osun", "Oyo"],
  SouthSouth: ["Rivers", "Delta", "Edo", "Bayelsa", "Akwa Ibom", "Cross River"],
  Southeast: ["Anambra", "Imo", "Abia", "Enugu", "Ebonyi"],
};

const handler: BackgroundHandler = async () => {
  try {
    await connectDB();

    console.log("[State Scan] Starting per-state scan across all 37 states...");

    // Run all 6 geographic groups in parallel
    const groupResults = await Promise.allSettled(
      Object.entries(STATE_GROUPS).map(async ([region, states]) => {
        console.log(`[State Scan] Scanning ${region}: ${states.join(", ")}`);
        try {
          const rawAttacks = await fetchAttacksForStates(states, 7);
          console.log(`[State Scan] ${region}: Gemini returned ${rawAttacks.length} incident(s)`);

          if (rawAttacks.length === 0) return { region, saved: 0, merged: 0, errors: 0 };

          const result = await ingestAttacks(rawAttacks, `State Scan/${region}`);
          return { region, ...result };
        } catch (err) {
          console.error(`[State Scan] ${region} failed:`, err);
          return { region, saved: 0, merged: 0, errors: 1 };
        }
      }),
    );

    // Aggregate and log totals
    let totalSaved = 0, totalMerged = 0, totalErrors = 0;
    for (const result of groupResults) {
      if (result.status === "fulfilled") {
        const { region, saved, merged, errors } = result.value;
        totalSaved += saved;
        totalMerged += merged;
        totalErrors += errors;
        if (saved > 0 || merged > 0) {
          console.log(`[State Scan] ${region} — saved: ${saved}, merged: ${merged}, errors: ${errors}`);
        }
      } else {
        console.error("[State Scan] Group promise rejected:", result.reason);
        totalErrors++;
      }
    }

    console.log(
      `[State Scan] Complete — saved: ${totalSaved}, merged: ${totalMerged}, errors: ${totalErrors}`,
    );
  } catch (error) {
    console.error("[State Scan] Fatal error:", error);
  }
};

export { handler };
