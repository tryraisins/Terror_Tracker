import { searchNews, type NewsDiscoveryProvider } from "./news-discovery";

type SearchFailure = { provider: NewsDiscoveryProvider; reason: string };

/**
 * Brave is only a fallback now, so a scan that never needs it never learns its
 * quota is gone. One single-result query per scan makes the state visible. It
 * costs one call of a budget the scan caps at forty, and returns null when the
 * key is absent or the lane answers.
 */
export async function probeBraveLane(): Promise<SearchFailure | null> {
  if (!process.env.BRAVE_SEARCH_API_KEY) return null;
  const response = await searchNews("Nigeria news", { providers: "brave", maxResults: 1, freshness: "day" });
  const receipt = response.receipts.find((item) => item.provider === "brave");
  return receipt && receipt.status !== "PASS" ? { provider: "brave", reason: receipt.reason } : null;
}

/**
 * Reasons a search lane is down for the whole scan rather than for one query.
 * A down lane does not fail a scan, it shrinks it: Brave's quota ran out on
 * 2026-10-16 and thirteen days of DEGRADED scans went unnoticed. These strings
 * go into the report, the step summary and the operator email.
 */
export function searchLaneAlerts(searchFailures: SearchFailure[], stateCount: number): string[] {
  const braveQuotaExhausted = searchFailures.some((failure) => failure.provider === "brave" && /quota/i.test(failure.reason));
  const googleNewsFailures = searchFailures.filter((failure) => failure.provider === "googlenews").length;
  const deepSeekFailures = searchFailures.filter((failure) => failure.provider === "deepseek");
  // 401/402 mean the key or balance, which no later query in the scan can fix.
  const deepSeekAccountDown = deepSeekFailures.some((failure) => /HTTP 40[12]\b|balance/i.test(failure.reason));
  return [
    braveQuotaExhausted ? "Brave Search monthly quota is exhausted" : "",
    stateCount > 0 && googleNewsFailures >= Math.ceil(stateCount / 2)
      ? `Google News search failed for ${googleNewsFailures} of ${stateCount} states`
      : "",
    deepSeekAccountDown ? "DeepSeek Search rejected the key or balance" : "",
    !deepSeekAccountDown && stateCount > 0 && deepSeekFailures.length >= Math.ceil(stateCount / 2)
      ? `DeepSeek Search failed for ${deepSeekFailures.length} of ${stateCount} states`
      : "",
  ].filter(Boolean);
}
