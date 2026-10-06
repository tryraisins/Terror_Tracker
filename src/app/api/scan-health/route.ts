import { NextRequest, NextResponse } from "next/server";
import { getScanHealth } from "@/lib/scan-health";
import { applySecurityChecks } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 60,
      rateLimitWindow: 60_000,
    });
    if (securityError) return securityError;

    const health = await getScanHealth();
    return NextResponse.json(health, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Scan health error:", error);
    return NextResponse.json({ error: "Scan health is unavailable" }, { status: 503 });
  }
}
