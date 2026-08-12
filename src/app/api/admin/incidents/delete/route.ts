import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifySession } from "@/lib/auth";
import Attack from "@/lib/models/Attack";
import User from "@/lib/models/User";
import { applySecurityChecks, verifyCsrf } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 20,
      rateLimitWindow: 60_000,
    });
    if (securityError) return securityError;

    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!verifyCsrf(req)) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findById(session.userId).select("role").lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const result = await Attack.deleteMany({ _id: { $in: ids } });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
