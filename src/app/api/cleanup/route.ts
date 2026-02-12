import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

/**
 * One-time cleanup endpoint to remove incidents where only
 * terrorists/attackers were killed (no civilian or security force casualties).
 * 
 * Protected by cron secret. Call with:
 *   POST /api/cleanup
 *   Header: x-cron-secret: <your_secret>
 *   Body (optional): { "dryRun": true } to preview without deleting
 */
export async function POST(req: NextRequest) {
  const securityError = applySecurityChecks(req, {
    rateLimit: 5,
    rateLimitWindow: 3600_000,
    requireCronSecret: true,
  });
  if (securityError) return securityError;

  try {
    let dryRun = true; // Default to dry run for safety
    try {
      const body = await req.json();
      if (body.dryRun === false) dryRun = false;
    } catch {
      // No body or invalid JSON — keep dry run
    }

    await connectDB();

    // Keywords that indicate attacker-only incidents
    const attackerKeywords = [
      "terrorists killed",
      "terrorists neutralized",
      "terrorists neutralised",
      "bandits killed",
      "bandits neutralized",
      "bandits neutralised",
      "insurgents killed",
      "insurgents neutralized",
      "insurgents neutralised",
      "militants killed",
      "militants neutralized",
      "militants neutralised",
      "gunmen killed",
      "gunmen neutralized",
      "gunmen neutralised",
      "neutralized by",
      "neutralised by",
      "eliminated by",
      "troops kill",
      "troops neutralize",
      "troops neutralise",
      "military kills",
      "military neutralizes",
      "soldiers kill",
      "army kills",
      "air strikes kill",
      "airstrike kills",
      "air force kills",
      "naf strikes",
    ];

    // Build regex OR pattern for matching
    const keywordPattern = attackerKeywords
      .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const regex = new RegExp(keywordPattern, "i");

    // Find all attacks where title or description matches attacker-only patterns
    const allAttacks = await Attack.find({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
      ],
    })
      .select("title description casualties date location")
      .lean();

    // Further filter: only flag if civilian casualties are zero/null
    // If civilians were ALSO killed, we keep the incident
    const toRemove = allAttacks.filter((attack: any) => {
      const killed = attack.casualties?.killed;
      const injured = attack.casualties?.injured;
      const kidnapped = attack.casualties?.kidnapped;
      const displaced = attack.casualties?.displaced;

      // If there are civilian casualties recorded, keep it
      // (the attacker keyword might appear in the description alongside civilian losses)
      const hasCivilianCasualties =
        (killed && killed > 0) ||
        (injured && injured > 0) ||
        (kidnapped && kidnapped > 0) ||
        (displaced && displaced > 0);

      // Only remove if there are NO civilian casualties
      // Since the old data might have attacker deaths in "killed", 
      // check if the title/description strongly indicates attacker-only
      if (!hasCivilianCasualties) return true;

      // If casualties exist but the title strongly suggests attacker-only kills
      // (e.g., "30 terrorists killed by military"), also remove
      const title = (attack.title || "").toLowerCase();
      const strongAttackerOnly = [
        /^\d+\s*(terrorists?|bandits?|insurgents?|militants?|gunmen)\s*(killed|neutrali[sz]ed|eliminated)/i,
        /^(troops|military|soldiers?|army|air\s*force|naf)\s*(kill|neutrali[sz]e|eliminate)/i,
      ];

      for (const pattern of strongAttackerOnly) {
        if (pattern.test(title)) return true;
      }

      return false;
    });

    if (dryRun) {
      return setCORSHeaders(
        NextResponse.json({
          mode: "DRY RUN — nothing deleted",
          message: `Found ${toRemove.length} attacker-only incidents that would be removed`,
          incidents: toRemove.map((a: any) => ({
            id: a._id,
            title: a.title,
            date: a.date,
            location: a.location?.state,
            casualties: a.casualties,
          })),
          tip: 'Send { "dryRun": false } in the request body to actually delete them',
        })
      );
    }

    // Actually delete
    const ids = toRemove.map((a: any) => a._id);
    const result = await Attack.deleteMany({ _id: { $in: ids } });

    return setCORSHeaders(
      NextResponse.json({
        mode: "LIVE — records deleted",
        deleted: result.deletedCount,
        incidents: toRemove.map((a: any) => ({
          id: a._id,
          title: a.title,
          date: a.date,
        })),
      })
    );
  } catch (error) {
    console.error("[CLEANUP] Error:", error);
    return setCORSHeaders(
      NextResponse.json(
        { error: "Cleanup failed", details: String(error) },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}
