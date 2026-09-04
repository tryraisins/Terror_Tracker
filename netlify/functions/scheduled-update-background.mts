import type { BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { collectFreeIncidents, isFreeSourceIngestionEnabled } from "../../src/lib/free-news";

const handler: BackgroundHandler = async () => {
  try {
    if (!isFreeSourceIngestionEnabled()) {
      console.log("[Scheduled Update] Paused: FREE_SOURCE_INGEST_ENABLED is not true.");
      return;
    }

    await connectDB();

    console.log("[Scheduled Update] Starting free source-led collection...");
    console.log("[Scheduled Update] Complete", await collectFreeIncidents());
  } catch (error) {
    console.error("[Scheduled Update] Fatal error:", error);
  }
};

export { handler };
