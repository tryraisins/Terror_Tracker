import { after, NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { fetchRecentAttacks } from "@/lib/gemini";
import { ingestAttacks } from "@/lib/ingest-attacks";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const securityError = await applySecurityChecks(req, {
    rateLimit: 5,
    rateLimitWindow: 3600_000,
    requireCronSecret: true,
  });
  if (securityError) return securityError;

  after(async () => {
    try {
      await connectDB();

      console.log("[CRON] Starting attack data update...");

      const rawAttacks = await fetchRecentAttacks();
      console.log(`[CRON] Gemini returned ${rawAttacks.length} potential incidents`);

      if (rawAttacks.length === 0) {
        console.log("[CRON] No new attacks found");
        return;
      }

      const { saved, merged, errors } = await ingestAttacks(rawAttacks, "CRON");

      console.log(
        `[CRON] Update complete - fetched: ${rawAttacks.length}, saved: ${saved}, merged: ${merged}, errors: ${errors}`,
      );
    } catch (error) {
      console.error("[CRON] Fatal error:", error);
    }
  });

  return setCORSHeaders(
    NextResponse.json({
      message: "Update initiated - processing in background",
      timestamp: new Date().toISOString(),
    }),
  );
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}
