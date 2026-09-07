import type { BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { collectFreeIncidents, isFreeSourceIngestionEnabled } from "../../src/lib/free-news";
import { assertActiveAttackDateIntegrity } from "../../src/lib/attack-data-integrity";

const handler: BackgroundHandler = async () => {
  try {
    if (!isFreeSourceIngestionEnabled()) {
      console.log("[Scheduled Update] Paused: FREE_SOURCE_INGEST_ENABLED is not true.");
      return;
    }

    await connectDB();
    await assertActiveAttackDateIntegrity("Scheduled Update preflight");

    console.log("[Scheduled Update] Starting free source-led collection...");
    const result = await collectFreeIncidents();
    await assertActiveAttackDateIntegrity("Scheduled Update postflight");
    console.log("[Scheduled Update] Complete", result);
  } catch (error) {
    console.error("[Scheduled Update] Fatal error:", error);
    throw error;
  }
};

export { handler };
