import Attack, { IAttack } from "./models/Attack";
import { checkDuplicateAttack, mergeIncidentStrategies } from "./gemini";
import { normalizeStateName, statesMatch } from "./normalize-state";

// --- Utility: Levenshtein Distance for simple fuzzy matching ---
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  let i, j;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - levenshteinDistance(longer, shorter)) / longerLength;
}

// --- Utility: Check if a location value is effectively unknown ---
function isUnknownLocation(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  return v === "" || v === "unknown" || v === "n/a" || v === "unspecified";
}

// --- Utility: Check if one town name is an alias/contains the other ---
// Handles cases like "Dutsin Dan Ajiya (Tungan Dutse)" vs "Tungan Dutse"
// and comma-separated multi-town fields like "Wanka, Kyaram, Gyambau"
// and parenthetical proximity like "Garga (near Wanka)" vs "Wanka"
function townNamesOverlap(town1: string, town2: string): boolean {
  const t1 = town1.toLowerCase().trim();
  const t2 = town2.toLowerCase().trim();
  if (!t1 || !t2) return false;
  // One fully contains the other
  if (t1.includes(t2) || t2.includes(t1)) return true;

  // Word-level token overlap: split on commas, spaces, and parens, then check
  // if any significant place-name word (>2 chars) appears in both strings.
  // This catches "Garga (near Wanka)" vs "Wanka, Kyaram, Gyambau" via shared "wanka".
  const FILLER = new Set(["near", "and", "the", "from", "area", "along", "road"]);
  const tokenize = (s: string): Set<string> =>
    new Set(
      s.replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !FILLER.has(w)),
    );
  const tokens1 = tokenize(t1);
  const tokens2 = tokenize(t2);
  for (const token of tokens1) {
    if (tokens2.has(token)) return true;
  }

  // Check if any parenthetical alias matches via fuzzy similarity
  const extractAliases = (t: string): string[] => {
    const aliases: string[] = [t.replace(/\s*\(.*\)\s*/g, "").trim()];
    const parenMatch = t.match(/\(([^)]+)\)/);
    if (parenMatch) aliases.push(parenMatch[1].trim());
    return aliases.filter((a) => a.length > 0);
  };
  const aliases1 = extractAliases(t1);
  const aliases2 = extractAliases(t2);
  for (const a1 of aliases1) {
    for (const a2 of aliases2) {
      if (a1 === a2 || a1.includes(a2) || a2.includes(a1)) return true;
      if (calculateSimilarity(a1, a2) > 0.75) return true;
    }
  }
  return false;
}

// --- Utility: Extract meaningful keywords from text ---
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "in",
  "on",
  "at",
  "of",
  "to",
  "and",
  "or",
  "is",
  "are",
  "was",
  "were",
  "by",
  "for",
  "from",
  "with",
  "as",
  "that",
  "this",
  "it",
  "its",
  "be",
  "has",
  "had",
  "have",
  "not",
  "but",
  "who",
  "which",
  "their",
  "they",
  "them",
  "been",
  "into",
  "also",
  "over",
  "during",
  "after",
  "before",
  "about",
  "between",
  "through",
  "including",
  "reportedly",
  "approximately",
  "several",
  "area",
  "local",
  "government",
  "state",
  "nigeria",
  "nigerian",
]);

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

function keywordOverlapScore(text1: string, text2: string): number {
  const kw1 = extractKeywords(text1);
  const kw2 = extractKeywords(text2);
  if (kw1.size === 0 || kw2.size === 0) return 0;
  let overlap = 0;
  for (const w of kw1) {
    if (kw2.has(w)) overlap++;
  }
  const minSize = Math.min(kw1.size, kw2.size);
  return overlap / minSize;
}

// --- Logic ---

interface DuplicateCandidate {
  reportA: IAttack;
  reportB: IAttack;
  heuristicScore: number;
  reason: string;
}

/**
 * Advanced Duplicate Checker Service
 * Iterates through attacks in a specific state to find duplicates using a sliding window.
 */
export class DuplicateCheckerService {
  private static DATE_WINDOW_MS = 8 * 24 * 60 * 60 * 1000; // 8 days (aligned with COMPARISON_WINDOW_MS)
  private static COMPARISON_WINDOW_MS = 8 * 24 * 60 * 60 * 1000; // 8 days for comparison window
  private static SCORE_THRESHOLD = 0.4; // lowered from 0.5 — Gemini confirmation still gates merges

  /**
   * Shared heuristic scoring logic used by both cron and manual paths.
   * Returns { score, reason } or null if the pair should be skipped.
   */
  private static computeHeuristicScore(
    incA: IAttack,
    incB: IAttack,
  ): { score: number; reason: string } | null {
    const timeDiff = Math.abs(incA.date.getTime() - incB.date.getTime());
    if (timeDiff > this.COMPARISON_WINDOW_MS) return null;

    // State check using normalized comparison (handles "Borno State" vs "Borno", etc.)
    if (!statesMatch(incA.location.state, incB.location.state)) return null;

    const townA = (incA.location.town || "").toLowerCase();
    const townB = (incB.location.town || "").toLowerCase();
    const lgaA = (incA.location.lga || "").toLowerCase();
    const lgaB = (incB.location.lga || "").toLowerCase();

    const townUnknownA = isUnknownLocation(incA.location.town);
    const townUnknownB = isUnknownLocation(incB.location.town);
    const lgaUnknownA = isUnknownLocation(incA.location.lga);
    const lgaUnknownB = isUnknownLocation(incB.location.lga);

    // --- Location scoring ---
    let locationScore = 0;
    let locationDetail = "";

    if (!townUnknownA && !townUnknownB) {
      // Both have real town names
      const townSim = calculateSimilarity(townA, townB);
      const aliasMatch = townNamesOverlap(
        incA.location.town || "",
        incB.location.town || "",
      );
      if (aliasMatch || townSim > 0.75) {
        locationScore = 0.4;
        locationDetail = `town-match(${aliasMatch ? "alias" : townSim.toFixed(2)})`;
      } else if (townSim > 0.5) {
        locationScore = 0.2;
        locationDetail = `town-partial(${townSim.toFixed(2)})`;
      }
    } else if (townUnknownA || townUnknownB) {
      // One or both towns are unknown — check LGA instead, don't penalize
      if (!lgaUnknownA && !lgaUnknownB) {
        const lgaSim = calculateSimilarity(lgaA, lgaB);
        if (lgaSim > 0.75) {
          locationScore = 0.3;
          locationDetail = `lga-match(${lgaSim.toFixed(2)})`;
        }
      }
      // If both town AND lga are unknown, location is neutral (0)
      if (locationScore === 0) {
        locationDetail = "location-unknown";
      }
    }

    // LGA bonus (when towns already matched but LGA also matches)
    if (locationScore > 0 && !lgaUnknownA && !lgaUnknownB) {
      const lgaSim = calculateSimilarity(lgaA, lgaB);
      if (lgaSim > 0.75) {
        locationScore = Math.min(locationScore + 0.1, 0.5);
      }
    }

    // LGA fallback: if both towns are known but didn't match, a matching LGA
    // still means they're in the same area (e.g., different villages in Kanam LGA)
    if (locationScore === 0 && !lgaUnknownA && !lgaUnknownB) {
      const lgaSim = calculateSimilarity(lgaA, lgaB);
      if (lgaSim > 0.85) {
        locationScore = 0.25;
        locationDetail = `lga-fallback(${lgaSim.toFixed(2)})`;
      }
    }

    // --- Group scoring ---
    const groupSim = calculateSimilarity(
      (incA.group || "").toLowerCase(),
      (incB.group || "").toLowerCase(),
    );
    const gA = incA.group.toLowerCase();
    const gB = incB.group.toLowerCase();
    const sameGroup =
      groupSim > 0.6 ||
      gA.includes("unknown") || gB.includes("unknown") ||
      gA.includes("unidentified") || gB.includes("unidentified") ||
      gA.includes("gunmen") || gB.includes("gunmen") ||
      gA.includes("armed men") || gB.includes("armed men") ||
      gA.includes("armed group") || gB.includes("armed group") ||
      gA.includes("suspected") || gB.includes("suspected") ||
      // Both contain "bandit" anywhere
      (gA.includes("bandit") && gB.includes("bandit")) ||
      // Both contain "militant" anywhere
      (gA.includes("militant") && gB.includes("militant"));
    const groupScore = sameGroup ? 0.15 : 0;

    // --- Casualty scoring --- (relaxed threshold)
    let casualtyScore = 0;
    const k1 = incA.casualties.killed ?? 0;
    const k2 = incB.casualties.killed ?? 0;
    if (k1 === 0 && k2 === 0) {
      casualtyScore = 0.1; // both zero, weak signal
    } else if (k1 === 0 || k2 === 0) {
      casualtyScore = 0.05; // one zero, one not — uncertain
    } else {
      const ratio = Math.min(k1, k2) / Math.max(k1, k2);
      if (ratio > 0.5)
        casualtyScore = 0.2; // e.g. 30 vs 50 = 0.6
      else if (ratio > 0.3) casualtyScore = 0.1;
    }

    // --- Title keyword overlap ---
    const titleOverlap = keywordOverlapScore(incA.title, incB.title);
    const titleScore = titleOverlap > 0.5 ? 0.2 : titleOverlap > 0.3 ? 0.1 : 0;

    // --- Title string similarity (catches near-identical titles) ---
    const titleStringSim = calculateSimilarity(
      incA.title.toLowerCase(),
      incB.title.toLowerCase(),
    );
    const titleSimBonus = titleStringSim > 0.85 ? 0.25 : titleStringSim > 0.7 ? 0.15 : 0;

    // --- Description keyword overlap ---
    const descOverlap = keywordOverlapScore(
      incA.description || "",
      incB.description || "",
    );
    const descScore = descOverlap > 0.4 ? 0.15 : descOverlap > 0.25 ? 0.08 : 0;

    // --- Source URL overlap (shared sources = strong duplicate signal) ---
    let sourceOverlapScore = 0;
    const urlsA = new Set((incA.sources || []).map(s => s.url?.trim().replace(/\/$/, "").toLowerCase()).filter(Boolean));
    const urlsB = new Set((incB.sources || []).map(s => s.url?.trim().replace(/\/$/, "").toLowerCase()).filter(Boolean));
    if (urlsA.size > 0 && urlsB.size > 0) {
      let sharedUrls = 0;
      for (const url of urlsA) {
        if (urlsB.has(url)) sharedUrls++;
      }
      if (sharedUrls > 0) sourceOverlapScore = 0.3; // Shared source URL is very strong signal
    }

    // --- Date proximity bonus ---
    const dayMs = 24 * 60 * 60 * 1000;
    const dateScore = timeDiff < dayMs ? 0.1 : timeDiff < 2 * dayMs ? 0.05 : 0;

    // --- Aggregate ---
    const score =
      locationScore +
      groupScore +
      casualtyScore +
      titleScore +
      titleSimBonus +
      descScore +
      sourceOverlapScore +
      dateScore;

    const reason =
      `Score: ${score.toFixed(2)} (` +
      `Loc: ${locationScore.toFixed(2)} [${locationDetail}], ` +
      `Grp: ${groupScore.toFixed(2)}, ` +
      `Cas: ${casualtyScore.toFixed(2)} [${k1}v${k2}], ` +
      `Title: ${titleScore.toFixed(2)} [kw:${titleOverlap.toFixed(2)}, sim:${titleStringSim.toFixed(2)}+${titleSimBonus.toFixed(2)}], ` +
      `Desc: ${descScore.toFixed(2)} [${descOverlap.toFixed(2)}], ` +
      `Src: ${sourceOverlapScore.toFixed(2)}, ` +
      `Date: ${dateScore.toFixed(2)})`;

    return { score, reason };
  }

  /**
   * Find duplicates for all incidents created since `sinceDate`.
   * For each new incident, compare against other incidents in the same state
   * whose date falls within an 8-day window of the new incident's date.
   * Returns results grouped by state for logging.
   */
  static async findDuplicatesForRecentIncidents(
    sinceDate: Date,
  ): Promise<{ state: string; candidates: DuplicateCandidate[] }[]> {
    // 1. Fetch all incidents added since the last run
    const newIncidents = await Attack.find({
      createdAt: { $gte: sinceDate },
    }).sort({ date: 1 });

    console.log(
      `[Duplicate Check] Found ${newIncidents.length} new incident(s) since ${sinceDate.toISOString()}`,
    );

    if (newIncidents.length === 0) {
      return [];
    }

    // 2. Group new incidents by normalized state
    const byState = new Map<string, IAttack[]>();
    for (const inc of newIncidents) {
      const st = normalizeStateName(inc.location.state || "");
      if (!st || st === "Unknown") continue;
      if (!byState.has(st)) byState.set(st, []);
      byState.get(st)!.push(inc);
    }

    const results: { state: string; candidates: DuplicateCandidate[] }[] = [];

    // 3. For each state with new incidents, fetch the comparison window and run heuristics
    for (const [state, stateNewIncidents] of byState) {
      console.log(
        `[Duplicate Check] Checking ${stateNewIncidents.length} new incident(s) in ${state}`,
      );

      // Determine the broadest date range we need for comparison candidates
      const earliestDate = new Date(
        Math.min(...stateNewIncidents.map((i) => i.date.getTime())) -
          this.COMPARISON_WINDOW_MS,
      );
      const latestDate = new Date(
        Math.max(...stateNewIncidents.map((i) => i.date.getTime())) +
          this.COMPARISON_WINDOW_MS,
      );

      // Fetch all incidents in this state within the broad date range
      // Match both the canonical name and common variants (e.g., "Borno" also matches "Borno State")
      const stateRegex = new RegExp(`^${state}(\\s+State)?$`, "i");
      const stateIncidents = await Attack.find({
        "location.state": { $regex: stateRegex },
        date: { $gte: earliestDate, $lte: latestDate },
      }).sort({ date: 1 });

      const candidates: DuplicateCandidate[] = [];
      const seenPairs = new Set<string>(); // avoid duplicate pairs

      // 4. Compare each new incident against all incidents in the window
      for (const newInc of stateNewIncidents) {
        const newId = String(newInc._id);

        for (const existing of stateIncidents) {
          const existingId = String(existing._id);

          // Skip self-comparison
          if (newId === existingId) continue;

          // Skip already-seen pair (regardless of order)
          const pairKey =
            newId < existingId
              ? `${newId}:${existingId}`
              : `${existingId}:${newId}`;
          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          // Use shared heuristic scoring
          const result = this.computeHeuristicScore(newInc, existing);
          if (!result) continue;

          if (result.score >= this.SCORE_THRESHOLD) {
            candidates.push({
              reportA: newInc,
              reportB: existing,
              heuristicScore: result.score,
              reason: result.reason,
            });
          }
        }
      }

      console.log(
        `[Duplicate Check] Found ${candidates.length} potential duplicate pair(s) in ${state}`,
      );
      if (candidates.length > 0) {
        results.push({ state, candidates });
      }
    }

    return results;
  }

  /**
   * Find potential duplicates within a single state.
   * This is much more efficient than random sampling.
   */
  static async findDuplicatesInState(
    state: string,
  ): Promise<DuplicateCandidate[]> {
    const normalized = normalizeStateName(state);
    console.log(`Starting duplicate scan for state: ${normalized}`);

    // 1. Fetch all attacks in this state (including variants like "Borno State"), sorted by date
    const stateRegex = new RegExp(`^${normalized}(\\s+State)?$`, "i");
    const attacks = await Attack.find({
      "location.state": { $regex: stateRegex },
    }).sort({ date: 1 });

    if (attacks.length < 2) {
      console.log(`Not enough attacks in ${state} to compare.`);
      return [];
    }

    const candidates: DuplicateCandidate[] = [];

    // 2. Sliding Window Comparison
    // We only need to compare attack[i] with subsequent attacks that are within the time window.
    for (let i = 0; i < attacks.length; i++) {
      const current = attacks[i];

      for (let j = i + 1; j < attacks.length; j++) {
        const next = attacks[j];

        // Time diff check — early exit since attacks are sorted by date
        const timeDiff = Math.abs(next.date.getTime() - current.date.getTime());
        if (timeDiff > this.DATE_WINDOW_MS) {
          break;
        }

        // Use shared heuristic scoring
        const result = this.computeHeuristicScore(current, next);
        if (!result) continue;

        if (result.score >= this.SCORE_THRESHOLD) {
          candidates.push({
            reportA: current,
            reportB: next,
            heuristicScore: result.score,
            reason: result.reason,
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Process a batch of duplicates using Gemini to confirm, then MERGE
   * instead of deleting. The primary (kept) record absorbs:
   *   - All unique sources from both reports
   *   - The higher casualty count for each field
   *   - An AI-consolidated description
   */
  static async processDuplicates(
    duplicates: DuplicateCandidate[],
  ): Promise<any[]> {
    const results = [];

    // Track IDs that have already been merged-away in this run
    // so we never process a stale pair.
    const deletedIds = new Set<string>();

    // Sort by highest heuristic score first to catch obvious ones
    duplicates.sort((a, b) => b.heuristicScore - a.heuristicScore);

    // Limit to top 5 to stay well within the 5-minute serverless timeout.
    // Each pair needs ~2 Gemini calls (confirm + merge desc).
    // Remaining pairs will be caught on the next cron run.
    const batch = duplicates.slice(0, 5);

    for (const item of batch) {
      const { reportA, reportB } = item;

      // Skip if either report was already consumed by a previous merge
      const idA = String(reportA._id);
      const idB = String(reportB._id);
      if (deletedIds.has(idA) || deletedIds.has(idB)) {
        continue;
      }

      try {
        // Ask Gemini whether the pair is truly the same incident
        const geminiResult = await checkDuplicateAttack(reportA.toObject(), [
          reportB.toObject(),
        ]);

        if (geminiResult.isDuplicate) {
          console.log(
            `CONFIRMED DUPLICATE: ${reportA.title} vs ${reportB.title}`,
          );

          // Decide which record is the primary (kept) and which is secondary (absorbed).
          // Gemini treats arg1 as candidate, arg2 as existing.
          // "existing" means B is better → keep B as primary.
          const primary =
            geminiResult.betterReport === "existing" ? reportB : reportA;
          const secondary =
            geminiResult.betterReport === "existing" ? reportA : reportB;

          // Merge the secondary's data into the primary
          const mergedFields = await mergeIncidentStrategies(
            primary.toObject(),
            secondary.toObject(),
          );

          // Apply merged fields to the primary record
          await Attack.findByIdAndUpdate(primary._id, {
            $set: {
              description: mergedFields.description,
              casualties: mergedFields.casualties,
              sources: mergedFields.sources,
              status: mergedFields.status,
            },
          });

          // Remove the secondary (its data is now preserved in primary)
          await Attack.findByIdAndDelete(secondary._id);
          deletedIds.add(String(secondary._id));

          const log =
            `Merged ${String(secondary._id)} → ${String(primary._id)} | ` +
            `Sources: ${mergedFields.sources.length} | ` +
            `Killed: ${mergedFields.casualties.killed}, ` +
            `Injured: ${mergedFields.casualties.injured}`;

          results.push({
            type: "MERGE",
            details: log,
            primaryId: String(primary._id),
            removedId: String(secondary._id),
            score: item.heuristicScore,
          });
        } else {
          results.push({
            type: "NO_DUPLICATE",
            details: `Gemini said different: ${geminiResult.reason}`,
            score: item.heuristicScore,
          });
        }
      } catch (err) {
        console.error("Gemini check failed for pair", err);
      }
    }
    return results;
  }
}
