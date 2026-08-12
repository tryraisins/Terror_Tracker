import type { Config, BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import { collectFreeIncidents } from "../../src/lib/free-news";

// Every hour
export const config: Config = {
  schedule: "0 * * * *",
};

const handler: BackgroundHandler = async () => {
  try {
    await connectDB();

    console.log("[Scheduled Update] Starting free source-led collection...");
    console.log("[Scheduled Update] Complete", await collectFreeIncidents());
  } catch (error) {
    console.error("[Scheduled Update] Fatal error:", error);
  }
};

export { handler };
