import { NextRequest, NextResponse } from "next/server";
import { getPublicScanFreshness } from "@/lib/scan-health";
import { applySecurityChecks } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Public freshness only: when the record was last refreshed.
 *
 * Coverage warnings and failure detail used to live here and were rendered in the
 * footer for every visitor. They are operator information, so they moved to the
 * session-gated /api/admin/scan-runs.
 */
export async function GET(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 60,
      rateLimitWindow: 60_000,
    });
    if (securityError) return securityError;

    const freshness = await getPublicScanFreshness();
    return NextResponse.json(freshness, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Scan freshness error:", error);
    return NextResponse.json({ error: "Scan status is unavailable" }, { status: 503 });
  }
}
