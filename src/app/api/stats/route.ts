import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";
import { assertActiveAttackDateIntegrity } from "@/lib/attack-data-integrity";

const NIGERIA_TIMEZONE = "Africa/Lagos";

function nigeriaCalendarPart(date: Date, part: "year" | "month" | "day"): number {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone: NIGERIA_TIMEZONE,
    [part]: "numeric",
  }).formatToParts(date).find((item) => item.type === part)?.value;
  if (!value) throw new Error(`Unable to determine Nigeria calendar ${part}.`);
  return Number(value);
}

export async function GET(req: NextRequest) {
  const securityError = await applySecurityChecks(req, {
    rateLimit: 60,
    rateLimitWindow: 60_000,
  });
  if (securityError) return securityError;

  try {
    await connectDB();
    await assertActiveAttackDateIntegrity("GET /api/stats");
    const now = new Date();
    const nigeriaYear = nigeriaCalendarPart(now, "year");
    const nigeriaMonth = nigeriaCalendarPart(now, "month");
    const nigeriaDay = nigeriaCalendarPart(now, "day");
    // Nigeria is UTC+1 year-round. This makes the dashboard's year filter use
    // the same calendar boundary as its Nigeria-focused incident reporting.
    const startOfYear = new Date(`${nigeriaYear}-01-01T00:00:00.000+01:00`);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Exclude soft-deleted records from all queries
    // All statistics here are time-based. An unknown event date must not be
    // counted in the period containing its internal storage anchor.
    const active = { _deleted: { $ne: true }, datePrecision: { $ne: "unknown" as const } };
    // Date ranges are intervals, not their storage anchor. A month-only date
    // spans its full calendar month. Convert old string endpoints defensively.
    const rangeStart = { $convert: { input: "$dateRange.start", to: "date", onError: null, onNull: null } };
    const rangeEnd = { $convert: { input: "$dateRange.end", to: "date", onError: null, onNull: null } };
    const monthStart = { $dateTrunc: { date: "$date", unit: "month", timezone: "UTC" } };
    const monthEnd = { $dateSubtract: { startDate: { $dateAdd: { startDate: monthStart, unit: "month", amount: 1 } }, unit: "millisecond", amount: 1 } };
    const intervalStart = { $switch: { branches: [
      { case: { $eq: ["$datePrecision", "date_range"] }, then: rangeStart },
      { case: { $eq: ["$datePrecision", "month_only"] }, then: monthStart },
    ], default: "$date" } };
    const intervalEnd = { $switch: { branches: [
      { case: { $eq: ["$datePrecision", "date_range"] }, then: rangeEnd },
      { case: { $eq: ["$datePrecision", "month_only"] }, then: monthEnd },
    ], default: "$date" } };
    const endOfToday = new Date(Date.UTC(nigeriaYear, nigeriaMonth - 1, nigeriaDay, 23, 59, 59, 999));
    const endOfTodayLagos = new Date(endOfToday.getTime() - 60 * 60 * 1000);
    // Range endpoints are calendar-day labels stored in UTC; exact timestamps
    // retain the endpoint's established Nigeria-local grouping behavior.
    const rangeOrMonth = { $in: ["$datePrecision", ["date_range", "month_only"]] };
    const calendarTimezone = { $cond: [rangeOrMonth, "UTC", NIGERIA_TIMEZONE] };
    const periodEnd = { $cond: [rangeOrMonth, endOfToday, endOfTodayLagos] };
    const inside = (start: Date, end: unknown = periodEnd) => ({ ...active, $expr: { $and: [
      { $ne: [intervalStart, null] }, { $ne: [intervalEnd, null] },
      { $lte: [intervalStart, intervalEnd] }, { $gte: [intervalStart, start] }, { $lte: [intervalEnd, end] },
    ] } });
    const sameCalendarUnit = (format: string) => ({ $eq: [
      { $dateToString: { date: intervalStart, format, timezone: calendarTimezone } },
      { $dateToString: { date: intervalEnd, format, timezone: calendarTimezone } },
    ] });
    const yearEndUtc = new Date(Date.UTC(nigeriaYear, 11, 31, 23, 59, 59, 999));
    const yearEnd = { $cond: [rangeOrMonth, yearEndUtc, new Date(yearEndUtc.getTime() - 60 * 60 * 1000)] };
    const inYear = inside(startOfYear, yearEnd);

    const [
      totalAttacks,
      totalKilled,
      totalInjured,
      totalKidnapped,
      totalDisplaced,
      attacksLast30Days,
      attacksLast7Days,
      byState,
      byGroup,
      byMonth,
      byDay,
      recentAttacks,
    ] = await Promise.all([
      // Total attacks this year
      Attack.countDocuments(inYear),

      // Total killed
      Attack.aggregate([
        { $match: inYear },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$casualties.killed", 0] } } } },
      ]),

      // Total injured
      Attack.aggregate([
        { $match: inYear },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$casualties.injured", 0] } } } },
      ]),

      // Total kidnapped
      Attack.aggregate([
        { $match: inYear },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } } } },
      ]),

      Attack.aggregate([
        { $match: inYear },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$casualties.displaced", 0] } } } },
      ]),

      // Attacks in last 30 days
      Attack.countDocuments(inside(thirtyDaysAgo)),

      // Attacks in last 7 days
      Attack.countDocuments(inside(sevenDaysAgo)),

      // Attacks by state: every jurisdiction, because the dashboard map shades all 37
      Attack.aggregate([
        { $match: inYear },
        { $group: { _id: "$location.state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Attacks by group
      Attack.aggregate([
        { $match: inYear },
        { $group: { _id: "$group", count: { $sum: 1 }, killed: { $sum: { $ifNull: ["$casualties.killed", 0] } } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Only intervals contained by one month can enter that month's bin.
      Attack.aggregate([
        { $match: { ...inYear, $expr: { $and: [inYear.$expr, sameCalendarUnit("%Y-%m")] } } },
        {
          $group: {
            _id: { $month: { date: intervalStart, timezone: calendarTimezone } },
            count: { $sum: 1 },
            killed: { $sum: { $ifNull: ["$casualties.killed", 0] } },
            kidnapped: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Only intervals contained by one day can enter a daily bin.
      Attack.aggregate([
        { $match: { ...inYear, $expr: { $and: [inYear.$expr, sameCalendarUnit("%Y-%m-%d")] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: intervalStart, timezone: calendarTimezone } },
            count: { $sum: 1 },
            killed: { $sum: { $ifNull: ["$casualties.killed", 0] } },
            kidnapped: { $sum: { $ifNull: ["$casualties.kidnapped", 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 7 most recent attacks
      Attack.find(active)
        .sort({ date: -1 })
        .limit(7)
        .select("title date datePrecision dateRange location group casualties casualtyMeta status sources")
        .lean(),

    ]);

    const response = NextResponse.json({
      period: { timezone: NIGERIA_TIMEZONE, month: nigeriaMonth, throughDay: nigeriaDay },
      overview: {
        totalAttacks,
        totalKilled: totalKilled[0]?.total || 0,
        totalInjured: totalInjured[0]?.total || 0,
      totalKidnapped: totalKidnapped[0]?.total || 0,
      totalDisplaced: totalDisplaced[0]?.total || 0,
        attacksLast30Days,
        attacksLast7Days,
      year: nigeriaYear,
    },
      byState: byState.map((s: { _id: string; count: number }) => ({
        state: s._id,
        count: s.count,
      })),
      byGroup: byGroup.map(
        (g: { _id: string; count: number; killed: number }) => ({
          group: g._id,
          count: g.count,
          killed: g.killed,
        })
      ),
      byMonth: (() => {
        // Build a lookup from the aggregation results
        const monthMap = new Map<number, { count: number; killed: number; kidnapped: number }>();
        byMonth.forEach((m: { _id: number; count: number; killed: number; kidnapped: number }) => {
          monthMap.set(m._id, { count: m.count, killed: m.killed, kidnapped: m.kidnapped });
        });
        // Fill in all months from Jan to current month with zeros where no data exists
        const currentMonth = nigeriaMonth; // 1-indexed, Africa/Lagos
        const allMonths = [];
        for (let i = 1; i <= currentMonth; i++) {
          const data = monthMap.get(i);
          allMonths.push({
            month: i,
            count: data?.count || 0,
            killed: data?.killed || 0,
            kidnapped: data?.kidnapped || 0,
            partial: i === currentMonth,
          });
        }
        return allMonths;
      })(),
      byDay: byDay.map((d: { _id: string; count: number; killed: number; kidnapped: number }) => ({
        date: d._id,
        count: d.count,
        killed: d.killed,
        kidnapped: d.kidnapped,
      })),
      recentAttacks,
    });

    return setCORSHeaders(response);
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return setCORSHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 })
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}
