import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";
import { getTrendEligibility } from "@/lib/trend-eligibility";

const NIGERIA_TIMEZONE = "Africa/Lagos";

function nigeriaCalendarPart(date: Date, part: "year" | "month"): number {
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
    const trendEligibility = await getTrendEligibility();

    const now = new Date();
    const nigeriaYear = nigeriaCalendarPart(now, "year");
    const nigeriaMonth = nigeriaCalendarPart(now, "month");
    // Nigeria is UTC+1 year-round. This makes the dashboard's year filter use
    // the same calendar boundary as its Nigeria-focused incident reporting.
    const startOfYear = new Date(`${nigeriaYear}-01-01T00:00:00.000+01:00`);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Exclude soft-deleted records from all queries
    const active = { _deleted: { $ne: true } };

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
      recentAttacks,
    ] = await Promise.all([
      // Total attacks this year
      Attack.countDocuments({ ...active, date: { $gte: startOfYear } }),

      // Total killed
      Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.killed" } } },
      ]),

      // Total injured
      Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.injured" } } },
      ]),

      // Total kidnapped
      Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.kidnapped" } } },
      ]),

      Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.displaced" } } },
      ]),

      // Attacks in last 30 days
      Attack.countDocuments({ ...active, date: { $gte: thirtyDaysAgo } }),

      // Attacks in last 7 days
      Attack.countDocuments({ ...active, date: { $gte: sevenDaysAgo } }),

      // Attacks by state (top 10)
      trendEligibility.eligible ? Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        { $group: { _id: "$location.state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]) : Promise.resolve([]),

      // Attacks by group
      Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        { $group: { _id: "$group", count: { $sum: 1 }, killed: { $sum: "$casualties.killed" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Attacks by month
      trendEligibility.eligible ? Attack.aggregate([
        { $match: { ...active, date: { $gte: startOfYear } } },
        {
          $group: {
            _id: { $month: { date: "$date", timezone: NIGERIA_TIMEZONE } },
            count: { $sum: 1 },
            killed: { $sum: "$casualties.killed" },
            kidnapped: { $sum: "$casualties.kidnapped" },
          },
        },
        { $sort: { _id: 1 } },
      ]) : Promise.resolve([]),

      // 5 most recent attacks
      Attack.find(active)
        .sort({ date: -1 })
        .limit(5)
        .select("title date location group casualties status sources")
        .lean(),

    ]);

    const response = NextResponse.json({
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
        if (!trendEligibility.eligible) return [];
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
          });
        }
        return allMonths;
      })(),
      trendEligibility,
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
