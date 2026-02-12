import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { fetchRecentAttacks, generateAttackHash, parseTweetsWithGemini, RawAttackData } from "@/lib/gemini";
import { fetchAllRelevantTweets } from "@/lib/twitter";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Strict security: require cron secret, very low rate limit
  const securityError = applySecurityChecks(req, {
    rateLimit: 5,
    rateLimitWindow: 3600_000,
    requireCronSecret: true,
  });
  if (securityError) return securityError;

  // Schedule the heavy work to run AFTER the response is sent
  after(async () => {
    try {
      await connectDB();

      console.log("[CRON] Starting attack data update...");

      // Run both data sources in parallel
      const [geminiResult, twitterResult] = await Promise.allSettled([
        fetchRecentAttacks(),
        fetchAllRelevantTweets(),
      ]);

      // Process Gemini results
      let geminiAttacks: RawAttackData[] = [];
      if (geminiResult.status === "fulfilled") {
        geminiAttacks = geminiResult.value;
        console.log(`[CRON] Gemini returned ${geminiAttacks.length} incidents from news`);
      } else {
        console.error("[CRON] Gemini search failed:", geminiResult.reason);
      }

      // Process Twitter results — parse tweets with Gemini
      let twitterAttacks: RawAttackData[] = [];
      if (twitterResult.status === "fulfilled" && twitterResult.value.length > 0) {
        console.log(`[CRON] Twitter returned ${twitterResult.value.length} relevant tweets, parsing with Gemini...`);
        twitterAttacks = await parseTweetsWithGemini(twitterResult.value);
        console.log(`[CRON] Extracted ${twitterAttacks.length} incidents from tweets`);
      } else if (twitterResult.status === "rejected") {
        console.error("[CRON] Twitter scraping failed:", twitterResult.reason);
      } else {
        console.log("[CRON] No relevant tweets found");
      }

      // Merge both sources, Gemini news first, then Twitter
      const rawAttacks = [...geminiAttacks, ...twitterAttacks];

      console.log(`[CRON] Total: ${rawAttacks.length} potential incidents (${geminiAttacks.length} news + ${twitterAttacks.length} tweets)`);

      if (rawAttacks.length === 0) {
        console.log("[CRON] No new attacks found from any source");
        return;
      }

      let saved = 0;
      let duplicates = 0;
      let errors = 0;

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
            "location.state": {
              $regex: new RegExp(`^${escapeRegex(rawAttack.location.state)}$`, "i"),
            },
            $or: [
              {
                "location.town": {
                  $regex: new RegExp(`^${escapeRegex(rawAttack.location.town)}$`, "i"),
                },
              },
              {
                group: {
                  $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i"),
                },
              },
            ],
          }).lean();

          if (similarExists) {
            duplicates++;
            console.log(`[CRON] Similar incident exists, skipping: ${rawAttack.title}`);
            continue;
          }

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
          console.log(`[CRON] Saved: ${rawAttack.title}`);
        } catch (err: unknown) {
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code: number }).code === 11000
          ) {
            duplicates++;
          } else {
            errors++;
            console.error(`[CRON] Error saving attack:`, err);
          }
        }
      }

      console.log(
        `[CRON] Update complete — processed: ${rawAttacks.length}, saved: ${saved}, duplicates: ${duplicates}, errors: ${errors}`
      );
    } catch (error) {
      console.error("[CRON] Fatal error:", error);
    }
  });

  // Respond immediately so cron-job.org doesn't timeout
  return setCORSHeaders(
    NextResponse.json({
      message: "Update initiated — processing in background",
      timestamp: new Date().toISOString(),
    })
  );
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}

function sanitizeString(str: string): string {
  if (!str) return "";
  return str
    .replace(/[${}]/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 5000);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
