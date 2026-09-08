/**
 * Search-engine discovery for incident leads.
 *
 * Search results are leads only. Callers must fetch and adjudicate the direct
 * publisher page before using a result as evidence or writing an Attack.
 */

export type NewsDiscoveryProvider = "brave" | "duckduckgo" | "bing";
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

async function braveSearch(query: string, options: Required<NewsDiscoveryOptions>): Promise<ProviderResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return { status: "SKIPPED", httpStatus: null, results: [], reason: "BRAVE_SEARCH_API_KEY is not configured." };

  const endpoint = new URL("https://api.search.brave.com/res/v1/web/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", String(Math.min(20, options.maxResults)));
  // Brave's current country enum does not include Nigeria; the query itself
  // carries the Nigeria/state constraint, so use the supported global scope.
  endpoint.searchParams.set("country", "ALL");
  endpoint.searchParams.set("search_lang", "en");
  endpoint.searchParams.set("safesearch", "moderate");

  try {
    const response = await fetchWithTimeout(endpoint.toString(), {
      headers: {
        accept: "application/json",
        "accept-encoding": "gzip",
        "x-subscription-token": apiKey,
        "user-agent": options.userAgent,
      },
    }, options.timeoutMs);
    if (!response.ok) {
      return {
        status: response.status === 401 || response.status === 403 || response.status === 429 ? "BLOCKED" : "FAIL",
        httpStatus: response.status,
        results: [],
        reason: `Brave Search returned HTTP ${response.status}.`,
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
    return { status: "PASS", httpStatus: response.status, results, reason: `Brave returned ${results.length} result(s).` };
  } catch (error) {
    return { status: "FAIL", httpStatus: null, results: [], reason: `Brave request failed: ${error instanceof Error ? error.message : String(error)}.` };
  }
}

async function duckDuckGoSearch(query: string, options: Required<NewsDiscoveryOptions>): Promise<ProviderResponse> {
  const endpoint = new URL("https://html.duckduckgo.com/html/");
  endpoint.searchParams.set("q", query);
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

async function bingSearch(query: string, options: Required<NewsDiscoveryOptions>): Promise<ProviderResponse> {
  const endpoint = new URL("https://www.bing.com/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", String(Math.min(50, options.maxResults)));
  endpoint.searchParams.set("setlang", "en-US");
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

function selectedProviders(selection: NewsDiscoverySelection): NewsDiscoveryProvider[] {
  if (selection === "none") return [];
  if (selection === "all") return ["brave", "duckduckgo", "bing"];
  if (selection === "auto") {
    const providers: NewsDiscoveryProvider[] = ["duckduckgo"];
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

async function runProvider(provider: NewsDiscoveryProvider, query: string, options: Required<NewsDiscoveryOptions>): Promise<ProviderResponse> {
  return scheduleProvider(provider, options.minDelayMs, () => {
    if (provider === "brave") return braveSearch(query, options);
    if (provider === "duckduckgo") return duckDuckGoSearch(query, options);
    return bingSearch(query, options);
  });
}

export async function searchNews(query: string, input: NewsDiscoveryOptions = {}): Promise<NewsDiscoveryResponse> {
  const options: Required<NewsDiscoveryOptions> = {
    providers: input.providers ?? "auto",
    maxResults: Math.max(1, Math.min(50, Math.floor(input.maxResults ?? DEFAULT_MAX_RESULTS))),
    timeoutMs: Math.max(1_000, input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    userAgent: input.userAgent ?? DEFAULT_USER_AGENT,
    minDelayMs: Math.max(0, input.minDelayMs ?? Number(process.env.NEWS_DISCOVERY_MIN_DELAY_MS || DEFAULT_MIN_DELAY_MS)),
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
