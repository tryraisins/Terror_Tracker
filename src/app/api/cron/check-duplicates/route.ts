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

      for (const [index, candidate] of candidates.entries()) {
        const candidateId = candidate._id;
        const candidateTitle = candidate.title; 
        console.log(`[${index + 1}/${candidates.length}] Processing candidate: ${candidateId} - "${candidateTitle.substring(0, 50)}..."`);

        try {
          // Find potential duplicates (same state, close date)
          // Date range: +/- 3 days to catch delayed reports or slight date discrepancies
          const attackDate = new Date(candidate.date);
          const startDate = new Date(attackDate);
          startDate.setDate(startDate.getDate() - 3);
          const endDate = new Date(attackDate);
          endDate.setDate(endDate.getDate() + 3);
          
          console.log(`   Searching matches in ${candidate.location?.state} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})...`);

          const potentialMatches = await Attack.find({
            _id: { $ne: candidate._id }, // Exclude self
            "location.state": candidate.location.state,
            date: { $gte: startDate, $lte: endDate }
          }).limit(10); // Limit to 10 potential matches
          
          console.log(`   Found ${potentialMatches.length} potential matches.`);

          if (potentialMatches.length === 0) {
            // No potential matches, just mark as checked
            await Attack.findByIdAndUpdate(candidate._id, {
              $addToSet: { tags: "checked_duplicate" }
            });
            console.log(`   No matches. Marked ${candidate._id} as checked.`);
            continue;
          }

          // Compare with Gemini
          console.log(`   Asking Gemini to compare...`);
          const result = await checkDuplicateAttack(candidate, potentialMatches);
          console.log(`   Gemini Result: Is Duplicate? ${result.isDuplicate} (${result.reason.substring(0, 100)}...)`);

          if (result.isDuplicate && result.duplicateOfId) {
            console.log(`   DUPLICATE DETECTED! Matches existing report ${result.duplicateOfId}`);
            
            if (result.betterReport === "existing") {
              // Existing is better, delete candidate
              await Attack.findByIdAndDelete(candidate._id);
              console.log(`   ACTION: Deleted CANDIDATE ${candidate._id} in favor of existing ${result.duplicateOfId}`);
            } else {
              // Candidate is better, delete existing
              await Attack.findByIdAndDelete(result.duplicateOfId);
              // Mark candidate as checked
              await Attack.findByIdAndUpdate(candidate._id, {
                $addToSet: { tags: "checked_duplicate" }
              });
              console.log(`   ACTION: Deleted EXISTING ${result.duplicateOfId} in favor of candidate ${candidate._id}`);
            }
          } else {
            // Not a duplicate
            await Attack.findByIdAndUpdate(candidate._id, {
              $addToSet: { tags: "checked_duplicate" }
            });
            console.log(`   Confirmed UNIQUE. Marked ${candidate._id} as checked.`);
          }

        } catch (innerError) {
          console.error(`   ERROR processing candidate ${candidate._id}:`, innerError);
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
