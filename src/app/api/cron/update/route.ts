import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { fetchRecentAttacks, generateAttackHash } from "@/lib/gemini";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

export const maxDuration = 60; // Allow up to 60 seconds for this route

export async function POST(req: NextRequest) {
  // Strict security: require cron secret, very low rate limit
  const securityError = applySecurityChecks(req, {
    rateLimit: 5,
    rateLimitWindow: 3600_000, // 5 requests per hour max
    requireCronSecret: true,
  });
  if (securityError) return securityError;

  try {
    await connectDB();

    console.log("[CRON] Starting attack data update...");

    // Fetch recent attacks via Gemini with Google Search
    const rawAttacks = await fetchRecentAttacks();

    console.log(`[CRON] Gemini returned ${rawAttacks.length} potential incidents`);

    if (rawAttacks.length === 0) {
      return setCORSHeaders(
        NextResponse.json({
          message: "No new attacks found",
          processed: 0,
          duplicates: 0,
          saved: 0,
        })
      );
    }

    let saved = 0;
    let duplicates = 0;
    let errors = 0;
    const savedAttacks: string[] = [];

    for (const rawAttack of rawAttacks) {
      try {
        const hash = generateAttackHash(rawAttack);

        // Check for duplicates using hash
        const existing = await Attack.findOne({ hash }).lean();
        if (existing) {
          duplicates++;
          console.log(`[CRON] Duplicate skipped: ${rawAttack.title}`);
          continue;
        }

        // Additional dedup: check for similar attacks on the same day in the same location
        const attackDate = new Date(rawAttack.date);
        const dayStart = new Date(attackDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(attackDate);
        dayEnd.setHours(23, 59, 59, 999);

        const similarExists = await Attack.findOne({
          date: { $gte: dayStart, $lte: dayEnd },
          "location.state": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.state)}$`, "i") },
          $or: [
            { "location.town": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.town)}$`, "i") } },
            { group: { $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i") } },
          ],
        }).lean();

        if (similarExists) {
          duplicates++;
          console.log(`[CRON] Similar incident exists, skipping: ${rawAttack.title}`);
          continue;
        }

        // Validate and sanitize data before saving
        const attack = new Attack({
          title: sanitizeString(rawAttack.title),
          description: sanitizeString(rawAttack.description),
          date: new Date(rawAttack.date),
          location: {
            state: sanitizeString(rawAttack.location.state),
            lga: sanitizeString(rawAttack.location.lga || "Unknown"),
            town: sanitizeString(rawAttack.location.town || "Unknown"),
          },
          group: sanitizeString(rawAttack.group),
          casualties: {
            killed: rawAttack.casualties?.killed ?? null,
            injured: rawAttack.casualties?.injured ?? null,
            kidnapped: rawAttack.casualties?.kidnapped ?? null,
            displaced: rawAttack.casualties?.displaced ?? null,
          },
          sources: (rawAttack.sources || []).map((s) => ({
            url: sanitizeString(s.url),
            title: sanitizeString(s.title || ""),
            publisher: sanitizeString(s.publisher || ""),
          })),
          status: rawAttack.status || "unconfirmed",
          tags: (rawAttack.tags || []).map(sanitizeString),
          hash,
        });

        await attack.save();
        saved++;
        savedAttacks.push(rawAttack.title);
        console.log(`[CRON] Saved: ${rawAttack.title}`);
      } catch (err: unknown) {
        // If duplicate key error (hash collision), just skip
        if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
          duplicates++;
        } else {
          errors++;
          console.error(`[CRON] Error saving attack:`, err);
        }
      }
    }

    const summary = {
      message: "Cron update completed",
      processed: rawAttacks.length,
      saved,
      duplicates,
      errors,
      savedAttacks,
      timestamp: new Date().toISOString(),
    };

    console.log("[CRON] Update complete:", summary);

    return setCORSHeaders(NextResponse.json(summary));
  } catch (error) {
    console.error("[CRON] Fatal error:", error);
    return setCORSHeaders(
      NextResponse.json(
        { error: "Cron update failed", details: String(error) },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}

function sanitizeString(str: string): string {
  if (!str) return "";
  // Remove potential NoSQL injection patterns and control characters
  return str
    .replace(/[${}]/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 5000);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
