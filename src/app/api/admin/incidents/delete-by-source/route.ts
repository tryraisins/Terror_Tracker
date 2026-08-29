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

    const { source, reason, confirmation } = await req.json();

    if (!source || typeof source !== "string" || typeof reason !== "string" || reason.trim().length < 8) {
      return NextResponse.json(
        { error: "A source and review reason are required" },
        { status: 400 }
      );
    }

    if (confirmation !== `REVIEW SOURCE: ${source}`) {
      return NextResponse.json({ error: `Type \"REVIEW SOURCE: ${source}\" to continue` }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(session.userId).select("role").lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const result = await Attack.updateMany(
      { "sources.publisher": source, _deleted: { $ne: true } },
      { $set: { _deleted: true, _deletedReason: reason.trim(), _deletedAt: new Date(), _deletedBy: session.userId } }
    );

    return NextResponse.json({
      success: true,
      movedToReviewCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Delete by source error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
