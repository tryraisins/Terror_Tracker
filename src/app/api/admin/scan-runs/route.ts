import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { getScanRunsForAdmin } from "@/lib/scan-health";
import { applySecurityChecks } from "@/lib/security";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await verifySession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  await dbConnect();
  const user = await User.findById(session.userId).select("role").lean();
  if (!user || user.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

/**
 * Collection health for the admin panel: the same data /api/scan-health used to
 * expose publicly, plus the recent run history that scan_runs already stores.
 */
export async function GET(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 60,
      rateLimitWindow: 60_000,
    });
    if (securityError) return securityError;

    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const limit = Number(new URL(req.url).searchParams.get("limit")) || 10;
    const payload = await getScanRunsForAdmin(limit);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Admin scan runs error:", error);
    return NextResponse.json({ error: "Scan history is unavailable" }, { status: 503 });
  }
}
