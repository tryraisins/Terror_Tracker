import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

export async function GET(req: NextRequest) {
  const securityError = applySecurityChecks(req, {
    rateLimit: 60,
    rateLimitWindow: 60_000,
  });
  if (securityError) return securityError;

  try {
    await connectDB();

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalAttacks,
      totalKilled,
      totalInjured,
      totalKidnapped,
      attacksLast30Days,
      attacksLast7Days,
      byState,
      byGroup,
      byMonth,
      recentAttacks,
    ] = await Promise.all([
      // Total attacks this year
      Attack.countDocuments({ date: { $gte: startOfYear } }),

      // Total killed
      Attack.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.killed" } } },
      ]),

      // Total injured
      Attack.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.injured" } } },
      ]),

      // Total kidnapped
      Attack.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$casualties.kidnapped" } } },
      ]),

      // Attacks in last 30 days
      Attack.countDocuments({ date: { $gte: thirtyDaysAgo } }),

      // Attacks in last 7 days
      Attack.countDocuments({ date: { $gte: sevenDaysAgo } }),

      // Attacks by state (top 10)
      Attack.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: "$location.state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Attacks by group
      Attack.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        { $group: { _id: "$group", count: { $sum: 1 }, killed: { $sum: "$casualties.killed" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Attacks by month
      Attack.aggregate([
        { $match: { date: { $gte: startOfYear } } },
        {
          $group: {
            _id: { $month: "$date" },
            count: { $sum: 1 },
            killed: { $sum: "$casualties.killed" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 5 most recent attacks
      Attack.find({})
        .sort({ date: -1 })
        .limit(5)
        .select("title date location group casualties status")
        .lean(),
    ]);

    const response = NextResponse.json({
      overview: {
        totalAttacks,
        totalKilled: totalKilled[0]?.total || 0,
        totalInjured: totalInjured[0]?.total || 0,
        totalKidnapped: totalKidnapped[0]?.total || 0,
        attacksLast30Days,
        attacksLast7Days,
        year: now.getFullYear(),
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
      byMonth: byMonth.map(
        (m: { _id: number; count: number; killed: number }) => ({
          month: m._id,
          count: m.count,
          killed: m.killed,
        })
      ),
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
