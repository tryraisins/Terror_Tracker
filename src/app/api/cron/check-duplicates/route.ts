import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { DuplicateCheckerService } from "@/lib/duplicate-checker";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 5,
      rateLimitWindow: 3600_000,
      requireCronSecret: true,
    });
    if (securityError) return securityError;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const queryState = searchParams.get("state");

    // ---------- Manual single-state check ----------
    if (queryState) {
      console.log(`[Duplicate Check] Manual check for state: ${queryState}`);

      const candidates =
        await DuplicateCheckerService.findDuplicatesInState(queryState);
      console.log(
        `[Duplicate Check] Found ${candidates.length} potential duplicate pairs in ${queryState}.`,
      );

      if (candidates.length === 0) {
      return setCORSHeaders(
        NextResponse.json({
        message: `No duplicates found in ${queryState}`,
        state: queryState,
        candidatesFound: 0,
        })
      );
      }

      return setCORSHeaders(
        NextResponse.json({
        message: `Found possible duplicates for ${queryState}; automatic AI confirmation and deletion are disabled.`,
        state: queryState,
        candidatesFound: candidates.length,
        candidates: candidates.map((candidate) => ({
          reportA: candidate.reportA._id,
          reportB: candidate.reportB._id,
          score: candidate.heuristicScore,
          reason: candidate.reason,
        })),
        })
      );
    }

    // ---------- Default cron path: check ALL new incidents ----------
    // Look back 5 days — scan all entries created within this window
    // and compare them against other incidents in the same state.
    const sinceDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    console.log(
      `[Duplicate Check] Cron run — checking incidents created since ${sinceDate.toISOString()}`,
    );

    const stateResults =
      await DuplicateCheckerService.findDuplicatesForRecentIncidents(sinceDate);

    // Report candidates only. Auto-merging used a paid model and could delete a
    // legitimate incident; an admin must now review a candidate before merging.
    const allCandidates = stateResults.flatMap((r) => r.candidates);

    console.log(
      `[Duplicate Check] Total: ${allCandidates.length} candidate pair(s) across ${stateResults.length} state(s)`,
    );

    if (allCandidates.length === 0) {
      return setCORSHeaders(
        NextResponse.json({
        message: "No duplicates found across new incidents",
        statesChecked: stateResults.length,
        candidatesFound: 0,
        })
      );
    }

    return setCORSHeaders(
      NextResponse.json({
      message: `Found possible duplicates across ${stateResults.length} state(s); no records were changed.`,
      statesChecked: stateResults.length,
      candidatesFound: allCandidates.length,
      candidates: allCandidates.map((candidate) => ({
        reportA: candidate.reportA._id,
        reportB: candidate.reportB._id,
        score: candidate.heuristicScore,
        reason: candidate.reason,
      })),
      })
    );
  } catch (error) {
    console.error("Duplicate check failed:", error);
    return setCORSHeaders(
      NextResponse.json(
        { error: "Failed", details: String(error) },
        { status: 500 },
      )
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return setCORSHeaders(response);
}
