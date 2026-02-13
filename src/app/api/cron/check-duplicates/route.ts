import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { checkDuplicateAttack } from "@/lib/gemini";



export const maxDuration = 300; // 5 minutes (still useful for the platform, but we return early)
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const TIMEOUT_MS = 20000; // 20 seconds soft timeout to ensure response < 30s

  try {
    await connectDB();
    console.log("Starting time-boxed duplicate check...");

    // Get 5 random candidates
    const candidates = await Attack.aggregate([
      { $match: { tags: { $ne: "checked_duplicate" } } },
      { $sample: { size: 5 } }
    ]); // Removed maxTimeMS from aggregate to avoid cursor timeout issues during fetch

    console.log(`Found ${candidates.length} candidates.`);
    
    const results = [];
    let processedCount = 0;

    for (const [index, candidate] of candidates.entries()) {
      // CRITICAL: Check time budget before starting a new heavy task
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.log(`Time budget exhausted (${TIMEOUT_MS}ms). Returning early.`);
        break;
      }

      const candidateId = candidate._id;
      const candidateTitle = candidate.title; 
      console.log(`[${index + 1}/${candidates.length}] Processing: "${candidateTitle.substring(0, 40)}..."`);

      try {
        // Find potential matches
        const attackDate = new Date(candidate.date);
        const startDate = new Date(attackDate);
        startDate.setDate(startDate.getDate() - 3);
        const endDate = new Date(attackDate);
        endDate.setDate(endDate.getDate() + 3);

        const potentialMatches = await Attack.find({
          _id: { $ne: candidate._id },
          "location.state": candidate.location.state,
          date: { $gte: startDate, $lte: endDate }
        }).limit(10); 

        if (potentialMatches.length === 0) {
          await Attack.findByIdAndUpdate(candidate._id, { $addToSet: { tags: "checked_duplicate" } });
          results.push({ id: candidate._id, status: "checked_no_matches" });
          processedCount++;
          continue;
        }

        // Heavy operation: Gemini Check
        const result = await checkDuplicateAttack(candidate, potentialMatches);

        if (result.isDuplicate && result.duplicateOfId) {
          if (result.betterReport === "existing") {
            await Attack.findByIdAndDelete(candidate._id);
            results.push({ id: candidate._id, status: "deleted_duplicate", duplicateOf: result.duplicateOfId });
          } else {
            await Attack.findByIdAndDelete(result.duplicateOfId);
            await Attack.findByIdAndUpdate(candidate._id, { $addToSet: { tags: "checked_duplicate" } });
            results.push({ id: candidate._id, status: "kept_better_version", deleted: result.duplicateOfId });
          }
        } else {
          await Attack.findByIdAndUpdate(candidate._id, { $addToSet: { tags: "checked_duplicate" } });
          results.push({ id: candidate._id, status: "confirmed_unique" });
        }
        processedCount++;

      } catch (innerError) {
        console.error(`Error on candidate ${candidate._id}:`, innerError);
        results.push({ id: candidate._id, status: "error", error: String(innerError) });
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Duplicate check finished in ${duration}s. Processed ${processedCount}/${candidates.length}.`);

    return NextResponse.json({ 
      message: processedCount === candidates.length ? "Batch completed" : "Batch partial (time limit)",
      duration_seconds: duration,
      processed: processedCount,
      total_candidates: candidates.length,
      results 
    });

  } catch (error) {
    console.error("Duplicate check failed:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}
