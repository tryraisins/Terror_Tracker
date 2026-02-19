import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { DuplicateCheckerService } from "@/lib/duplicate-checker";

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const queryState = searchParams.get("state");

    // ---------- Manual single-state check ----------
    if (queryState) {
      console.log(`[Duplicate Check] Manual check for state: ${queryState}`);

      const candidates = await DuplicateCheckerService.findDuplicatesInState(queryState);
      console.log(`[Duplicate Check] Found ${candidates.length} potential duplicate pairs in ${queryState}.`);

      if (candidates.length === 0) {
        return NextResponse.json({
          message: `No duplicates found in ${queryState}`,
          state: queryState,
          candidatesFound: 0,
        });
      }

      const processedResults = await DuplicateCheckerService.processDuplicates(candidates);

      return NextResponse.json({
        message: `Processed duplicates for ${queryState}`,
        state: queryState,
        candidatesFound: candidates.length,
        processedCount: processedResults.length,
        results: processedResults,
      });
    }

    // ---------- Default cron path: check ALL new incidents ----------
    // Look back 2 hours (overlap with 1-hour cron interval to avoid edge-case misses)
    const sinceDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
    console.log(`[Duplicate Check] Cron run — checking incidents created since ${sinceDate.toISOString()}`);

    const stateResults = await DuplicateCheckerService.findDuplicatesForRecentIncidents(sinceDate);

    // Flatten all candidates across states for processing
    const allCandidates = stateResults.flatMap((r) => r.candidates);

    console.log(
      `[Duplicate Check] Total: ${allCandidates.length} candidate pair(s) across ${stateResults.length} state(s)`
    );

    if (allCandidates.length === 0) {
      return NextResponse.json({
        message: "No duplicates found across new incidents",
        statesChecked: stateResults.length,
        candidatesFound: 0,
      });
    }

    const processedResults = await DuplicateCheckerService.processDuplicates(allCandidates);

    return NextResponse.json({
      message: `Processed duplicates across ${stateResults.length} state(s)`,
      statesChecked: stateResults.length,
      candidatesFound: allCandidates.length,
      processedCount: processedResults.length,
      results: processedResults,
    });

  } catch (error) {
    console.error("Duplicate check failed:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}

