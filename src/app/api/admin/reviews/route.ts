import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import IncidentReview, {
  INCIDENT_REVIEW_STATUSES,
  MAX_INCIDENT_REVIEW_ATTEMPTS,
  type IncidentReviewStatus,
} from "@/lib/models/IncidentReview";
import User from "@/lib/models/User";
import { applySecurityChecks, verifyCsrf } from "@/lib/security";

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

function positiveInteger(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 60,
      rateLimitWindow: 60_000,
    });
    if (securityError) return securityError;

    const admin = await requireAdmin();
    if ("error" in admin) return admin.error;

    const page = positiveInteger(req.nextUrl.searchParams.get("page"), 1, 10_000);
    const limit = positiveInteger(req.nextUrl.searchParams.get("limit"), 12, 50);
    const requestedStatus = req.nextUrl.searchParams.get("status") || "pending";
    if (requestedStatus !== "all" && !INCIDENT_REVIEW_STATUSES.includes(requestedStatus as IncidentReviewStatus)) {
      return NextResponse.json({ error: "Invalid review status" }, { status: 400 });
    }

    const filter = requestedStatus === "all" ? {} : { status: requestedStatus };
    const [reviews, total, statusCounts] = await Promise.all([
      IncidentReview.find(filter)
        .select("+sourceEvidence")
        .sort({ lastSeenAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      IncidentReview.countDocuments(filter),
      IncidentReview.aggregate<{ _id: IncidentReviewStatus; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const counts = { pending: 0, resolved: 0, dismissed: 0 };
    for (const entry of statusCounts) counts[entry._id] = entry.count;

    return NextResponse.json({
      reviews,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Review queue error:", error);
    return NextResponse.json({ error: "Unable to load the review queue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 20,
      rateLimitWindow: 60_000,
    });
    if (securityError) return securityError;

    const admin = await requireAdmin();
    if ("error" in admin) return admin.error;
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }

    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { id, action, note } = body as { id?: unknown; action?: unknown; note?: unknown };
    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }
    if (action !== "dismiss" && action !== "reopen" && action !== "request_retry") {
      return NextResponse.json({ error: "Invalid review action" }, { status: 400 });
    }
    if (note !== undefined && (typeof note !== "string" || note.trim().length > 2000)) {
      return NextResponse.json({ error: "Review notes must be 2,000 characters or fewer" }, { status: 400 });
    }

    const now = new Date();
    let updated;
    if (action === "dismiss") {
      updated = await IncidentReview.findOneAndUpdate(
        { _id: id, status: { $ne: "dismissed" } },
        {
          $set: {
            status: "dismissed",
            reviewedAt: now,
            reviewedBy: admin.session.userId,
            dispositionNote: typeof note === "string" ? note.trim() : "",
          },
        },
        { returnDocument: "after" },
      ).lean();
    } else if (action === "reopen") {
      updated = await IncidentReview.findOneAndUpdate(
        { _id: id, status: { $ne: "pending" } },
        {
          $set: {
            status: "pending",
            reviewedAt: null,
            reviewedBy: null,
            dispositionNote: "",
          },
        },
        { returnDocument: "after" },
      ).lean();
    } else {
      updated = await IncidentReview.findOneAndUpdate(
        {
          _id: id,
          status: "pending",
          retryable: true,
          attempts: { $lt: MAX_INCIDENT_REVIEW_ATTEMPTS },
        },
        { $set: { nextRetryAt: now } },
        { returnDocument: "after" },
      ).lean();
    }

    if (!updated) {
      return NextResponse.json(
        { error: action === "request_retry" ? "This item is not eligible for another retry" : "Review item was not updated" },
        { status: 409 },
      );
    }

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("Review action error:", error);
    return NextResponse.json({ error: "Unable to update the review item" }, { status: 500 });
  }
}
