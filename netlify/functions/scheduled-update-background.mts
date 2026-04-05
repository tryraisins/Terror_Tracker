import type { Config, BackgroundHandler } from "@netlify/functions";
import connectDB from "../../src/lib/db";
import Attack from "../../src/lib/models/Attack";
import {
  fetchRecentAttacks,
  generateAttackHash,
  mergeIncidentStrategies,
} from "../../src/lib/gemini";
import { normalizeStateName } from "../../src/lib/normalize-state";

// Every hour
export const config: Config = {
  schedule: "0 * * * *",
};

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

const handler: BackgroundHandler = async () => {
  try {
    await connectDB();

    console.log("[Scheduled Update] Starting attack data update...");

    const rawAttacks = await fetchRecentAttacks();
    console.log(
      `[Scheduled Update] Gemini returned ${rawAttacks.length} potential incidents`,
    );

    if (rawAttacks.length === 0) {
      console.log("[Scheduled Update] No new attacks found");
      return;
    }

    const filteredAttacks = rawAttacks.filter((attack) => {
      if (attack.civilianCasualties === false) {
        console.log(
          `[Scheduled Update] Skipping attacker-only incident: ${attack.title}`,
        );
        return false;
      }
      const { killed, injured, kidnapped, displaced } =
        attack.casualties || {};
      const hasCasualties =
        (killed && killed > 0) ||
        (injured && injured > 0) ||
        (kidnapped && kidnapped > 0) ||
        (displaced && displaced > 0);
      if (!hasCasualties && attack.status === "developing") return true;
      return true;
    });

    console.log(
      `[Scheduled Update] After filtering: ${filteredAttacks.length} incidents (removed ${rawAttacks.length - filteredAttacks.length} attacker-only incidents)`,
    );

    let saved = 0;
    let merged = 0;
    let errors = 0;

    for (const rawAttack of filteredAttacks) {
      try {
        const hash = generateAttackHash(rawAttack);
        let existing = await Attack.findOne({ hash });

        if (!existing) {
          const attackDate = new Date(rawAttack.date);
          const windowStart = new Date(attackDate);
          windowStart.setDate(windowStart.getDate() - 2);
          windowStart.setHours(0, 0, 0, 0);
          const windowEnd = new Date(attackDate);
          windowEnd.setDate(windowEnd.getDate() + 2);
          windowEnd.setHours(23, 59, 59, 999);

          const titleWords = rawAttack.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w: string) => w.length > 3)
            .slice(0, 5);

          const townWords = (rawAttack.location.town || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(
              (w: string) =>
                w.length > 2 &&
                !["near", "and", "the", "from", "area"].includes(w),
            );
          const townRegex =
            townWords.length > 0
              ? new RegExp(townWords.map(escapeRegex).join("|"), "i")
              : null;

          existing = await Attack.findOne({
            date: { $gte: windowStart, $lte: windowEnd },
            "location.state": {
              $regex: new RegExp(
                `^${escapeRegex(rawAttack.location.state)}$`,
                "i",
              ),
            },
            $or: [
              {
                "location.town": {
                  $regex: new RegExp(
                    `^${escapeRegex(rawAttack.location.town)}$`,
                    "i",
                  ),
                },
              },
              ...(townRegex
                ? [
                    {
                      "location.town": { $regex: townRegex },
                      "location.lga": {
                        $regex: new RegExp(
                          `^${escapeRegex(rawAttack.location.lga || "Unknown")}$`,
                          "i",
                        ),
                      },
                    },
                  ]
                : []),
              {
                "location.lga": {
                  $regex: new RegExp(
                    `^${escapeRegex(rawAttack.location.lga || "Unknown")}$`,
                    "i",
                  ),
                },
                group: {
                  $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i"),
                },
              },
              ...(rawAttack.casualties?.killed && rawAttack.casualties.killed > 0
                ? [
                    {
                      "location.lga": {
                        $regex: new RegExp(
                          `^${escapeRegex(rawAttack.location.lga || "Unknown")}$`,
                          "i",
                        ),
                      },
                      "casualties.killed": {
                        $gte: Math.floor(rawAttack.casualties.killed * 0.5),
                        $lte: Math.ceil(rawAttack.casualties.killed * 1.5),
                      },
                    },
                  ]
                : []),
              ...(titleWords.length >= 2
                ? [
                    {
                      title: {
                        $regex: new RegExp(
                          titleWords.slice(0, 3).join("|"),
                          "i",
                        ),
                      },
                      group: {
                        $regex: new RegExp(
                          `^${escapeRegex(rawAttack.group)}$`,
                          "i",
                        ),
                      },
                    },
                  ]
                : []),
            ],
          });
        }

        if (existing) {
          console.log(
            `[Scheduled Update] Duplicate found: "${rawAttack.title}". Merging with "${existing.title}"...`,
          );
          try {
            const mergedUpdates = await mergeIncidentStrategies(
              existing.toObject(),
              rawAttack,
            );
            await Attack.findByIdAndUpdate(existing._id, mergedUpdates);
            merged++;
            console.log(`[Scheduled Update] Merged: ${existing._id}`);
          } catch (mergeErr) {
            console.error(
              `[Scheduled Update] Merge failed for ${existing._id}:`,
              mergeErr,
            );
          }
          continue;
        }

        const attack = new Attack({
          title: sanitizeString(rawAttack.title),
          description: sanitizeString(rawAttack.description),
          date: new Date(rawAttack.date),
          location: {
            state: normalizeStateName(sanitizeString(rawAttack.location.state)),
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
        console.log(`[Scheduled Update] Saved: ${rawAttack.title}`);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: number }).code === 11000
        ) {
          merged++;
          console.log(
            `[Scheduled Update] Duplicate key error on save (race condition)`,
          );
        } else {
          errors++;
          console.error(`[Scheduled Update] Error saving attack:`, err);
        }
      }
    }

    console.log(
      `[Scheduled Update] Complete — fetched: ${rawAttacks.length}, filtered: ${filteredAttacks.length}, saved: ${saved}, merged: ${merged}, errors: ${errors}`,
    );
  } catch (error) {
    console.error("[Scheduled Update] Fatal error:", error);
  }
};

export { handler };
