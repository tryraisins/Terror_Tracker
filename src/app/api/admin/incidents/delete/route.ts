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

    const { ids, reason, confirmation } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || typeof reason !== "string" || reason.trim().length < 8) {
      return NextResponse.json(
        { error: "Select records and provide a review reason of at least 8 characters" },
        { status: 400 }
      );
    }

    const expectedConfirmation = `MOVE ${ids.length} RECORDS TO REVIEW`;
    if (confirmation !== expectedConfirmation) {
      return NextResponse.json(
        { error: `Type \"${expectedConfirmation}\" to continue` },
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

    // The public list already excludes _deleted records. Preserve the record and
    // audit context instead of permanently deleting evidence from the database.
    const result = await Attack.updateMany(
      { _id: { $in: ids }, _deleted: { $ne: true } },
      {
        $set: {
          _deleted: true,
          _deletedReason: reason.trim(),
          _deletedAt: new Date(),
          _deletedBy: session.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      movedToReviewCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
