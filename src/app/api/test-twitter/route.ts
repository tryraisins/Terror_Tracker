import { NextRequest, NextResponse } from "next/server";
import { fetchAllRelevantTweets } from "@/lib/twitter";
import { parseTweetsWithGemini } from "@/lib/gemini";

/**
 * GET /api/test-twitter
 *
 * Test endpoint to verify the Twitter scraper is working.
 * Returns raw scraped tweets and (optionally) Gemini-parsed attack data.
 *
 * Query params:
 *   ?parse=true  — also parse tweets with Gemini into structured attack data
 *
 * ⚠️ Remove or protect this endpoint in production!
 */
export async function GET(req: NextRequest) {
  const parseWithGemini = req.nextUrl.searchParams.get("parse") === "true";

  try {
    console.log("[TEST-TWITTER] Starting tweet fetch...");
    const startTime = Date.now();

    const tweets = await fetchAllRelevantTweets();

    const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    const response: Record<string, unknown> = {
      success: true,
      fetchDurationSeconds: fetchDuration,
      tweetCount: tweets.length,
      tweets: tweets.map((t) => ({
        id: t.id,
        username: `@${t.username}`,
        displayName: t.displayName,
        text: t.text,
        timestamp: t.timestamp.toISOString(),
        url: t.url,
        likes: t.likes,
        retweets: t.retweets,
      })),
    };

    // Optionally parse with Gemini
    if (parseWithGemini && tweets.length > 0) {
      console.log("[TEST-TWITTER] Parsing tweets with Gemini...");
      const attacks = await parseTweetsWithGemini(tweets);
      response.parsedAttacks = attacks;
      response.parsedAttackCount = attacks.length;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("[TEST-TWITTER] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack =
      error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        hint:
          errorMessage.includes("TWITTER_USERNAME") ||
          errorMessage.includes("TWITTER_PASSWORD")
            ? "Make sure TWITTER_USERNAME, TWITTER_PASSWORD, and TWITTER_EMAIL are set in .env.local"
            : errorMessage.includes("login")
            ? "Twitter login failed. Check your credentials, or your account may need 2FA disabled."
            : "Check the server console for more details.",
      },
      { status: 500 }
    );
  }
}
