import { after, NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { collectFreeIncidents, isFreeSourceIngestionEnabled } from "@/lib/free-news";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const securityError = await applySecurityChecks(req, {
    rateLimit: 5,
    rateLimitWindow: 3600_000,
    requireCronSecret: true,
  });
  if (securityError) return securityError;

  if (!isFreeSourceIngestionEnabled()) {
    return setCORSHeaders(
      NextResponse.json({
        message: "Update skipped: source-led incident ingestion is paused.",
        timestamp: new Date().toISOString(),
      }),
    );
  }

  after(async () => {
    try {
      await connectDB();

      console.log("[CRON] Starting free source-led collection...");
      console.log("[CRON] Update complete", await collectFreeIncidents());
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
