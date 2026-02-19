import { GoogleGenerativeAI } from "@google/generative-ai";
import Attack, { IAttack } from "./models/Attack";
import { checkDuplicateAttack, mergeIncidentStrategies } from "./gemini";

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
            matrix[i - 1][j] + 1 // deletion
          )
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
  private static DATE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

  /**
   * Find potential duplicates within a single state.
   * This is much more efficient than random sampling.
   */
  static async findDuplicatesInState(state: string): Promise<DuplicateCandidate[]> {
    console.log(`Starting duplicate scan for state: ${state}`);
    
    // 1. Fetch all attacks in this state, sorted by date
    const attacks = await Attack.find({
      "location.state": { $regex: new RegExp(`^${state}$`, "i") }, // Case-insensitive exact match
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
        
        // Time diff check
        const timeDiff = Math.abs(next.date.getTime() - current.date.getTime());
        if (timeDiff > this.DATE_WINDOW_MS) {
          // Since attacks are sorted by date, once we exceed the window, we can stop checking against 'current'
          break;
        }

        // --- Heuristics ---
        
        // A. Location Similarity (Town/LGA)
        const townSim = calculateSimilarity(
            (current.location.town || "").toLowerCase(), 
            (next.location.town || "").toLowerCase()
        );
        const lgaSim = calculateSimilarity(
            (current.location.lga || "").toLowerCase(), 
            (next.location.lga || "").toLowerCase()
        );
        
        // B. Group Similarity
        const groupSim = calculateSimilarity(
            (current.group || "").toLowerCase(),
            (next.group || "").toLowerCase()
        );
        const sameGroup = groupSim > 0.7 || 
                          current.group.toLowerCase().includes("unknown") || 
                          next.group.toLowerCase().includes("unknown") ||
                          current.group.toLowerCase().includes("gunmen") ||
                          next.group.toLowerCase().includes("gunmen");

        // C. Casualty Count Similarity (if both present)
        let casualtyScore = 1.0;
        if (current.casualties.killed !== null && next.casualties.killed !== null) {
            const k1 = current.casualties.killed || 0;
            const k2 = next.casualties.killed || 0;
            // If both are 0, match.
            if (k1 === 0 && k2 === 0) casualtyScore = 1.0;
            else if (k1 === 0 || k2 === 0) casualtyScore = 0.5; // One says 0, one says >0? Suspicious.
            else {
                // Ratio of min/max. 5 vs 6 -> 0.83. 5 vs 50 -> 0.1
                casualtyScore = Math.min(k1, k2) / Math.max(k1, k2);
            }
        }

        // --- Aggregation ---
        // If critical location mismatch (different towns with low similarity), likely not duplicates unless title implies same event.
        // But incidents in same state around same time are often confused.
        
        let score = 0;
        
        // Weigh factors
        // If towns are very similar, huge boost.
        if (townSim > 0.8 || lgaSim > 0.8) {
            score += 0.4;
        } else {
            // Towns different? Maybe one is "Unknown" or just nearby. 
            // Check descriptions (simple length check or keyword match would be better, but expensive).
            // Title similarity?
            const titleSim = calculateSimilarity(current.title.toLowerCase(), next.title.toLowerCase());
            if (titleSim > 0.6) score += 0.3;
        }

        if (sameGroup) score += 0.2;
        if (casualtyScore > 0.7) score += 0.3; // Counts match well

        // Date proximity boost
        // Same day = +0.1
        if (timeDiff < 24 * 60 * 60 * 1000) score += 0.1;

        // Threshold to consider sending to LLM
        if (score >= 0.6) {
             candidates.push({
                 reportA: current,
                 reportB: next,
                 heuristicScore: score,
                 reason: `Score: ${score.toFixed(2)} (Town: ${townSim.toFixed(2)}, Group: ${groupSim.toFixed(2)}, Cas: ${casualtyScore.toFixed(2)})`
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
  static async processDuplicates(duplicates: DuplicateCandidate[]): Promise<any[]> {
    const results = [];
    
    // Track IDs that have already been merged-away in this run
    // so we never process a stale pair.
    const deletedIds = new Set<string>();
    
    // Sort by highest heuristic score first to catch obvious ones
    duplicates.sort((a, b) => b.heuristicScore - a.heuristicScore);
    
    // Limit to top 20 to avoid timeouts/rate limits in one run
    const batch = duplicates.slice(0, 20); 

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
            const geminiResult = await checkDuplicateAttack(reportA.toObject(), [reportB.toObject()]);
            
            if (geminiResult.isDuplicate) {
                console.log(`CONFIRMED DUPLICATE: ${reportA.title} vs ${reportB.title}`);
                
                // Decide which record is the primary (kept) and which is secondary (absorbed).
                // Gemini treats arg1 as candidate, arg2 as existing.
                // "existing" means B is better → keep B as primary.
                const primary   = geminiResult.betterReport === "existing" ? reportB : reportA;
                const secondary = geminiResult.betterReport === "existing" ? reportA : reportB;
                
                // Merge the secondary's data into the primary
                const mergedFields = await mergeIncidentStrategies(
                    primary.toObject(),
                    secondary.toObject()
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
                
                const log = `Merged ${String(secondary._id)} → ${String(primary._id)} | ` +
                    `Sources: ${mergedFields.sources.length} | ` +
                    `Killed: ${mergedFields.casualties.killed}, ` +
                    `Injured: ${mergedFields.casualties.injured}`;
                
                results.push({
                    type: "MERGE",
                    details: log,
                    primaryId: String(primary._id),
                    removedId: String(secondary._id),
                    score: item.heuristicScore
                });
            } else {
                results.push({
                    type: "NO_DUPLICATE",
                    details: `Gemini said different: ${geminiResult.reason}`,
                    score: item.heuristicScore
                });
            }
        } catch (err) {
            console.error("Gemini check failed for pair", err);
        }
    }
    return results;
  }
}
