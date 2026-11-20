import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";
import { normalizeStateName } from "@/lib/normalize-state";
import { AttackQuerySchema } from "@/lib/validators";
import { assertActiveAttackDateIntegrity } from "@/lib/attack-data-integrity";
import { PUBLIC_ATTACK_FIELDS } from "@/lib/incident-public";

const PUBLIC_ATTACK_AGGREGATE_PROJECTION = PUBLIC_ATTACK_FIELDS
  .split(/\s+/)
  .reduce<Record<string, 1>>((projection, field) => {
    projection[field] = 1;
    return projection;
  }, { _id: 1 });

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
    await assertActiveAttackDateIntegrity("GET /api/attacks");

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

    if (month || startDate || endDate) {
      // A ranged incident can match either boundary month. Showing it in both
      // lists is safe because the card shows the range, not an invented day.
      let start: Date | undefined;
      let end: Date | undefined;
      if (month) {
        const [year, monthNumber] = month.split("-").map(Number);
        start = new Date(year, monthNumber - 1, 1);
        end = new Date(year, monthNumber, 0, 23, 59, 59, 999);
      } else {
        if (startDate) start = new Date(startDate);
        if (endDate) end = new Date(endDate);
      }
      const date: Record<string, Date> = {};
      if (start) date.$gte = start;
      if (end) date.$lte = end;
      const rangeStart = { $convert: { input: "$dateRange.start", to: "date", onError: null, onNull: null } };
      const rangeEnd = { $convert: { input: "$dateRange.end", to: "date", onError: null, onNull: null } };
      const rangeChecks: Record<string, unknown>[] = [{ $ne: [rangeStart, null] }, { $ne: [rangeEnd, null] }, { $lte: [rangeStart, rangeEnd] }];
      if (start) rangeChecks.push({ $gte: [rangeEnd, start] });
      if (end) rangeChecks.push({ $lte: [rangeStart, end] });
      const overlap = { datePrecision: "date_range", $expr: { $and: rangeChecks } };
      const monthValue = { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } };
      const monthChecks: Record<string, unknown>[] = [];
      if (start) monthChecks.push({ $gte: [monthValue, start.toISOString().slice(0, 7)] });
      if (end) monthChecks.push({ $lte: [monthValue, end.toISOString().slice(0, 7)] });
      filter.$and = [{ $or: [
        { datePrecision: { $nin: ["unknown", "date_range", "month_only"] }, date },
        overlap,
        { datePrecision: "month_only", $expr: { $and: monthChecks } },
      ] }];
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

    const skip = (page - 1) * limit;

    // For casualties sort, use aggregation to rank by total affected (killed + injured + kidnapped + displaced)
    let attacks: unknown[];
    let total: number;

    // Totals aggregation — runs across all filtered results (not just current page)
    const totalsAgg = Attack.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          killed: { $sum: { $ifNull: ["$casualties.killed", 0] } },
          injured: { $sum: { $ifNull: ["$casualties.injured", 0] } },
          kidnapped: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } },
        },
      },
    ]);

    if (sort === "casualties_desc") {
      [attacks, total] = await Promise.all([
        Attack.aggregate([
          { $match: filter },
          {
            $addFields: {
              // Displaced is excluded — it inflates totals disproportionately
              // and is far less severe than being killed, kidnapped, or injured
              _totalAffected: {
                $add: [
                  { $ifNull: ["$casualties.killed", 0] },
                  { $ifNull: ["$casualties.injured", 0] },
                  { $ifNull: ["$casualties.kidnapped", 0] },
                ],
              },
            },
          },
          { $sort: { _totalAffected: -1, date: -1 } },
          { $skip: skip },
          { $limit: limit },
          // Keep aggregate responses on the same public allowlist as find queries.
          { $project: PUBLIC_ATTACK_AGGREGATE_PROJECTION },
        ]),
        Attack.countDocuments(filter),
      ]);
    } else {
      [attacks, total] = await Promise.all([
        Attack.find(filter).sort(sortObj).skip(skip).limit(limit).select(PUBLIC_ATTACK_FIELDS).lean(),
        Attack.countDocuments(filter),
      ]);
    }

    const [totalsResult] = await totalsAgg;
    const totals = {
      killed: totalsResult?.killed ?? 0,
      injured: totalsResult?.injured ?? 0,
      kidnapped: totalsResult?.kidnapped ?? 0,
    };

    const response = NextResponse.json({
      attacks,
      totals,
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
