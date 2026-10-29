/**
 * Search-engine discovery for incident leads.
 *
 * Search results are leads only. Callers must fetch and adjudicate the direct
 * publisher page before using a result as evidence or writing an Attack.
 */

import { isSuppressedSourceHost } from "./news-source-registry";

export type NewsDiscoveryProvider = "brave" | "duckduckgo" | "bing" | "googlenews" | "deepseek";
export type NewsDiscoverySelection = "auto" | "all" | NewsDiscoveryProvider | "none";
export type NewsDiscoveryStatus = "PASS" | "BLOCKED" | "FAIL" | "SKIPPED";

export type NewsDiscoveryResult = {
  url: string;
  title: string;
  publisher: string;
  providers: NewsDiscoveryProvider[];
};

export type NewsDiscoveryReceipt = {
  provider: NewsDiscoveryProvider;
  status: NewsDiscoveryStatus;
  httpStatus: number | null;
  resultCount: number;
  reason: string;
};

export type NewsDiscoveryResponse = {
  query: string;
  results: NewsDiscoveryResult[];
  receipts: NewsDiscoveryReceipt[];
};

export type NewsDiscoveryOptions = {
  providers?: NewsDiscoverySelection;
  maxResults?: number;
  timeoutMs?: number;
  userAgent?: string;
  minDelayMs?: number;
  freshness?: "day" | "week" | "month";
};

type ResolvedDiscoveryOptions = {
  providers: NewsDiscoverySelection;
  maxResults: number;
  timeoutMs: number;
  userAgent: string;
  minDelayMs: number;
  freshness?: "day" | "week" | "month";
};

type SearchResult = { url: string; title: string; publisher: string };
type ProviderResponse = {
  status: NewsDiscoveryStatus;
  httpStatus: number | null;
  results: SearchResult[];
  reason: string;
};

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_RESULTS = 20;
const DEFAULT_MIN_DELAY_MS = 3_000;
const DEFAULT_BRAVE_MIN_DELAY_MS = 1_000;
const DEFAULT_DEEPSEEK_MIN_DELAY_MS = 250;
// DeepSeek's documented query limit; a longer query is a 400, not a truncation.
const DEEPSEEK_MAX_QUERY_CHARS = 128;
const DEFAULT_USER_AGENT = "NigeriaAttackTracker/1.0 (+multi-engine incident discovery)";
const SEARCH_HOSTS = new Set([
  "bing.com",
  "www.bing.com",
  "duckduckgo.com",
  "html.duckduckgo.com",
  "search.brave.com",
]);

const providerQueues = new Map<NewsDiscoveryProvider, Promise<void>>();
const providerLastCall = new Map<NewsDiscoveryProvider, number>();
let braveQuotaExhaustedForProcess = false;
let deepSeekBalanceExhaustedForProcess = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) {
    attributes.set(match[1].toLowerCase(), decodeHtml(match[2]));
  }
  return attributes;
}

function publisherForUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_|fbclid|gclid|oc|ref|source|output|ved|form|cvid)/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function unwrapSearchUrl(value: string, baseUrl: string): string | null {
  try {
    const parsed = new URL(decodeHtml(value), baseUrl);
    if (parsed.hostname.endsWith("duckduckgo.com") && parsed.pathname === "/l/") {
      return normalizeUrl(parsed.searchParams.get("uddg") || "");
    }
    if (parsed.hostname.endsWith("bing.com") && parsed.pathname === "/ck/a") {
      const encoded = parsed.searchParams.get("u") || "";
      const decoded = encoded.startsWith("a1") ? Buffer.from(encoded.slice(2), "base64").toString("utf8") : encoded;
      return normalizeUrl(decoded);
    }
    return normalizeUrl(parsed.toString());
  } catch {
    return null;
  }
}

function isSearchHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return [...SEARCH_HOSTS].some((searchHost) => host === searchHost || host.endsWith(`.${searchHost}`));
  } catch {
    return true;
  }
}

function parseDuckDuckGoResults(html: string, limit: number): SearchResult[] {
  const results: SearchResult[] = [];
  for (const match of html.matchAll(/<a\b[^>]*class=["'][^"']*result__a[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const attributes = parseAttributes(match[0]);
    const url = unwrapSearchUrl(attributes.get("href") || "", "https://html.duckduckgo.com");
    const title = decodeHtml(match[1].replace(/<[^>]+>/g, " "));
    if (!url || !title || isSearchHost(url)) continue;
    results.push({ url, title, publisher: publisherForUrl(url) });
    if (results.length >= limit) break;
  }
  return results;
}

function parseBingResults(html: string, limit: number): SearchResult[] {
  const results: SearchResult[] = [];
  for (const match of html.matchAll(/<li\b[^>]*class=["'][^"']*b_algo[^"']*["'][^>]*>[\s\S]*?<h2[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = parseAttributes(`<a ${match[1]}>`);
    const url = unwrapSearchUrl(attributes.get("href") || "", "https://www.bing.com");
    const title = decodeHtml(match[2].replace(/<[^>]+>/g, " "));
    if (!url || !title || isSearchHost(url)) continue;
    results.push({ url, title, publisher: publisherForUrl(url) });
    if (results.length >= limit) break;
  }
  return results;
}

function blockedBody(text: string): boolean {
  const challenge = /(?:captcha|verify you are human|unusual traffic|robot check|access denied|temporarily blocked|cf-chl|challenge-platform)/i.test(text);
  const containsResults = /(?:b_algo|b_results|result__a)/i.test(text);
  return challenge && !containsResults;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function braveSearch(query: string, options: ResolvedDiscoveryOptions): Promise<ProviderResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return { status: "SKIPPED", httpStatus: null, results: [], reason: "BRAVE_SEARCH_API_KEY is not configured." };
  if (braveQuotaExhaustedForProcess) {
    return { status: "BLOCKED", httpStatus: 429, results: [], reason: "Brave Search monthly quota was exhausted earlier in this scan; skipping further requests." };
  }

  const endpoint = new URL("https://api.search.brave.com/res/v1/web/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", String(Math.min(20, options.maxResults)));
  // Brave's current country enum does not include Nigeria; the query itself
  // carries the Nigeria/state constraint, so use the supported global scope.
  endpoint.searchParams.set("country", "ALL");
  endpoint.searchParams.set("search_lang", "en");
  endpoint.searchParams.set("safesearch", "moderate");
  if (options.freshness) {
    endpoint.searchParams.set("freshness", options.freshness === "day" ? "pd" : options.freshness === "week" ? "pw" : "pm");
  }

  try {
    const headers = {
      accept: "application/json",
      "accept-encoding": "gzip",
      "x-subscription-token": apiKey,
      "user-agent": options.userAgent,
    };
    let response: Response | null = null;
    let recoveredFromRateLimit = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      response = await fetchWithTimeout(endpoint.toString(), { headers }, options.timeoutMs);
      if (response.status !== 429) break;

      const resetValues = (response.headers.get("x-ratelimit-reset") || "").split(",").map((value) => Number(value.trim()));
      const remainingValues = (response.headers.get("x-ratelimit-remaining") || "").split(",").map((value) => Number(value.trim()));
      const retryAfter = Number(response.headers.get("retry-after"));
      const errorBody: unknown = await response.clone().json().catch(() => null);
      const error = isRecord(errorBody) && isRecord(errorBody.error) ? errorBody.error : null;
      const errorCode = error && typeof error.code === "string" ? error.code : "";
      const monthlyQuotaExhausted = (remainingValues.length > 1 && remainingValues[1] === 0) || errorCode === "QUOTA_LIMITED";
      if (monthlyQuotaExhausted) braveQuotaExhaustedForProcess = true;
      if (attempt > 0 || monthlyQuotaExhausted) break;

      const headerWaitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1_000
        : Number.isFinite(resetValues[0]) && resetValues[0] > 0
          ? resetValues[0] * 1_000
          : 1_000;
      const waitMs = Math.min(30_000, Math.max(1_000, headerWaitMs + 250));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      recoveredFromRateLimit = true;
    }
    if (!response) throw new Error("Brave Search returned no response.");
    if (!response.ok) {
      const resetHint = response.headers.get("x-ratelimit-reset");
      const remainingHint = response.headers.get("x-ratelimit-remaining");
      const monthlyQuotaExhausted = remainingHint?.split(",")[1]?.trim() === "0";
      const errorBody: unknown = response.status === 429 ? await response.clone().json().catch(() => null) : null;
      const error = isRecord(errorBody) && isRecord(errorBody.error) ? errorBody.error : null;
      const errorCode = error && typeof error.code === "string" ? error.code : "";
      return {
        status: response.status === 401 || response.status === 403 || response.status === 429 ? "BLOCKED" : "FAIL",
        httpStatus: response.status,
        results: [],
        reason: `Brave Search returned HTTP ${response.status}${monthlyQuotaExhausted || errorCode === "QUOTA_LIMITED" ? " (monthly quota exhausted)" : errorCode ? ` (${errorCode})` : resetHint ? ` (rate-limit reset: ${resetHint})` : ""}.`,
      };
    }
    const data: unknown = await response.json();
    const web = isRecord(data) && isRecord(data.web) ? data.web : null;
    const rawResults = web && Array.isArray(web.results) ? web.results : [];
    const results = rawResults
      .filter(isRecord)
      .map((result) => ({
        url: stringValue(result.url),
        title: stringValue(result.title),
        publisher: publisherForUrl(stringValue(result.url)),
      }))
      .filter((result) => Boolean(result.url && result.title && !isSearchHost(result.url)))
      .slice(0, options.maxResults);
    return {
      status: "PASS",
      httpStatus: response.status,
      results,
      reason: `Brave returned ${results.length} result(s)${recoveredFromRateLimit ? " after a rate-limit retry" : ""}.`,
    };
  } catch (error) {
    return { status: "FAIL", httpStatus: null, results: [], reason: `Brave request failed: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

/**
 * DeepSeek's own Search API (not the model's web_search tool): raw ranked
 * results with publisher URLs, billed per successful call. Freshness goes in
 * the query as `after:` because the endpoint has no freshness field.
 */
function deepSeekQuery(query: string, freshness: ResolvedDiscoveryOptions["freshness"]): string {
  const days = freshness === "day" ? 1 : freshness === "week" ? 7 : freshness === "month" ? 30 : 0;
  const suffix = days ? ` after:${new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)}` : "";
  const room = DEEPSEEK_MAX_QUERY_CHARS - suffix.length;
  let base = query.trim();
  if (base.length > room) {
    base = base.slice(0, room);
    base = base.slice(0, Math.max(base.lastIndexOf(" "), 1)).trim();
    // A cut inside a quoted phrase would leave an unbalanced quote.
    if ((base.match(/"/g) || []).length % 2) base = base.replace(/"[^"]*$/, "").trim();
  }
  return `${base}${suffix}`;
}

async function deepSeekSearch(query: string, options: ResolvedDiscoveryOptions): Promise<ProviderResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return { status: "SKIPPED", httpStatus: null, results: [], reason: "DEEPSEEK_API_KEY is not configured." };
  if (deepSeekBalanceExhaustedForProcess) {
    return { status: "BLOCKED", httpStatus: 402, results: [], reason: "DeepSeek balance was exhausted earlier in this scan; skipping further requests." };
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const body = JSON.stringify({ query: deepSeekQuery(query, options.freshness), count: Math.min(50, options.maxResults), need_content: false });

  try {
    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      response = await fetchWithTimeout(`${baseUrl}/v1/tools/search`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", accept: "application/json" },
        body,
      }, options.timeoutMs);
      // Search is read-only, so one short wait on a QPS 429 is safe.
      if (response.status !== 429 || attempt > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
    if (!response) throw new Error("DeepSeek Search returned no response.");
    if (!response.ok) {
      if (response.status === 402) deepSeekBalanceExhaustedForProcess = true;
      const errorBody: unknown = await response.json().catch(() => null);
      const error = isRecord(errorBody) && isRecord(errorBody.error) ? stringValue(errorBody.error.message) : "";
      return {
        status: [401, 402, 403, 429].includes(response.status) ? "BLOCKED" : "FAIL",
        httpStatus: response.status,
        results: [],
        reason: `DeepSeek Search returned HTTP ${response.status}${response.status === 402 ? " (insufficient balance)" : ""}${error ? `: ${error.slice(0, 120)}` : ""}.`,
      };
    }
    const data: unknown = await response.json();
    if (!isRecord(data) || !Array.isArray(data.results)) {
      return { status: "FAIL", httpStatus: response.status, results: [], reason: "DeepSeek Search returned a body without a results array." };
    }
    const results = data.results
      .filter(isRecord)
      .map((result) => ({
        url: stringValue(result.url),
        title: stringValue(result.title),
        publisher: stringValue(result.site_name) || publisherForUrl(stringValue(result.url)),
      }))
      .filter((result) => Boolean(result.url && result.title && /^https?:\/\//i.test(result.url) && !isSearchHost(result.url) && !isSuppressedSourceHost(result.url)))
      .slice(0, options.maxResults);
    return { status: "PASS", httpStatus: response.status, results, reason: `DeepSeek Search returned ${results.length} result(s).` };
  } catch (error) {
    return { status: "FAIL", httpStatus: null, results: [], reason: `DeepSeek Search request failed: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

async function duckDuckGoSearch(query: string, options: ResolvedDiscoveryOptions): Promise<ProviderResponse> {
  const endpoint = new URL("https://html.duckduckgo.com/html/");
  endpoint.searchParams.set("q", query);
  if (options.freshness) {
    endpoint.searchParams.set("df", options.freshness === "day" ? "d" : options.freshness === "week" ? "w" : "m");
  }
  try {
    const response = await fetchWithTimeout(endpoint.toString(), {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-NG,en;q=0.8",
        "user-agent": options.userAgent,
      },
    }, options.timeoutMs);
    const html = await response.text();
    if (!response.ok || blockedBody(html)) {
      return {
        status: response.status === 401 || response.status === 403 || response.status === 429 || blockedBody(html) ? "BLOCKED" : "FAIL",
        httpStatus: response.status,
        results: [],
        reason: `DuckDuckGo returned ${response.status}${blockedBody(html) ? " a challenge page" : ""}.`,
      };
    }
    const results = parseDuckDuckGoResults(html, options.maxResults);
    return { status: "PASS", httpStatus: response.status, results, reason: `DuckDuckGo returned ${results.length} result(s).` };
  } catch (error) {
    return { status: "FAIL", httpStatus: null, results: [], reason: `DuckDuckGo request failed: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

async function bingSearch(query: string, options: ResolvedDiscoveryOptions): Promise<ProviderResponse> {
  const endpoint = new URL("https://www.bing.com/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", String(Math.min(50, options.maxResults)));
  endpoint.searchParams.set("setlang", "en-US");
  if (options.freshness) {
    const ageMinutes = options.freshness === "day" ? 1440 : options.freshness === "week" ? 10080 : 43200;
    endpoint.searchParams.set("qft", `+filterui:age-lt${ageMinutes}`);
  }
  try {
    const response = await fetchWithTimeout(endpoint.toString(), {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-NG,en;q=0.8",
        "user-agent": options.userAgent,
      },
    }, options.timeoutMs);
    const html = await response.text();
    if (!response.ok || blockedBody(html)) {
      return {
        status: response.status === 401 || response.status === 403 || response.status === 429 || blockedBody(html) ? "BLOCKED" : "FAIL",
        httpStatus: response.status,
        results: [],
        reason: `Bing HTML returned ${response.status}${blockedBody(html) ? " a challenge page" : ""}.`,
      };
    }
    const results = parseBingResults(html, options.maxResults);
    return { status: "PASS", httpStatus: response.status, results, reason: `Bing HTML returned ${results.length} result(s).` };
  } catch (error) {
    return { status: "FAIL", httpStatus: null, results: [], reason: `Bing HTML request failed: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

// Google News serves its own browser-facing pages to a browser user agent only.
const GOOGLE_NEWS_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const GOOGLE_NEWS_DECODE_CONCURRENCY = 3;
const googleNewsDecodeCache = new Map<string, Promise<string | null>>();

type GoogleNewsItem = { title: string; link: string; publisher: string; sourceUrl: string };

function parseGoogleNewsRss(xml: string): GoogleNewsItem[] {
  return (xml.match(/<item>[\s\S]*?<\/item>/g) || []).flatMap((block) => {
    const link = decodeHtml(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
    const rawTitle = decodeHtml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
    const source = block.match(/<source\b([^>]*)>([\s\S]*?)<\/source>/);
    const publisher = decodeHtml(source?.[2] || "");
    const sourceUrl = parseAttributes(`<source ${source?.[1] || ""}>`).get("url") || "";
    if (!link || !rawTitle) return [];
    const suffix = publisher ? ` - ${publisher}` : "";
    const title = suffix && rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle;
    return [{ title, link, publisher, sourceUrl }];
  });
}

/**
 * Google News RSS links are wrappers. The article id is not the URL for current
 * links, so the page's signed parameters are replayed to the same endpoint the
 * Google News web app uses. Any failure returns null and the item is dropped:
 * a wrapper is never passed on as if it were the publisher page.
 */
async function resolveGoogleNewsLink(link: string, timeoutMs: number): Promise<string | null> {
  let id: string;
  try {
    id = new URL(link).pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return null;
  }
  if (!id) return null;
  const cached = googleNewsDecodeCache.get(id);
  if (cached) return cached;
  const task = (async () => {
    try {
      const page = await fetchWithTimeout(`https://news.google.com/rss/articles/${id}?hl=en-NG&gl=NG&ceid=NG:en`, {
        headers: { "user-agent": GOOGLE_NEWS_USER_AGENT, "accept-language": "en" },
      }, timeoutMs);
      const html = await page.text();
      const signature = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
      const timestamp = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
      if (!signature || !timestamp) return null;
      const inner = `["garturlreq",[["en-US","US",["FINANCE_TOP_INDICES","WEB_TEST_1_0_0"],null,null,1,1,"US:en",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],"en-US","US",1,[2,3,4,8],1,0,"655000234",0,0,null,0],"${id}",${timestamp},"${signature}"]`;
      const response = await fetchWithTimeout("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", "user-agent": GOOGLE_NEWS_USER_AGENT },
        body: `f.req=${encodeURIComponent(JSON.stringify([[["Fbv4je", inner]]]))}`,
      }, timeoutMs);
      const text = await response.text();
      for (const chunk of text.split("\n\n")) {
        if (!chunk.trim().startsWith("[")) continue;
        try {
          const row = (JSON.parse(chunk) as unknown[]).find((item) => Array.isArray(item) && item[1] === "Fbv4je") as unknown[] | undefined;
          const value = row ? (JSON.parse(String(row[2])) as unknown[])[1] : null;
          if (typeof value === "string" && /^https?:\/\//i.test(value) && !isSearchHost(value) && !/(^|\.)google\.com\b/i.test(new URL(value).hostname)) return value;
        } catch {
          // try the next chunk
        }
      }
      return null;
    } catch {
      return null;
    }
  })();
  googleNewsDecodeCache.set(id, task);
  // A failed decode must not be remembered for the rest of the process.
  void task.then((value) => { if (!value) googleNewsDecodeCache.delete(id); });
  return task;
}

async function googleNewsSearch(query: string, options: ResolvedDiscoveryOptions): Promise<ProviderResponse> {
  const endpoint = new URL("https://news.google.com/rss/search");
  const when = options.freshness === "day" ? "1d" : options.freshness === "month" ? "30d" : "7d";
  endpoint.searchParams.set("q", `${query} when:${when}`);
  endpoint.searchParams.set("hl", "en-NG");
  endpoint.searchParams.set("gl", "NG");
  endpoint.searchParams.set("ceid", "NG:en");
  try {
    const response = await fetchWithTimeout(endpoint.toString(), {
      headers: { accept: "application/rss+xml,application/xml,text/xml", "user-agent": GOOGLE_NEWS_USER_AGENT },
    }, options.timeoutMs);
    const xml = await response.text();
    if (!response.ok || !/<rss\b/i.test(xml)) {
      return {
        status: response.status === 401 || response.status === 403 || response.status === 429 || (response.ok && blockedBody(xml)) ? "BLOCKED" : "FAIL",
        httpStatus: response.status,
        results: [],
        reason: `Google News returned ${response.status}${response.ok ? " a non-feed page" : ""}.`,
      };
    }
    // Decode only what could be used: suppressed publishers are dropped by the
    // caller anyway, and the cap bounds the decode requests per query.
    const items = parseGoogleNewsRss(xml)
      .filter((item) => !item.sourceUrl || !isSuppressedSourceHost(item.sourceUrl))
      .slice(0, options.maxResults);
    const results: SearchResult[] = [];
    let undecoded = 0;
    for (let index = 0; index < items.length; index += GOOGLE_NEWS_DECODE_CONCURRENCY) {
      const batch = items.slice(index, index + GOOGLE_NEWS_DECODE_CONCURRENCY);
      const urls = await Promise.all(batch.map((item) => resolveGoogleNewsLink(item.link, options.timeoutMs)));
      batch.forEach((item, position) => {
        const url = urls[position];
        if (url) results.push({ url, title: item.title, publisher: item.publisher || publisherForUrl(url) });
        else undecoded++;
      });
    }
    // An item list that decodes to nothing is a provider failure, not a quiet day.
    if (items.length > 0 && results.length === 0) {
      return { status: "FAIL", httpStatus: response.status, results: [], reason: `Google News listed ${items.length} article(s) but none resolved to a publisher URL.` };
    }
    return {
      status: "PASS",
      httpStatus: response.status,
      results,
      reason: `Google News returned ${results.length} result(s)${undecoded ? `; ${undecoded} could not be resolved` : ""}.`,
    };
  } catch (error) {
    return { status: "FAIL", httpStatus: null, results: [], reason: `Google News request failed: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

function selectedProviders(selection: NewsDiscoverySelection): NewsDiscoveryProvider[] {
  if (selection === "none") return [];
  if (selection === "all") return ["brave", "duckduckgo", "bing", "googlenews", "deepseek"];
  if (selection === "auto") {
    const providers: NewsDiscoveryProvider[] = ["duckduckgo"];
    if (process.env.NEWS_DISCOVERY_ENABLE_GOOGLE_NEWS !== "false") providers.push("googlenews");
    if (process.env.DEEPSEEK_API_KEY && process.env.NEWS_DISCOVERY_ENABLE_DEEPSEEK_SEARCH !== "false") providers.push("deepseek");
    if (process.env.BRAVE_SEARCH_API_KEY) providers.unshift("brave");
    if (process.env.NEWS_DISCOVERY_ENABLE_BING === "true") providers.push("bing");
    return providers;
  }
  return [selection];
}

async function scheduleProvider<T>(provider: NewsDiscoveryProvider, minDelayMs: number, task: () => Promise<T>): Promise<T> {
  const previous = providerQueues.get(provider) || Promise.resolve();
  const run = previous.then(async () => {
    const waitMs = minDelayMs - (Date.now() - (providerLastCall.get(provider) || 0));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    providerLastCall.set(provider, Date.now());
    return task();
  });
  providerQueues.set(provider, run.then(() => undefined, () => undefined));
  return run;
}

async function runProvider(provider: NewsDiscoveryProvider, query: string, options: ResolvedDiscoveryOptions): Promise<ProviderResponse> {
  const configuredBraveMinDelayMs = Number(process.env.BRAVE_SEARCH_MIN_DELAY_MS || DEFAULT_BRAVE_MIN_DELAY_MS);
  const braveMinDelayMs = Math.max(options.minDelayMs, Number.isFinite(configuredBraveMinDelayMs) ? configuredBraveMinDelayMs : DEFAULT_BRAVE_MIN_DELAY_MS);
  const configuredDeepSeekMinDelayMs = Number(process.env.DEEPSEEK_SEARCH_MIN_DELAY_MS || DEFAULT_DEEPSEEK_MIN_DELAY_MS);
  const deepSeekMinDelayMs = Number.isFinite(configuredDeepSeekMinDelayMs) ? configuredDeepSeekMinDelayMs : DEFAULT_DEEPSEEK_MIN_DELAY_MS;
  const minDelayMs = provider === "brave" ? braveMinDelayMs : provider === "deepseek" ? deepSeekMinDelayMs : options.minDelayMs;
  return scheduleProvider(provider, minDelayMs, () => {
    if (provider === "brave") return braveSearch(query, options);
    if (provider === "deepseek") return deepSeekSearch(query, options);
    if (provider === "duckduckgo") return duckDuckGoSearch(query, options);
    if (provider === "googlenews") return googleNewsSearch(query, options);
    return bingSearch(query, options);
  });
}

export async function searchNews(query: string, input: NewsDiscoveryOptions = {}): Promise<NewsDiscoveryResponse> {
  const options: ResolvedDiscoveryOptions = {
    providers: input.providers ?? "auto",
    maxResults: Math.max(1, Math.min(50, Math.floor(input.maxResults ?? DEFAULT_MAX_RESULTS))),
    timeoutMs: Math.max(1_000, input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    userAgent: input.userAgent ?? DEFAULT_USER_AGENT,
    minDelayMs: Math.max(0, input.minDelayMs ?? Number(process.env.NEWS_DISCOVERY_MIN_DELAY_MS || DEFAULT_MIN_DELAY_MS)),
    freshness: input.freshness,
  };
  const providers = selectedProviders(options.providers);
  if (!providers.length) return { query, results: [], receipts: [] };

  // Keep at most two search surfaces in flight. Per-provider queues also
  // enforce the same-host delay across concurrent audit tasks.
  const responses: Array<{ provider: NewsDiscoveryProvider; response: ProviderResponse }> = [];
  for (let index = 0; index < providers.length; index += 2) {
    const batch = providers.slice(index, index + 2);
    const settled = await Promise.all(batch.map(async (provider) => ({ provider, response: await runProvider(provider, query, options) })));
    responses.push(...settled);
  }

  const byUrl = new Map<string, NewsDiscoveryResult>();
  for (const { provider, response } of responses) {
    for (const result of response.results) {
      const url = normalizeUrl(result.url);
      if (!url || isSearchHost(url)) continue;
      const existing = byUrl.get(url);
      if (existing) {
        existing.providers = [...new Set([...existing.providers, provider])];
      } else {
        byUrl.set(url, { ...result, url, providers: [provider] });
      }
    }
  }

  const mergedResults = [...byUrl.values()];
  const orderedResults: NewsDiscoveryResult[] = [];
  const selectedUrls = new Set<string>();
  // Give each passing engine a chance to contribute before filling the
  // remainder in provider/result order. This avoids one index dominating the
  // combined lead set when the caller asks for a small result cap.
  for (const { provider } of responses) {
    const first = mergedResults.find((result) => result.providers.includes(provider) && !selectedUrls.has(result.url));
    if (first) {
      selectedUrls.add(first.url);
      orderedResults.push(first);
    }
  }
  for (const result of mergedResults) {
    if (selectedUrls.has(result.url)) continue;
    selectedUrls.add(result.url);
    orderedResults.push(result);
  }

  return {
    query,
    results: orderedResults.slice(0, options.maxResults),
    receipts: responses.map(({ provider, response }) => ({ provider, ...response, resultCount: response.results.length })),
  };
}
