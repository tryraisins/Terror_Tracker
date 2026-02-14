import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { DuplicateCheckerService } from "@/lib/duplicate-checker";

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

const NIGERIAN_STATES = [
  "Borno", "Yobe", "Adamawa", "Kaduna", "Katsina", "Zamfara", "Sokoto", "Niger", 
  "Plateau", "Benue", "Taraba", "Kogi", "Nasarawa", "Kwara", "Jigawa", "Kano", 
  "Bauchi", "Gombe", "Kebbi", "FCT", "Ebonyi", "Enugu", "Imo", "Abia", "Anambra", 
  "Delta", "Edo", "Rivers", "Bayelsa", "Akwa Ibom", "Cross River", "Ondo", "Ogun", 
  "Oyo", "Osun", "Lagos", "Ekiti"
];

// High risk states where duplicates are most likely due to high volume
const PRIORITY_STATES = [
  "Borno", "Kaduna", "Katsina", "Zamfara", "Niger", "Plateau", "Benue"
];

export async function GET(req: Request) {
  try {
    await connectDB();
    
    // Check for query param 'state'
    const { searchParams } = new URL(req.url);
    const queryState = searchParams.get("state");

    // Pick a state: either from query, or random priority state (70% chance), or random other state (30%)
    let targetState = queryState;
    if (!targetState) {
        const usePriority = Math.random() < 0.7;
        const list = usePriority ? PRIORITY_STATES : NIGERIAN_STATES;
        targetState = list[Math.floor(Math.random() * list.length)];
    }

    console.log(`[Duplicate Check] Starting analysis for State: ${targetState}`);

    // 1. Find candidates using heuristics
    // This is the "per incident per state" check
    const candidates = await DuplicateCheckerService.findDuplicatesInState(targetState);
    
    console.log(`[Duplicate Check] Found ${candidates.length} potential duplicate pairs in ${targetState}.`);

    if (candidates.length === 0) {
        return NextResponse.json({
            message: `No duplicates found in ${targetState}`,
            state: targetState,
            candidatesFound: 0
        });
    }

    // 2. Process using Gemini (only top matches to save quota/time)
    // The service handles limiting inside processDuplicates, but we can also slice here if needed
    const processedResults = await DuplicateCheckerService.processDuplicates(candidates);

    return NextResponse.json({
        message: `Processed duplicates for ${targetState}`,
        state: targetState,
        candidatesFound: candidates.length,
        processedCount: processedResults.length,
        results: processedResults
    });

  } catch (error) {
    console.error("Duplicate check failed:", error);
    return NextResponse.json({ error: "Failed", details: String(error) }, { status: 500 });
  }
}
