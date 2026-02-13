import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { checkDuplicateAttack } from "@/lib/gemini";


export const maxDuration = 300; // 5 minutes

export async function GET() {
  try {
    await connectDB();
    console.log("Starting duplicate check (synchronous mode)...");

    // Get 5 random unchecked reports
    // We use $sample to get random documents
    // Added maxTimeMS to fail fast if DB is hanging
    const candidates = await Attack.aggregate([
      { $match: { tags: { $ne: "checked_duplicate" } } },
      { $sample: { size: 5 } }
    ]).option({ maxTimeMS: 15000 }); 

    console.log(`Found ${candidates.length} candidates to check.`);
    
    const results = [];

    for (const [index, candidate] of candidates.entries()) {
      const candidateId = candidate._id;
      const candidateTitle = candidate.title; 
      console.log(`[${index + 1}/${candidates.length}] Processing candidate: ${candidateId} - "${candidateTitle.substring(0, 50)}..."`);

      try {
        // Find potential matches
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
        }).limit(10).maxTimeMS(10000); 
        
        console.log(`   Found ${potentialMatches.length} potential matches.`);

        if (potentialMatches.length === 0) {
          await Attack.findByIdAndUpdate(candidate._id, {
            $addToSet: { tags: "checked_duplicate" }
          });
          console.log(`   No matches. Marked ${candidate._id} as checked.`);
          results.push({ id: candidate._id, status: "checked_no_matches" });
          continue;
        }

        // Compare with Gemini
        console.log(`   Asking Gemini to compare...`);
        const result = await checkDuplicateAttack(candidate, potentialMatches);
        console.log(`   Gemini Result: Is Duplicate? ${result.isDuplicate} (${result.reason.substring(0, 100)}...)`);

        if (result.isDuplicate && result.duplicateOfId) {
          if (result.betterReport === "existing") {
            await Attack.findByIdAndDelete(candidate._id);
            console.log(`   ACTION: Deleted CANDIDATE ${candidate._id} in favor of existing ${result.duplicateOfId}`);
            results.push({ id: candidate._id, status: "deleted_duplicate", duplicateOf: result.duplicateOfId });
          } else {
            await Attack.findByIdAndDelete(result.duplicateOfId);
            await Attack.findByIdAndUpdate(candidate._id, {
              $addToSet: { tags: "checked_duplicate" }
            });
            console.log(`   ACTION: Deleted EXISTING ${result.duplicateOfId} in favor of candidate ${candidate._id}`);
            results.push({ id: candidate._id, status: "kept_better_version", deleted: result.duplicateOfId });
          }
        } else {
          await Attack.findByIdAndUpdate(candidate._id, {
            $addToSet: { tags: "checked_duplicate" }
          });
          console.log(`   Confirmed UNIQUE. Marked ${candidate._id} as checked.`);
          results.push({ id: candidate._id, status: "confirmed_unique" });
        }

      } catch (innerError) {
        console.error(`   ERROR processing candidate ${candidate._id}:`, innerError);
        results.push({ id: candidate._id, status: "error", error: String(innerError) });
      }
    }

    console.log("Duplicate check completed.");
    return NextResponse.json({ 
      message: "Duplicate check completed", 
      count: candidates.length,
      results 
    });

  } catch (error) {
    console.error("Duplicate check failed:", error);
    return NextResponse.json({ 
      error: "Duplicate check failed", 
      details: String(error) 
    }, { status: 500 });
  }
}
