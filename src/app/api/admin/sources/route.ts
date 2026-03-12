import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifySession } from "@/lib/auth";
import Attack from "@/lib/models/Attack";
import User from "@/lib/models/User";
import { applySecurityChecks } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 60,
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

    await dbConnect();
    const user = await User.findById(session.userId).select("role").lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Aggregate unique publishers from the sources array
    const publishers = await Attack.distinct("sources.publisher");

    return NextResponse.json({
      sources: publishers.filter((p) => p).sort(),
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
