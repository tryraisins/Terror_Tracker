import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { checkDuplicateAttack } from "@/lib/gemini";

export const maxDuration = 300; // 5 minutes for Pro hobby, usually ignored in background unless configured

export async function GET() {
  await connectDB();

  // Fire and forget logic
  (async () => {
    try {
      console.log("Starting background duplicate check...");
      
      // Get 5 random unchecked reports
      // We use $sample to get random documents
      const candidates = await Attack.aggregate([
        { $match: { tags: { $ne: "checked_duplicate" } } },
        { $sample: { size: 5 } }
      ]);

      console.log(`Found ${candidates.length} candidates to check.`);

      for (const candidate of candidates) {
        try {
          // Find potential duplicates (same state, close date)
          // Date range: +/- 2 days to be safe
          const attackDate = new Date(candidate.date);
          const startDate = new Date(attackDate);
          startDate.setDate(startDate.getDate() - 2);
          const endDate = new Date(attackDate);
          endDate.setDate(endDate.getDate() + 2);

          const potentialMatches = await Attack.find({
            _id: { $ne: candidate._id }, // Exclude self
            "location.state": candidate.location.state,
            date: { $gte: startDate, $lte: endDate }
          }).limit(10); // Limit to 10 potential matches to avoid massive prompt

          if (potentialMatches.length === 0) {
            // No potential matches, just mark as checked
            await Attack.findByIdAndUpdate(candidate._id, {
              $addToSet: { tags: "checked_duplicate" }
            });
            console.log(`No potential matches for ${candidate._id}. Marked checked.`);
            continue;
          }

          // Compare with Gemini
          const result = await checkDuplicateAttack(candidate, potentialMatches);

          if (result.isDuplicate && result.duplicateOfId) {
            console.log(`Duplicate found for ${candidate._id}: matches ${result.duplicateOfId}`);
            
            if (result.betterReport === "existing") {
              // Existing is better, delete candidate
              await Attack.findByIdAndDelete(candidate._id);
              console.log(`Deleted candidate ${candidate._id} in favor of ${result.duplicateOfId}`);
            } else {
              // Candidate is better, delete existing
              await Attack.findByIdAndDelete(result.duplicateOfId);
              // Mark candidate as checked
              await Attack.findByIdAndUpdate(candidate._id, {
                $addToSet: { tags: "checked_duplicate" }
              });
              console.log(`Deleted existing ${result.duplicateOfId} in favor of candidate ${candidate._id}`);
            }
          } else {
            // Not a duplicate
            await Attack.findByIdAndUpdate(candidate._id, {
              $addToSet: { tags: "checked_duplicate" }
            });
            console.log(`Confirmed unique: ${candidate._id}. Marked checked.`);
          }

        } catch (innerError) {
          console.error(`Error processing candidate ${candidate._id}:`, innerError);
        }
      }
      console.log("Background duplicate check completed.");
    } catch (error) {
      console.error("Background duplicate check failed:", error);
    }
  })();

  return NextResponse.json({ 
    message: "Duplicate check initiated in background", 
    status: "processing" 
  });
}
