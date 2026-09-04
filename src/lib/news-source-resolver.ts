import crypto from "crypto";

export type NewsLead = {
  googleNewsUrl: string;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  publisher?: string | null;
  headline: string;
  publishedAt?: string | null;
};

export type NewsFetchStatus = "PASS" | "PARTIAL" | "BLOCKED" | "FAIL" | "NOT_ATTEMPTED";
export type NewsResolutionStatus = "PASS" | "BLOCKED" | "UNRESOLVED" | "FAIL";
export type NewsResolutionMethod =
  | "RSS_SOURCE_URL"
  | "HTTP_REDIRECT"
  | "CANONICAL_TAG"
  | "PUBLISHER_SITE_SEARCH"
  | "PUBLISHER_TITLE_SEARCH"
  | "NONE";
export type NewsSearchProvider = "auto" | "duckduckgo" | "brave" | "none";

export type NewsResolutionAttempt = {
  method: NewsResolutionMethod | "GOOGLE_REDIRECT_CHECK";
  requestedUrl: string;
  finalUrl: string | null;
  httpStatus: number | null;
  fetchStatus: NewsFetchStatus;
  titleSimilarity: number;
  reason: string;
};

export type NewsResolution = {
  googleNewsUrl: string;
  sourceUrl: string | null;
  resolvedSourceUrl: string | null;
  resolutionStatus: NewsResolutionStatus;
  resolutionMethod: NewsResolutionMethod;
  directFetchStatus: NewsFetchStatus;
  httpStatus: number | null;
  finalUrl: string | null;
  canonicalUrl: string | null;
  contentType: string | null;
  articleTitle: string | null;
  articlePublishedAt: string | null;
  contentDigest: string | null;
  titleSimilarity: number;
  matchedTitleTokens: string[];
  expectedPublisherDomain: string | null;
  reason: string;
  attempts: NewsResolutionAttempt[];
};

export type NewsResolverOptions = {
  timeoutMs?: number;
  userAgent?: string;
  titleSearch?: boolean;
  searchProvider?: NewsSearchProvider;
  searchDelayMs?: number;
  maxSearchResults?: number;
};

export type NewsLeadResolver = {
  resolve: (lead: NewsLead) => Promise<NewsResolution>;
};

type ResolvedSettings = Required<NewsResolverOptions>;

type PageFetch = {
  requestedUrl: string;
  status: number | null;
  finalUrl: string | null;
  contentType: string | null;
  html: string;
  error: string | null;
};

export type NewsArticleMetadata = {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  text: string;
};

type PageAssessment = {
  fetchStatus: NewsFetchStatus;
  finalUrl: string | null;
  canonicalUrl: string | null;
  contentType: string | null;
  articleTitle: string | null;
  articlePublishedAt: string | null;
  contentDigest: string | null;
  titleSimilarity: number;
  matchedTitleTokens: string[];
  reason: string;
};

type SearchResult = { url: string; title: string };

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_USER_AGENT = "NigeriaAttackTracker/1.0 (+direct source resolver)";
const DEFAULT_SEARCH_DELAY_MS = 350;
const DEFAULT_MAX_SEARCH_RESULTS = 6;
const MAX_HTML_CHARS = 300_000;
const GOOGLE_HOSTS = new Set(["google.com", "news.google.com", "vertexaisearch.cloud.google.com"]);
const SEARCH_OR_SOCIAL_HOSTS = [
  "bing.com",
  "duckduckgo.com",
  "search.brave.com",
  "yahoo.com",
  "facebook.com",
  "x.com",
  "twitter.com",
  "t.co",
];
const INVALID_EXTENSIONS = new Set([
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".pdf", ".json", ".xml", ".ico",
]);
const TITLE_STOPWORDS = new Set([
  "about", "after", "again", "against", "and", "are", "attack", "attacks", "been", "before",
  "from", "has", "have", "into", "more", "nigeria", "nigerian", "over", "reported", "reports",
  "state", "states", "that", "the", "their", "this", "were", "with",
]);

const PUBLISHER_DOMAIN_HINTS: Array<[string, string]> = [
  ["premium times", "premiumtimesng.com"],
  ["premiumtimes", "premiumtimesng.com"],
  ["the cable", "thecable.ng"],
  ["thecable", "thecable.ng"],
  ["channels", "channelstv.com"],
  ["punch", "punchng.com"],
  ["vanguard", "vanguardngr.com"],
  ["daily trust", "dailytrust.com"],
  ["humangle", "humanglemedia.com"],
  ["guardian nigeria", "guardian.ng"],
  ["guardian", "guardian.ng"],
  ["daily post", "dailypost.ng"],
  ["sahara reporters", "saharareporters.com"],
  ["news central", "newscentral.africa"],
  ["thisday", "thisdaylive.com"],
  ["the nation", "thenationonlineng.net"],
  ["nation nigeria", "thenationonlineng.net"],
  ["leadership", "leadership.ng"],
  ["sun nigeria", "sunnewsonline.com"],
  ["sun news", "sunnewsonline.com"],
  ["tribune", "tribuneonlineng.com"],
  ["blueprint", "blueprint.ng"],
  ["business day", "businessday.ng"],
  ["the whistler", "thewhistler.ng"],
  ["icir", "icirnigeria.org"],
  ["ripples nigeria", "ripplesnigeria.com"],
  ["daily nigerian", "dailynigerian.com"],
  ["pr nigeria", "prnigeria.com"],
  ["prnigeria", "prnigeria.com"],
  ["parallel facts", "parallelfactsnews.com"],
  ["tvc news", "tvcnews.tv"],
  ["tvc", "tvcnews.tv"],
  ["arise news", "arise.tv"],
  ["arise", "arise.tv"],
  ["pulse nigeria", "pulse.ng"],
  ["pulse", "pulse.ng"],
  ["zagazola", "network.zagazola.org"],
  ["al jazeera", "aljazeera.com"],
  ["bbc", "bbc.com"],
  ["reuters", "reuters.com"],
  ["associated press", "apnews.com"],
  ["ap news", "apnews.com"],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNewsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    parsed.hash = "";
    if ((parsed.protocol === "http:" && parsed.port === "80") || (parsed.protocol === "https:" && parsed.port === "443")) {
      parsed.port = "";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function domainFromNewsUrl(value: string | null | undefined): string | null {
  const normalized = normalizeNewsUrl(value);
  if (!normalized) return null;
  try {
    return new URL(normalized).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function publisherDomainHint(publisher: string | null | undefined): string | null {
  const raw = stringValue(publisher).trim().toLowerCase().replace(/^www\./i, "");
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw)) return raw;
  const normalized = stringValue(publisher).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return null;
  return PUBLISHER_DOMAIN_HINTS.find(([label]) => normalized.includes(label))?.[1] || null;
}

export function isGoogleNewsUrl(value: string | null | undefined): boolean {
  const normalized = normalizeNewsUrl(value);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return GOOGLE_HOSTS.has(host) || host.endsWith(".google.com") || host.endsWith(".googleusercontent.com");
  } catch {
    return false;
  }
}

function isSearchOrSocialHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./i, "").toLowerCase();
  return SEARCH_OR_SOCIAL_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

export function isUsableNewsArticleUrl(value: string | null | undefined): boolean {
  const normalized = normalizeNewsUrl(value);
  if (!normalized || isGoogleNewsUrl(normalized)) return false;
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    if (isSearchOrSocialHost(host)) return false;
    if (!pathname || pathname === "/" || pathname.length < 4) return false;
    if ([...INVALID_EXTENSIONS].some((extension) => pathname.endsWith(extension))) return false;
    if (/\/(?:search|tag|category|author|feed)(?:\/|$)/i.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

function sameOrSubdomain(actual: string | null, expected: string | null): boolean {
  if (!expected || !actual) return true;
  const normalizedExpected = expected.replace(/^www\./i, "").toLowerCase();
  return actual === normalizedExpected || actual.endsWith(`.${normalizedExpected}`);
}

function domainHint(value: string | null | undefined): string | null {
  const fromUrl = domainFromNewsUrl(value);
  if (fromUrl) return fromUrl;
  const raw = stringValue(value).trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw) ? raw.replace(/^www\./i, "") : null;
}

function parseAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes.set(match[1].toLowerCase(), decodeHtml(match[2] || match[3] || match[4] || ""));
  }
  return attributes;
}

function metaValue(html: string, names: string[]): string | null {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const key = (attributes.get("property") || attributes.get("name") || "").toLowerCase();
    if (wanted.has(key)) return attributes.get("content") || null;
  }
  return null;
}

function canonicalLink(html: string): string | null {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const rel = (attributes.get("rel") || "").toLowerCase().split(/\s+/);
    if (rel.includes("canonical")) return normalizeNewsUrl(attributes.get("href"));
  }
  return null;
}

function refreshUrl(html: string): string | null {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if ((attributes.get("http-equiv") || "").toLowerCase() !== "refresh") continue;
    const content = attributes.get("content") || "";
    const target = content.match(/url\s*=\s*(.+)$/i)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
    if (target) return normalizeNewsUrl(target);
  }
  return null;
}

function htmlTitle(html: string): string | null {
  const title = metaValue(html, ["og:title", "twitter:title"])
    || decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  return title || null;
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getUTCFullYear();
  if (year < 2015 || year > new Date().getUTCFullYear() + 1) return null;
  return parsed.toISOString();
}

function articleText(html: string): string {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).slice(0, 60_000);
}

export function extractNewsArticleMetadata(html: string, finalUrl: string | null = null): NewsArticleMetadata {
  const description = metaValue(html, ["description", "og:description", "twitter:description"]);
  const publishedAt = parseDate(
    metaValue(html, [
      "article:published_time", "article:published", "datepublished", "datepublished", "publishdate",
      "parsely-pub-date", "pubdate",
    ])
      || html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1]
      || html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]
      || null,
  );
  return {
    title: htmlTitle(html),
    description: description ? decodeHtml(description) : null,
    canonicalUrl: canonicalLink(html) || normalizeNewsUrl(metaValue(html, ["og:url"])) || refreshUrl(html) || finalUrl,
    publishedAt,
    text: articleText(html),
  };
}

function titleTokens(value: string): string[] {
  return [...new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !TITLE_STOPWORDS.has(token)),
  )];
}

function titleMatch(expected: string, actual: string | null): { score: number; matched: string[] } {
  const expectedTokens = titleTokens(expected);
  const actualTokens = new Set(titleTokens(actual || ""));
  const matched = expectedTokens.filter((token) => actualTokens.has(token));
  if (!expectedTokens.length || !actualTokens.size) return { score: 0, matched };
  return { score: matched.length / expectedTokens.length, matched };
}

function contentDigest(text: string): string | null {
  if (text.length < 80) return null;
  return crypto.createHash("sha256").update(text).digest("hex");
}

function classifyHttpStatus(status: number | null): NewsFetchStatus {
  if (status === null) return "FAIL";
  if (status === 401 || status === 403 || status === 408 || status === 429) return "BLOCKED";
  if (status >= 200 && status < 400) return "PARTIAL";
  if (status >= 500) return "FAIL";
  return "BLOCKED";
}

async function fetchPage(url: string, settings: ResolvedSettings): Promise<PageFetch> {
  const normalized = normalizeNewsUrl(url);
  if (!normalized) {
    return { requestedUrl: url, status: null, finalUrl: null, contentType: null, html: "", error: "INVALID_URL" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), settings.timeoutMs);
  try {
    const response = await fetch(normalized, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": settings.userAgent,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
      },
    });
    const contentType = response.headers.get("content-type");
    const html = /html|xhtml|text|xml/i.test(contentType || "")
      ? (await response.text()).slice(0, MAX_HTML_CHARS)
      : "";
    return {
      requestedUrl: normalized,
      status: response.status,
      finalUrl: normalizeNewsUrl(response.url || normalized),
      contentType,
      html,
      error: null,
    };
  } catch (error) {
    return {
      requestedUrl: normalized,
      status: null,
      finalUrl: normalized,
      contentType: null,
      html: "",
      error: error instanceof Error ? error.name : "FETCH_ERROR",
    };
  } finally {
    clearTimeout(timer);
  }
}

function assessPage(
  page: PageFetch,
  headline: string,
  expectedDomain: string | null,
): PageAssessment {
  const fetchStatus = classifyHttpStatus(page.status);
  const finalDomain = domainFromNewsUrl(page.finalUrl);
  if (fetchStatus === "BLOCKED" || fetchStatus === "FAIL") {
    return {
      fetchStatus,
      finalUrl: page.finalUrl,
      canonicalUrl: null,
      contentType: page.contentType,
      articleTitle: null,
      articlePublishedAt: null,
      contentDigest: null,
      titleSimilarity: 0,
      matchedTitleTokens: [],
      reason: page.error || `HTTP_${page.status ?? "NO_RESPONSE"}`,
    };
  }

  if (!isUsableNewsArticleUrl(page.finalUrl) || !sameOrSubdomain(finalDomain, expectedDomain)) {
    return {
      fetchStatus: "BLOCKED",
      finalUrl: page.finalUrl,
      canonicalUrl: null,
      contentType: page.contentType,
      articleTitle: null,
      articlePublishedAt: null,
      contentDigest: null,
      titleSimilarity: 0,
      matchedTitleTokens: [],
      reason: isGoogleNewsUrl(page.finalUrl) ? "GOOGLE_NEWS_WRAPPER_DID_NOT_RESOLVE" : "FINAL_URL_NOT_EXPECTED_PUBLISHER_ARTICLE",
    };
  }

  if (!/html|xhtml/i.test(page.contentType || "")) {
    return {
      fetchStatus: "FAIL",
      finalUrl: page.finalUrl,
      canonicalUrl: null,
      contentType: page.contentType,
      articleTitle: null,
      articlePublishedAt: null,
      contentDigest: null,
      titleSimilarity: 0,
      matchedTitleTokens: [],
      reason: "DIRECT_SOURCE_IS_NOT_HTML",
    };
  }

  const metadata = extractNewsArticleMetadata(page.html, page.finalUrl);
  const match = titleMatch(headline, metadata.title);
  const sufficientTitleMatch = match.matched.length >= Math.min(2, titleTokens(headline).length) && match.score >= 0.3;
  const sufficientContent = metadata.text.length >= 120 || Boolean(metadata.description && metadata.description.length >= 80);
  const contentDigestValue = contentDigest(metadata.text);
  const pass = sufficientTitleMatch && sufficientContent;
  return {
    fetchStatus: pass ? "PASS" : "PARTIAL",
    finalUrl: page.finalUrl,
    canonicalUrl: metadata.canonicalUrl,
    contentType: page.contentType,
    articleTitle: metadata.title,
    articlePublishedAt: metadata.publishedAt,
    contentDigest: contentDigestValue,
    titleSimilarity: match.score,
    matchedTitleTokens: match.matched,
    reason: pass ? "DIRECT_ARTICLE_FETCHED_AND_TITLE_MATCHED" : "DIRECT_ARTICLE_FETCHED_BUT_EVIDENCE_MATCH_WAS_PARTIAL",
  };
}

function directCandidateUrl(value: string | null | undefined, expectedDomain: string | null): string | null {
  const normalized = normalizeNewsUrl(value);
  if (!isUsableNewsArticleUrl(normalized)) return null;
  const domain = domainFromNewsUrl(normalized);
  return sameOrSubdomain(domain, expectedDomain) ? normalized : null;
}

function directUrlsFromGoogleHtml(html: string, expectedDomain: string | null): string[] {
  const values = [
    canonicalLink(html),
    normalizeNewsUrl(metaValue(html, ["og:url"])),
    refreshUrl(html),
  ];
  return [...new Set(values.map((value) => directCandidateUrl(value, expectedDomain)).filter((value): value is string => Boolean(value)))];
}

function makeAttempt(
  method: NewsResolutionAttempt["method"],
  page: PageFetch,
  assessment: PageAssessment,
): NewsResolutionAttempt {
  return {
    method,
    requestedUrl: page.requestedUrl,
    finalUrl: assessment.finalUrl,
    httpStatus: page.status,
    fetchStatus: assessment.fetchStatus,
    titleSimilarity: assessment.titleSimilarity,
    reason: assessment.reason,
  };
}

function emptyResolution(lead: NewsLead, expectedDomain: string | null, reason: string): NewsResolution {
  return {
    googleNewsUrl: normalizeNewsUrl(lead.googleNewsUrl) || lead.googleNewsUrl,
    sourceUrl: normalizeNewsUrl(lead.sourceUrl),
    resolvedSourceUrl: null,
    resolutionStatus: "UNRESOLVED",
    resolutionMethod: "NONE",
    directFetchStatus: "NOT_ATTEMPTED",
    httpStatus: null,
    finalUrl: null,
    canonicalUrl: null,
    contentType: null,
    articleTitle: null,
    articlePublishedAt: null,
    contentDigest: null,
    titleSimilarity: 0,
    matchedTitleTokens: [],
    expectedPublisherDomain: expectedDomain,
    reason,
    attempts: [],
  };
}

function betterAssessment(current: PageAssessment | null, next: PageAssessment): PageAssessment {
  if (!current) return next;
  const currentRank = current.fetchStatus === "PASS" ? 3 : current.fetchStatus === "PARTIAL" ? 2 : 1;
  const nextRank = next.fetchStatus === "PASS" ? 3 : next.fetchStatus === "PARTIAL" ? 2 : 1;
  if (nextRank !== currentRank) return nextRank > currentRank ? next : current;
  return next.titleSimilarity > current.titleSimilarity ? next : current;
}

function assessmentResolution(
  lead: NewsLead,
  expectedDomain: string | null,
  method: NewsResolutionMethod,
  assessment: PageAssessment,
  attempts: NewsResolutionAttempt[],
): NewsResolution {
  const resolvedUrl = directCandidateUrl(assessment.canonicalUrl, expectedDomain)
    || directCandidateUrl(assessment.finalUrl, expectedDomain);
  const status: NewsResolutionStatus = assessment.fetchStatus === "PASS"
    ? "PASS"
    : assessment.fetchStatus === "BLOCKED"
      ? "BLOCKED"
      : assessment.fetchStatus === "FAIL"
        ? "FAIL"
        : "UNRESOLVED";
  return {
    googleNewsUrl: normalizeNewsUrl(lead.googleNewsUrl) || lead.googleNewsUrl,
    sourceUrl: normalizeNewsUrl(lead.sourceUrl),
    resolvedSourceUrl: resolvedUrl,
    resolutionStatus: status,
    resolutionMethod: method,
    directFetchStatus: assessment.fetchStatus,
    httpStatus: attempts.at(-1)?.httpStatus ?? null,
    finalUrl: assessment.finalUrl,
    canonicalUrl: assessment.canonicalUrl,
    contentType: assessment.contentType,
    articleTitle: assessment.articleTitle,
    articlePublishedAt: assessment.articlePublishedAt,
    contentDigest: assessment.contentDigest,
    titleSimilarity: assessment.titleSimilarity,
    matchedTitleTokens: assessment.matchedTitleTokens,
    expectedPublisherDomain: expectedDomain,
    reason: assessment.reason,
    attempts,
  };
}

function parseSearchHref(value: string): string | null {
  const decoded = decodeHtml(value);
  try {
    const parsed = new URL(decoded, "https://duckduckgo.com");
    if (parsed.hostname.endsWith("duckduckgo.com") && parsed.pathname === "/l/") {
      return normalizeNewsUrl(parsed.searchParams.get("uddg"));
    }
    return normalizeNewsUrl(parsed.toString());
  } catch {
    return null;
  }
}

function parseDuckDuckGoResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const match of html.matchAll(/<a\b[^>]*class=["'][^"']*result__a[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const tag = match[0];
    const href = parseSearchHref(parseAttributes(tag).get("href") || "");
    const title = decodeHtml(match[1].replace(/<[^>]+>/g, " "));
    if (href && title) results.push({ url: href, title });
  }
  return results;
}

function parsePublisherSearchResults(html: string, expectedDomain: string): SearchResult[] {
  const results: SearchResult[] = [];
  for (const match of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const attributes = parseAttributes(match[0]);
    const url = directCandidateUrl(attributes.get("href"), expectedDomain);
    if (!url) continue;
    const title = decodeHtml(match[1].replace(/<[^>]+>/g, " "));
    if (!title || /^(read more|continue reading|click here|home|menu)$/i.test(title)) continue;
    if (results.some((result) => result.url === url)) continue;
    results.push({ url, title });
    if (results.length >= 12) break;
  }
  return results;
}

async function publisherSiteSearch(
  headline: string,
  expectedDomain: string,
  settings: ResolvedSettings,
): Promise<SearchResult[]> {
  const encodedTitle = encodeURIComponent(headline.slice(0, 160));
  const endpoints = [
    `https://${expectedDomain}/?s=${encodedTitle}`,
    `https://${expectedDomain}/search/${encodeURIComponent(headline.slice(0, 100))}/`,
  ];
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  for (const endpoint of endpoints) {
    const page = await fetchPage(endpoint, settings);
    if (page.status === null || page.status < 200 || page.status >= 400) continue;
    for (const result of parsePublisherSearchResults(page.html, expectedDomain)) {
      if (seen.has(result.url)) continue;
      seen.add(result.url);
      results.push(result);
    }
    if (results.length >= settings.maxSearchResults) break;
  }
  return results.slice(0, settings.maxSearchResults);
}

async function duckDuckGoSearch(query: string, settings: ResolvedSettings): Promise<SearchResult[]> {
  const endpoint = new URL("https://html.duckduckgo.com/html/");
  endpoint.searchParams.set("q", query);
  const page = await fetchPage(endpoint.toString(), settings);
  if (page.status === null || page.status < 200 || page.status >= 400) return [];
  return parseDuckDuckGoResults(page.html).slice(0, settings.maxSearchResults);
}

async function braveSearch(query: string, settings: ResolvedSettings): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];
  const endpoint = new URL("https://api.search.brave.com/res/v1/web/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", String(settings.maxSearchResults));
  endpoint.searchParams.set("country", "ALL");
  try {
    const response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        "x-subscription-token": apiKey,
        "user-agent": settings.userAgent,
      },
      signal: AbortSignal.timeout(settings.timeoutMs),
    });
    if (!response.ok) return [];
    const data: unknown = await response.json();
    const web = isRecord(data) && isRecord(data.web) ? data.web : null;
    const rawResults = web && Array.isArray(web.results) ? web.results : [];
    return rawResults
      .filter(isRecord)
      .map((result) => ({ url: stringValue(result.url), title: stringValue(result.title) }))
      .filter((result) => Boolean(result.url && result.title))
      .slice(0, settings.maxSearchResults);
  } catch {
    return [];
  }
}

async function externalPublisherSearch(
  headline: string,
  expectedDomain: string,
  settings: ResolvedSettings,
): Promise<SearchResult[]> {
  const provider = settings.searchProvider === "auto"
    ? (process.env.BRAVE_SEARCH_API_KEY ? "brave" : "duckduckgo")
    : settings.searchProvider;
  if (provider === "none") return [];
  const exactQuery = `site:${expectedDomain} "${headline.replace(/"/g, "").slice(0, 180)}"`;
  const tokenQuery = `site:${expectedDomain} ${titleTokens(headline).slice(0, 8).join(" ")}`;
  const queries = tokenQuery === `site:${expectedDomain} ` ? [exactQuery] : [exactQuery, tokenQuery];
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  for (const query of queries) {
    const batch = provider === "brave" ? await braveSearch(query, settings) : await duckDuckGoSearch(query, settings);
    for (const result of batch) {
      const normalized = normalizeNewsUrl(result.url);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      results.push({ ...result, url: normalized });
    }
    if (results.length >= settings.maxSearchResults) break;
  }
  return results.slice(0, settings.maxSearchResults);
}

async function resolveUncached(
  lead: NewsLead,
  settings: ResolvedSettings,
  searchPublisherTitles: (headline: string, domain: string) => Promise<SearchResult[]>,
): Promise<NewsResolution> {
  const expectedDomain = domainHint(lead.sourceDomain)
    || domainFromNewsUrl(lead.sourceUrl)
    || publisherDomainHint(lead.publisher);
  const base = emptyResolution(lead, expectedDomain, "NO_DIRECT_SOURCE_ATTEMPTED");
  const attempts: NewsResolutionAttempt[] = [];
  const bestState: { current: { method: NewsResolutionMethod; assessment: PageAssessment } | null } = { current: null };

  const tryUrl = async (url: string, method: NewsResolutionMethod): Promise<NewsResolution | null> => {
    const page = await fetchPage(url, settings);
    const assessment = assessPage(page, lead.headline, expectedDomain);
    attempts.push(makeAttempt(method, page, assessment));
    bestState.current = betterAssessment(bestState.current?.assessment || null, assessment) === assessment
      ? { method, assessment }
      : bestState.current;
    if (assessment.fetchStatus === "PASS") return assessmentResolution(lead, expectedDomain, method, assessment, attempts);

    const canonical = directCandidateUrl(assessment.canonicalUrl, expectedDomain);
    if (canonical && canonical !== assessment.finalUrl && method !== "CANONICAL_TAG") {
      const canonicalPage = await fetchPage(canonical, settings);
      const canonicalAssessment = assessPage(canonicalPage, lead.headline, expectedDomain);
      attempts.push(makeAttempt("CANONICAL_TAG", canonicalPage, canonicalAssessment));
      bestState.current = betterAssessment(bestState.current?.assessment || null, canonicalAssessment) === canonicalAssessment
        ? { method: "CANONICAL_TAG", assessment: canonicalAssessment }
        : bestState.current;
      if (canonicalAssessment.fetchStatus === "PASS") {
        return assessmentResolution(lead, expectedDomain, "CANONICAL_TAG", canonicalAssessment, attempts);
      }
    }
    return null;
  };

  const rssSource = directCandidateUrl(lead.sourceUrl, expectedDomain);
  if (rssSource) {
    const resolved = await tryUrl(rssSource, "RSS_SOURCE_URL");
    if (resolved) return resolved;
  }

  const googleUrl = normalizeNewsUrl(lead.googleNewsUrl);
  if (!googleUrl) return { ...base, reason: "MISSING_OR_INVALID_GOOGLE_NEWS_URL" };
  const googlePage = await fetchPage(googleUrl, settings);
  const googleAssessment = assessPage(googlePage, lead.headline, expectedDomain);
  attempts.push(makeAttempt("GOOGLE_REDIRECT_CHECK", googlePage, googleAssessment));
  if (googleAssessment.fetchStatus === "PASS" && !isGoogleNewsUrl(googleAssessment.finalUrl)) {
    return assessmentResolution(lead, expectedDomain, "HTTP_REDIRECT", googleAssessment, attempts);
  }

  for (const candidate of directUrlsFromGoogleHtml(googlePage.html, expectedDomain)) {
    const resolved = await tryUrl(candidate, "CANONICAL_TAG");
    if (resolved) return resolved;
  }

  if (settings.titleSearch && expectedDomain) {
    const siteResults = await publisherSiteSearch(lead.headline, expectedDomain, settings);
    for (const result of siteResults) {
      const candidate = directCandidateUrl(result.url, expectedDomain);
      if (!candidate) continue;
      const resolved = await tryUrl(candidate, "PUBLISHER_SITE_SEARCH");
      if (resolved) return resolved;
    }

    const results = await searchPublisherTitles(lead.headline, expectedDomain);
    for (const result of results) {
      const candidate = directCandidateUrl(result.url, expectedDomain);
      if (!candidate) continue;
      const resolved = await tryUrl(candidate, "PUBLISHER_TITLE_SEARCH");
      if (resolved) return resolved;
    }
    const fallback = bestState.current?.assessment;
    if (fallback) {
      return assessmentResolution(lead, expectedDomain, "PUBLISHER_TITLE_SEARCH", fallback, attempts);
    }
    return {
      ...base,
      resolutionStatus: "UNRESOLVED",
      reason: siteResults.length ? "PUBLISHER_ARTICLE_MATCH_NOT_CONFIRMED" : "PUBLISHER_TITLE_SEARCH_NO_MATCH",
      attempts,
    };
  }

  const fallback = bestState.current?.assessment;
  if (fallback) {
    const fallbackMethod = bestState.current?.method || "NONE";
    const result = assessmentResolution(lead, expectedDomain, fallbackMethod, fallback, attempts);
    return {
      ...result,
      reason: fallback.reason === "GOOGLE_NEWS_WRAPPER_DID_NOT_RESOLVE"
        ? "GOOGLE_NEWS_WRAPPER_DID_NOT_RESOLVE_TO_DIRECT_ARTICLE"
        : fallback.reason,
    };
  }
  return {
    ...base,
    reason: settings.titleSearch ? "NO_USABLE_DIRECT_SOURCE_FOUND" : "TITLE_SEARCH_DISABLED_AFTER_GOOGLE_NEWS_CHECK",
    attempts,
  };
}

export function createNewsLeadResolver(options: NewsResolverOptions = {}): NewsLeadResolver {
  const settings: ResolvedSettings = {
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    userAgent: options.userAgent ?? DEFAULT_USER_AGENT,
    titleSearch: options.titleSearch ?? false,
    searchProvider: options.searchProvider ?? "auto",
    searchDelayMs: options.searchDelayMs ?? DEFAULT_SEARCH_DELAY_MS,
    maxSearchResults: options.maxSearchResults ?? DEFAULT_MAX_SEARCH_RESULTS,
  };
  const cache = new Map<string, Promise<NewsResolution>>();
  let searchQueue: Promise<void> = Promise.resolve();
  let lastSearchAt = 0;

  const searchPublisherTitles = (headline: string, domain: string): Promise<SearchResult[]> => {
    const run = searchQueue.then(async () => {
      const waitMs = settings.searchDelayMs - (Date.now() - lastSearchAt);
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
      lastSearchAt = Date.now();
      return externalPublisherSearch(headline, domain, settings);
    });
    // Keep title-search calls serialized so one audit run cannot burst the
    // publisher/search endpoint.
    searchQueue = run.then(() => undefined, () => undefined);
    return run;
  };

  const resolve = (lead: NewsLead): Promise<NewsResolution> => {
    const key = normalizeNewsUrl(lead.googleNewsUrl) || normalizeNewsUrl(lead.sourceUrl) || lead.googleNewsUrl;
    const cached = cache.get(key);
    if (cached) return cached;
    const pending = resolveUncached(lead, settings, searchPublisherTitles);
    cache.set(key, pending);
    return pending;
  };

  return { resolve };
}
