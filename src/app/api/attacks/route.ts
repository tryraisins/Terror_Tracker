import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";
import { normalizeStateName } from "@/lib/normalize-state";
import { AttackQuerySchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  // Security checks: rate limit 100 req/min for reads
  const securityError = await applySecurityChecks(req, {
    rateLimit: 100,
    rateLimitWindow: 60_000,
  });
  if (securityError) return securityError;

  try {
    // Parse and validate query params
    const { searchParams } = new URL(req.url);
    const rawQuery: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawQuery[key] = value;
    });

    const parseResult = AttackQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      return setCORSHeaders(
        NextResponse.json(
          { error: "Invalid query parameters", details: parseResult.error.flatten() },
          { status: 400 }
        )
      );
    }

    const { page, limit, state, group, status, startDate, endDate, month, search, sort, source } =
      parseResult.data;

    await connectDB();

    // Build MongoDB filter — exclude soft-deleted records
    const filter: Record<string, unknown> = { _deleted: { $ne: true } };

    if (state) {
      const normalizedState = normalizeStateQuery(state);
      if (isFctState(normalizedState)) {
        filter["location.state"] = {
          $regex: /^(Federal Capital Territory|FCT|Abuja)$/i,
        };
      } else {
        filter["location.state"] = {
          $regex: new RegExp(`^${escapeRegex(normalizedState)}$`, "i"),
        };
      }
    }
    if (group) filter.group = { $regex: new RegExp(escapeRegex(group), "i") };
    if (status) filter.status = status;
    if (source) filter["sources.publisher"] = source;

    if (month) {
      const [y, m] = month.split("-").map(Number);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999),
      };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) (filter.date as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (filter.date as Record<string, unknown>).$lte = new Date(endDate);
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { "location.town": { $regex: safeSearch, $options: "i" } },
        { group: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Casualty filter
    const { casualtyType } = parseResult.data;
    if (casualtyType) {
      filter[`casualties.${casualtyType}`] = { $gt: 0 };
    }

    // Sort
    let sortObj: Record<string, 1 | -1> = { date: -1 };
    if (sort === "date_asc") sortObj = { date: 1 };
    if (sort === "casualties_desc") sortObj = { "casualties.killed": -1, date: -1 };

    const skip = (page - 1) * limit;

    const [attacks, total] = await Promise.all([
      Attack.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Attack.countDocuments(filter),
    ]);

    const response = NextResponse.json({
      attacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });

    return setCORSHeaders(response);
  } catch (error) {
    console.error("GET /api/attacks error:", error);
    return setCORSHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeStateQuery(state: string): string {
  return normalizeStateName(state);
}

function isFctState(state: string): boolean {
  const s = state.toLowerCase();
  return s === "fct" || s.includes("abuja") || s.includes("capital");
}
