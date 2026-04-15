import Attack from "./models/Attack";
import { RawAttackData, generateAttackHash, isUsableEvidenceUrl, mergeIncidentStrategies } from "./gemini";
import { normalizeStateName } from "./normalize-state";

export interface IngestResult {
  saved: number;
  merged: number;
  errors: number;
}

function sanitizeString(str: string): string {
  if (!str) return "";
  return str.replace(/[${}]/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 5000);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUrl(url: string): string {
  return String(url || "").trim().toLowerCase().replace(/\/$/, "");
}

const TITLE_STOPWORDS = new Set([
  "attack", "attacks", "kill", "kills", "killed", "gunmen", "armed",
  "village", "bandits", "dead", "soldiers", "police", "troops",
  "people", "residents", "suspected", "abducted", "kidnapped",
  "shooting", "open", "fire", "shot", "farmers", "worshippers",
]);

/**
 * Save or merge a batch of raw attack incidents into the database.
 * Handles deduplication by hash and fuzzy location/title matching.
 * Returns counts of saved, merged, and errored incidents.
 */
export async function ingestAttacks(
  rawAttacks: RawAttackData[],
  label = "Ingest",
): Promise<IngestResult> {
  const filteredAttacks = rawAttacks.map(attack => ({
    ...attack,
    sources: (attack.sources || []).filter(source => isUsableEvidenceUrl(source.url)),
  })).filter(attack => {
    if (attack.sources.length === 0) {
      console.log(`[${label}] Skipping attack without a usable evidence URL: ${attack.title}`);
      return false;
    }
    return true;
  });

  let saved = 0, merged = 0, errors = 0;

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
          .filter((w: string) => w.length > 3 && !TITLE_STOPWORDS.has(w))
          .slice(0, 5);

        const townWords = (rawAttack.location.town || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((w: string) => w.length > 2 && !["near", "and", "the", "from", "area"].includes(w));
        const townRegex = townWords.length > 0
          ? new RegExp(townWords.map(escapeRegex).join("|"), "i")
          : null;

        existing = await Attack.findOne({
          date: { $gte: windowStart, $lte: windowEnd },
          "location.state": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.state)}$`, "i") },
          $or: [
            { "location.town": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.town)}$`, "i") } },
            ...(townRegex ? [{
              "location.town": { $regex: townRegex },
              "location.lga": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.lga || "Unknown")}$`, "i") },
            }] : []),
            {
              "location.lga": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.lga || "Unknown")}$`, "i") },
              group: { $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i") },
            },
            ...(rawAttack.casualties?.killed && rawAttack.casualties.killed > 0 ? [{
              "location.lga": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.lga || "Unknown")}$`, "i") },
              "casualties.killed": {
                $gte: Math.floor(rawAttack.casualties.killed * 0.5),
                $lte: Math.ceil(rawAttack.casualties.killed * 1.5),
              },
            }] : []),
            ...(titleWords.length >= 2 ? [{
              title: {
                $regex: new RegExp(
                  titleWords.slice(0, 3).map(w => `(?=.*${escapeRegex(w)})`).join(""),
                  "i",
                ),
              },
              group: { $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i") },
            }] : []),
            // Fallback: same state + same group + exact casualties (catches Unknown-LGA records
            // that share the same incident but were stored with different LGA precision).
            // Requires both killed AND kidnapped to be non-null to avoid false positives.
            ...(rawAttack.casualties?.killed && rawAttack.casualties.killed > 0 &&
                rawAttack.casualties?.kidnapped && rawAttack.casualties.kidnapped > 0 ? [{
              group: { $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i") },
              "casualties.killed": rawAttack.casualties.killed,
              "casualties.kidnapped": rawAttack.casualties.kidnapped,
            }] : []),
          ],
        });
      }

      // --- Broad follow-up match (no date window) ---
      // Follow-up articles about ongoing captivity/abductions can be published months
      // after the original incident. If the narrow window found nothing, do a broader
      // search for the same location + significant kidnapping count or town match.
      if (!existing) {
        const kidnapped = rawAttack.casualties?.kidnapped;
        const killed = rawAttack.casualties?.killed;
        const lga = (rawAttack.location.lga || "").trim();
        const town = (rawAttack.location.town || "").trim();
        const lgaIsKnown = lga && lga.toLowerCase() !== "unknown";
        const townIsKnown = town && town.toLowerCase() !== "unknown";

        const broadOrClauses: object[] = [];

        // Clause A: same LGA + large matching kidnap count (within 20%)
        if (lgaIsKnown && kidnapped && kidnapped >= 10) {
          broadOrClauses.push({
            "location.lga": { $regex: new RegExp(`^${escapeRegex(lga)}$`, "i") },
            "casualties.kidnapped": {
              $gte: Math.floor(kidnapped * 0.8),
              $lte: Math.ceil(kidnapped * 1.2),
            },
          });
        }

        // Clause B: same LGA + same town (exact)
        if (lgaIsKnown && townIsKnown) {
          broadOrClauses.push({
            "location.lga": { $regex: new RegExp(`^${escapeRegex(lga)}$`, "i") },
            "location.town": { $regex: new RegExp(escapeRegex(town), "i") },
          });
        }

        // Clause C: state-level large kidnapping count match (no LGA required).
        // For mass-kidnapping events (50+ victims) the count alone is distinctive
        // enough to match across records that used different location labels — e.g.
        // a military-response article stored under a different LGA/town than the
        // original attack record it is following up on.
        if (kidnapped && kidnapped >= 50) {
          broadOrClauses.push({
            "casualties.kidnapped": {
              $gte: Math.floor(kidnapped * 0.8),
              $lte: Math.ceil(kidnapped * 1.2),
            },
          });
        }

        // Clause D: same LGA + very large kidnapping event (≥ 100) with wider tolerance.
        // Initial reporting of mass kidnappings frequently diverges from final verified
        // counts by 30–40% (e.g., initial "300 abducted" later confirmed as "416 abducted").
        // Clause A's strict ±20% window misses these; this clause acts as a backstop
        // specifically for large events where count variance is expected.
        if (lgaIsKnown && kidnapped && kidnapped >= 100) {
          broadOrClauses.push({
            "location.lga": { $regex: new RegExp(`^${escapeRegex(lga)}$`, "i") },
            "casualties.kidnapped": {
              $gte: Math.floor(kidnapped * 0.6),
              $lte: Math.ceil(kidnapped * 1.4),
            },
          });
        }

        if (broadOrClauses.length > 0) {
          const broadCandidate = await Attack.findOne({
            _deleted: { $ne: true },
            "location.state": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.state)}$`, "i") },
            $or: broadOrClauses,
          }).sort({ date: 1 }); // oldest first — original incident predates re-report

          if (broadCandidate) {
            console.log(
              `[${label}] Broad follow-up match: "${rawAttack.title}" → existing "${broadCandidate.title}" (${broadCandidate.date.toISOString().slice(0, 10)}). Merging sources only.`,
            );
            // For a follow-up article we only absorb new sources — we don't overwrite
            // casualty counts or description, because the re-report may use the original
            // incident date as its "peg" and the numbers may be stale/inflated.
            const existingUrls = new Set(
              (broadCandidate.sources || []).map((s) => s.url.trim().toLowerCase().replace(/\/$/, "")),
            );
            const newSources = (rawAttack.sources || []).filter(
              (s) => s.url && !existingUrls.has(s.url.trim().toLowerCase().replace(/\/$/, "")),
            );
            if (newSources.length > 0) {
              await Attack.findByIdAndUpdate(broadCandidate._id, {
                $push: { sources: { $each: newSources } },
                $set: { updatedAt: new Date() },
              });
              console.log(`[${label}] Added ${newSources.length} new source(s) to existing incident ${broadCandidate._id}`);
            }
            merged++;
            continue;
          }
        }

        // --- Cross-state border duplicate guard ---
        // Some attacks happen at state borders and can be emitted twice with different
        // state labels. To avoid double-counting, do a strict cross-state check using
        // same town + date window and require strong corroboration.
        if (!existing && townIsKnown) {
          const crossStart = new Date(rawAttack.date);
          const crossEnd = new Date(rawAttack.date);
          if (!Number.isNaN(crossStart.getTime())) {
            crossStart.setDate(crossStart.getDate() - 1);
            crossStart.setHours(0, 0, 0, 0);
            crossEnd.setDate(crossEnd.getDate() + 1);
            crossEnd.setHours(23, 59, 59, 999);

            const crossCandidates = await Attack.find({
              _deleted: { $ne: true },
              date: { $gte: crossStart, $lte: crossEnd },
              "location.town": { $regex: new RegExp(`^${escapeRegex(town)}$`, "i") },
              "location.state": { $not: new RegExp(`^${escapeRegex(rawAttack.location.state)}$`, "i") },
            })
              .sort({ createdAt: 1 })
              .limit(10);

            if (crossCandidates.length > 0) {
              const incomingUrls = new Set(
                (rawAttack.sources || []).map((s) => normalizeUrl(s.url)).filter(Boolean),
              );

              const matched = crossCandidates.find((candidate) => {
                const existingUrls = new Set(
                  (candidate.sources || []).map((s) => normalizeUrl(s.url)).filter(Boolean),
                );
                let sharedSources = 0;
                for (const url of incomingUrls) {
                  if (existingUrls.has(url)) sharedSources++;
                }

                const candidateKilled = candidate.casualties?.killed ?? null;
                const candidateKidnapped = candidate.casualties?.kidnapped ?? null;
                const largeCasualtyAgreement =
                  !!killed &&
                  killed >= 50 &&
                  !!candidateKilled &&
                  candidateKilled >= Math.floor(killed * 0.8) &&
                  candidateKilled <= Math.ceil(killed * 1.2) &&
                  ((kidnapped ?? null) === (candidateKidnapped ?? null));

                return sharedSources >= 1 || largeCasualtyAgreement;
              });

              if (matched) {
                console.log(
                  `[${label}] Cross-state duplicate guard matched "${rawAttack.title}" with "${matched.title}" (${matched.location.state}). Merging instead of inserting.`,
                );
                const mergedUpdates = await mergeIncidentStrategies(matched.toObject(), rawAttack);
                await Attack.findByIdAndUpdate(matched._id, mergedUpdates);
                merged++;
                continue;
              }
            }
          }
        }
      }

      if (existing) {
        console.log(`[${label}] Duplicate found: "${rawAttack.title}" — merging with "${existing.title}"`);
        try {
          const mergedUpdates = await mergeIncidentStrategies(existing.toObject(), rawAttack);
          await Attack.findByIdAndUpdate(existing._id, mergedUpdates);
          merged++;
        } catch (mergeErr) {
          console.error(`[${label}] Merge failed for ${existing._id}:`, mergeErr);
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
        sources: (rawAttack.sources || []).map(s => ({
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
      console.log(`[${label}] Saved: ${rawAttack.title}`);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        merged++;
        console.log(`[${label}] Duplicate key (race condition), treating as merged`);
      } else {
        errors++;
        console.error(`[${label}] Error saving attack:`, err);
      }
    }
  }

  return { saved, merged, errors };
}
