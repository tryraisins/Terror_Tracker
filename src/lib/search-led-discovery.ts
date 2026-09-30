/**
 * Search-engine-led discovery + free (non-AI) ingestion.
 *
 * Replaces the Gemini/VertexAI discovery path with a free-first search strategy
 * that mirrors the whole-year backfill: DuckDuckGo/Bing HTML search for free,
 * Brave Search API only as a fallback, direct article fetch with a Jina reader
 * fallback for 403s, and regex extraction of the incident fields. Ingestion
 * uses a SHA-256 dedup guard with source-URL and same-town/date checks. Optional
 * DeepSeek cleanup can confirm candidates when configured.
 */

import crypto from "crypto";
import Attack from "./models/Attack";
import { NewsDiscoveryProvider, NewsDiscoveryResult, searchNews } from "./news-discovery";
import {
  RawAttackData,
  dateFromText,
  extractArticleParts,
  extractCasualtyAssessment,
  extractGroup,
  extractLocation,
  extractPublishedAt,
  extractState,
  hasSecurityIncidentSignal,
  sourceLedAdmissionRejection,
} from "./free-news";
import { screenIncidentCandidate } from "./incident-scope";
import { CasualtyMetadata, normalizeCasualtyFields } from "./incident-uncertainty";
import { isSuppressedSourceHost } from "./news-source-registry";
import { cleanAndConfirmIncident, isDeepSeekCleanupEnabled } from "./deepseek";

export interface SearchLedReport {
  windowStart: string;
  windowEnd: string;
  lookbackHours: number;
  queriesRun: number;
  urlsDiscovered: number;
  urlsFetched: number;
  fetchRetries: number;
  fetchFailures: Array<{ url: string; error: string }>;
  searchFailures: Array<{ state: string; provider: NewsDiscoveryProvider; status: string; reason: string }>;
  candidates: number;
  rejected: number;
  rejectionReasons: Record<string, number>;
  reviewLeads: Array<{ url: string; title: string; publisher: string; reason: string }>;
  errors: number;
  braveFallbackCalls: number;
  deepseekCalls: number;
  deepseekConfirmed: number;
  deepseekRejected: number;
  deepseekErrors: number;
  deepseekReviewRequired: number;
}

export interface SearchLedIngestResult {
  inserted: number;
  merged: number;
  errors: number;
  reviewRequired: Array<{ url: string; candidateTitle: string; existingId: string; reason: string }>;
}

interface ArticleParts {
  title: string;
  description: string;
  lead: string;
  text: string;
}

const FETCH_TIMEOUT_MS = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 8000);
const SEARCH_RESULTS_PER_QUERY = Number(process.env.SEARCH_RESULTS_PER_QUERY || 10);
const SEARCH_FRESHNESS = (process.env.SEARCH_FRESHNESS as "day" | "week" | "month" | undefined) || "week";
const SEARCH_PUBLICATION_MAX_AGE_HOURS = Math.max(1, Number(process.env.SEARCH_PUBLICATION_MAX_AGE_HOURS || 168));
const ARTICLE_FETCH_CONCURRENCY = Math.max(1, Math.min(8, Number(process.env.FREE_SOURCE_CONCURRENCY || 4)));
const STATE_SCAN_CONCURRENCY = Math.max(1, Number(process.env.STATE_SCAN_CONCURRENCY || 3));
const BRAVE_CALL_LIMIT = Number(process.env.BRAVE_SEARCH_MAX_CALLS_PER_RUN || 40);
const USER_AGENT = "NigeriaAttackTracker/1.0 (+search-led OSINT collector)";

function buildQuery(state: string): string {
  // Keep the query Nigeria-specific and include victim outcomes as well as
  // attacker/event terms so reports are not missed when headlines omit "attack".
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `Nigeria "${state}" attack OR ambush OR kidnapping OR abduction OR killed OR injured ${month} ${now.getUTCFullYear()}`;
}

export function isPublishedWithinDiscoveryHorizon(
  publishedAt: Date,
  latestAllowedMs: number,
  maxAgeHours = SEARCH_PUBLICATION_MAX_AGE_HOURS,
): boolean {
  const publishedMs = publishedAt.getTime();
  return Number.isFinite(publishedMs) && publishedMs <= latestAllowedMs && publishedMs >= latestAllowedMs - maxAgeHours * 3_600_000;
}

export function isTransientArticleFetchStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function hashFor(candidate: RawAttackData): string {
  const title = (candidate.title || "").trim().toLowerCase();
  const dateStr = new Date(candidate.date).toISOString().slice(0, 10);
  const state = (candidate.location.state || "").trim().toLowerCase();
  const lga = (candidate.location.lga || "").trim().toLowerCase();
  const town = (candidate.location.town || "").trim().toLowerCase();
  return crypto.createHash("sha256").update(`${title}|${dateStr}|${state}|${lga}|${town}`).digest("hex");
}

function normalizeSourceUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|source)$/i.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.trim().replace(/\/+$/, "").toLowerCase();
  }
}

function normalizeLocationName(value: string): string[] {
  const cleaned = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/\b(town|village|community|area|settlement|the)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ");
  const ignored = new Set(["near", "of", "in", "at"]);
  return [...new Set(cleaned.split(/\s+/).filter((part) => part.length > 1 && !ignored.has(part)))].sort();
}

function sameSpecificLocation(a: string, b: string): boolean {
  const left = normalizeLocationName(a);
  const right = normalizeLocationName(b);
  if (!left.length || !right.length) return false;
  const shared = left.filter((part) => right.includes(part)).length;
  const ratio = shared / Math.max(left.length, right.length);
  return ratio >= 0.8 && Math.abs(left.length - right.length) <= 1;
}

function casualtiesCompatible(a: RawAttackData["casualties"], b: RawAttackData["casualties"]): boolean {
  return (["killed", "injured", "kidnapped", "displaced"] as const).every((field) =>
    a?.[field] == null || b?.[field] == null || a[field] === b[field],
  );
}

function utcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function sharedSourceUrl(candidateUrls: string[], existing: Array<{ url?: string }>): boolean {
  const known = new Set((existing || []).map((source) => normalizeSourceUrl(source.url || "")));
  return candidateUrls.some((url) => known.has(url));
}

function mergeSourceMetadata(
  existing: Array<{ url: string; title?: string; publisher?: string; publishedAt?: Date | string | null; toObject?: () => Record<string, unknown> }>,
  incoming: RawAttackData["sources"],
): { sources: Array<Record<string, unknown>>; changed: boolean } {
  const sources = (existing || []).map((source) =>
    typeof source.toObject === "function" ? source.toObject() : { ...source },
  );
  let changed = false;
  for (const source of incoming || []) {
    const key = normalizeSourceUrl(source.url);
    if (!key) continue;
    const match = sources.find((item) => normalizeSourceUrl(String(item.url || "")) === key);
    if (!match) {
      sources.push({
        url: source.url,
        title: source.title || "",
        publisher: source.publisher || "",
        publishedAt: source.publishedAt ? new Date(source.publishedAt) : null,
      });
      changed = true;
    } else if (!match.publishedAt && source.publishedAt) {
      match.publishedAt = new Date(source.publishedAt);
      changed = true;
    }
  }
  return { sources, changed };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function discoverForQuery(
  query: string,
  state: string,
  providers: NewsDiscoveryProvider[],
  budget: { braveCalls: number },
  report: SearchLedReport,
): Promise<{ results: NewsDiscoveryResult[]; braveFallbackUsed: boolean }> {
  for (const provider of providers) {
    if (provider === "brave" && (!process.env.BRAVE_SEARCH_API_KEY || budget.braveCalls >= BRAVE_CALL_LIMIT)) continue;
    if (provider === "brave") budget.braveCalls++;
    const res = await searchNews(query, { providers: provider, maxResults: SEARCH_RESULTS_PER_QUERY, freshness: SEARCH_FRESHNESS });
    for (const receipt of res.receipts) {
      if (receipt.status === "FAIL" || receipt.status === "BLOCKED") {
        report.searchFailures.push({ state, provider: receipt.provider, status: receipt.status, reason: receipt.reason });
      }
    }
    if (res.results.length > 0) return { results: res.results, braveFallbackUsed: provider === "brave" };
  }
  return { results: [], braveFallbackUsed: false };
}

function absorbResults(
  results: NewsDiscoveryResult[],
  seenUrls: Set<string>,
  report: SearchLedReport,
): Array<{ url: string; title: string; publisher: string }> {
  const urls: Array<{ url: string; title: string; publisher: string }> = [];
  for (const r of results) {
    if (seenUrls.has(r.url)) continue;
    if (isSuppressedSourceHost(r.url)) continue;
    seenUrls.add(r.url);
    report.urlsDiscovered++;
    urls.push({ url: r.url, title: r.title, publisher: r.publisher });
  }
  return urls;
}

/** Fisher-Yates shuffle so the capped Brave fallback rotates across states. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function applyDeepSeekCleanup(
  candidate: RawAttackData,
  parts: ArticleParts,
  report: SearchLedReport,
  minMs: number,
  maxMs: number,
): Promise<RawAttackData[] | null> {
  const multiEventSignal = /\b(?:separate attacks?|separate incidents?|another separate|in separate|across (?:several|multiple|two|three|four) (?:communities|villages|states|locations)|in different (?:communities|villages|locations|states))\b/i.test(`${parts.title}. ${parts.lead}. ${parts.text}`);
  if (!isDeepSeekCleanupEnabled()) {
    if (multiEventSignal) {
      report.deepseekReviewRequired++;
      report.reviewLeads.push({ url: candidate.sources[0]?.url || "", title: candidate.title, publisher: candidate.sources[0]?.publisher || "", reason: "Multiple incidents indicated but DeepSeek cleanup is disabled" });
      return null;
    }
    return [candidate];
  }
  report.deepseekCalls++;
  const result = await cleanAndConfirmIncident(candidate, `${parts.title}. ${parts.lead}. ${parts.text}`);
  if (result.fallback) {
    report.deepseekErrors++;
    if (multiEventSignal) {
      report.deepseekReviewRequired++;
      report.reviewLeads.push({ url: candidate.sources[0]?.url || "", title: candidate.title, publisher: candidate.sources[0]?.publisher || "", reason: "Multiple incidents indicated but DeepSeek cleanup failed" });
      return null;
    }
    return [result.incident ?? candidate];
  }
  if (result.reviewRequired) {
    report.deepseekReviewRequired++;
    report.reviewLeads.push({ url: candidate.sources[0]?.url || "", title: candidate.title, publisher: candidate.sources[0]?.publisher || "", reason: result.reason });
    return null;
  }
  const incidents = result.incidents || (result.incident ? [result.incident] : []);
  if (!result.confirmed || incidents.length === 0) {
    report.deepseekRejected++;
    if (process.env.SEARCH_LED_DEBUG === "true") console.log(`[search-led] deepseek rejected (${result.reason}): ${candidate.title}`);
    return null;
  }
  if (multiEventSignal && incidents.length < 2) {
    report.deepseekReviewRequired++;
    report.reviewLeads.push({ url: candidate.sources[0]?.url || "", title: candidate.title, publisher: candidate.sources[0]?.publisher || "", reason: "Article signals separate incidents but DeepSeek returned a single event" });
    return null;
  }
  for (const incident of incidents) {
    const ts = new Date(incident.date).getTime();
    // Allow a 24h grace window beyond the configured lookback for the event date
    // when a recently published report describes a delayed-reported incident.
    if (Number.isNaN(ts) || ts < minMs - 24 * 3_600_000 || ts > maxMs) {
      report.deepseekReviewRequired++;
      report.reviewLeads.push({ url: candidate.sources[0]?.url || "", title: candidate.title, publisher: candidate.sources[0]?.publisher || "", reason: `Event date outside the active scan window: ${incident.date}` });
      return null;
    }
  }
  report.deepseekConfirmed++;
  return incidents;
}

async function fetchAndExtract(
  urls: Array<{ url: string; title: string; publisher: string }>,
  report: SearchLedReport,
  minMs: number,
  maxMs: number,
): Promise<RawAttackData[]> {
  const found: RawAttackData[] = [];
  for (let j = 0; j < urls.length; j += ARTICLE_FETCH_CONCURRENCY) {
    const chunk = urls.slice(j, j + ARTICLE_FETCH_CONCURRENCY);
    await Promise.all(
      chunk.map(async (u) => {
        const article = await fetchArticleHtml(u.url);
        report.fetchRetries += article.retries;
        if (!article.html) {
          report.errors++;
          report.fetchFailures.push({ url: u.url, error: article.error });
          return;
        }
        report.urlsFetched++;
        const parts = article.viaJina ? partsFromMarkdown(u.title, article.html) : extractArticleParts(article.html, u.title);
        const publishedAt = article.viaJina ? readerPublishedAt(article.html) : extractPublishedAt(article.html);
        const candidate = buildCandidate(parts, u.url, u.publisher, publishedAt, minMs, maxMs, report.lookbackHours, (reason) => {
          report.rejected++;
          report.rejectionReasons[reason] = (report.rejectionReasons[reason] || 0) + 1;
          if (isReviewableRejection(reason) && report.reviewLeads.length < 1000) {
            report.reviewLeads.push({ url: u.url, title: u.title, publisher: u.publisher, reason });
          }
        });
        if (!candidate) {
          return;
        }
        const final = await applyDeepSeekCleanup(candidate, parts, report, minMs, maxMs);
        if (final) {
          found.push(...final);
          report.candidates += final.length;
        } else {
          report.rejected++;
          const reason = "DeepSeek rejected or could not confirm candidate";
          report.rejectionReasons[reason] = (report.rejectionReasons[reason] || 0) + 1;
        }
      }),
    );
  }
  return found;
}

function isReviewableRejection(reason: string): boolean {
  return /no reliable publication date|relative incident date requires|no explicit incident date|no Nigerian state|original incident date/i.test(reason);
}

async function fetchWithRetry(url: string, timeoutMs: number): Promise<{ response: Response | null; retries: number; error: string | null }> {
  let retries = 0;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "user-agent": USER_AGENT },
      });
      if (!isTransientArticleFetchStatus(response.status) || attempt === 1) {
        return {
          response,
          retries,
          error: response.ok ? null : `HTTP ${response.status}`,
        };
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt === 1) return { response: null, retries, error: lastError };
    }
    retries++;
    await new Promise((resolve) => setTimeout(resolve, 250 * retries));
  }
  return { response: null, retries, error: lastError || "request failed" };
}

async function fetchArticleHtml(url: string): Promise<{ html: string | null; viaJina: boolean; retries: number; error: string }> {
  const direct = await fetchWithRetry(url, FETCH_TIMEOUT_MS);
  if (direct.response?.ok && (direct.response.headers.get("content-type") || "").includes("text/html")) {
    try {
      const html = await direct.response.text();
      if (html.length > 200) {
        return { html, viaJina: false, retries: direct.retries, error: "" };
      }
      direct.error = "publisher returned too little content";
    } catch (error) {
      direct.error = error instanceof Error ? error.message : String(error);
    }
  }
  const directError = direct.error || (direct.response ? `non-HTML content type ${direct.response.headers.get("content-type") || "unknown"}` : "direct request failed");

  const reader = await fetchWithRetry(`https://r.jina.ai/${url}`, 20000);
  if (reader.response?.ok) {
    try {
      const text = await reader.response.text();
      if (text && text.length > 200) {
        return { html: text, viaJina: true, retries: direct.retries + reader.retries, error: "" };
      }
    } catch (error) {
      reader.error = error instanceof Error ? error.message : String(error);
    }
  }
  const readerError = reader.error || (reader.response ? `reader returned too little content (${reader.response.status})` : "reader request failed");
  return { html: null, viaJina: false, retries: direct.retries + reader.retries, error: `publisher: ${directError}; reader: ${readerError}` };
}

function partsFromMarkdown(title: string, text: string): ArticleParts {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return { title, description: "", lead: cleaned.slice(0, 6000), text: cleaned };
}

/** The Jina reader prefixes its markdown output with a "Published Time:" line. */
function readerPublishedAt(text: string): Date | null {
  const match = text.match(/Published Time:\s*([^\n]+)/i) || text.match(/published_time["']?\s*[:=]\s*["']?([^"'\n]+)/i);
  if (!match?.[1]) return null;
  const parsed = new Date(match[1].trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildCandidate(
  parts: ArticleParts,
  url: string,
  publisher: string,
  publishedAt: Date | null,
  minMs: number,
  maxMs: number,
  lookbackHours: number,
  onReject: (reason: string) => void,
): RawAttackData | null {
  const { title, description, lead, text } = parts;
  const debug = process.env.SEARCH_LED_DEBUG === "true";
  const reject = (reason: string) => {
    onReject(reason);
    if (debug) console.log(`[search-led] reject (${reason}): ${title}`);
    return null;
  };
  const admissionRejection = sourceLedAdmissionRejection(title, lead);
  if (admissionRejection) return reject(admissionRejection);
  if (!hasSecurityIncidentSignal(lead)) return reject("no security-incident signal");

  // A source publication can predate an incident report or include a late
  // update. Bound its age to the search horizon, then use the reported event
  // date for admission. Explicit event dates remain usable without publish
  // metadata; relative dates still require a reliable publication timestamp.
  if (publishedAt && !isPublishedWithinDiscoveryHorizon(publishedAt, maxMs)) {
    return reject("published outside the configured discovery horizon");
  }

  const group = extractGroup(lead);
  const scopeRejection = screenIncidentCandidate({ title, description: lead, group });
  if (scopeRejection) return reject(scopeRejection);
  const state = extractState(lead);
  if (!state) return reject("no Nigerian state");

  const incidentDate = dateFromText(lead, publishedAt);
  if (!incidentDate) {
    return reject(publishedAt && /\b(?:today|yesterday)\b/i.test(lead)
      ? "no explicit incident date"
      : !publishedAt && /\b(?:today|yesterday)\b/i.test(lead)
        ? "relative incident date requires a reliable publication date"
        : "no explicit incident date");
  }
  const ts = incidentDate.getTime();
  if (ts < minMs || ts > maxMs) return reject(`incident date outside the ${lookbackHours}-hour window`);

  const location = extractLocation(title, lead, state);
  const narrative = `${title}. ${lead}`;
  const casualtyMeta: CasualtyMetadata = {
    killed: extractCasualtyAssessment(narrative, "kill(?:ed|s|ing)?|slay|slain|murder(?:ed|s|ing)?|shot\\s+dead"),
    injured: extractCasualtyAssessment(narrative, "injur(?:ed|es|ing|y|ies)?|wound(?:ed|s|ing)?"),
    kidnapped: extractCasualtyAssessment(narrative, "kidnap(?:ped|s|ping)?|abduct(?:ed|s|ing|ion|ions)?|hostage"),
    displaced: extractCasualtyAssessment(narrative, "displace(?:d|s|ing)?|forced\\s+to\\s+flee"),
  };
  const normalized = normalizeCasualtyFields({}, casualtyMeta);

  const tags = ["search-led", group.toLowerCase().replace(/\W+/g, "-")];
  if (location.precision && location.precision !== "exact") tags.push("approximate-location");
  if (Object.values(casualtyMeta).some((m) => m?.precision === "estimate" || m?.precision === "range")) tags.push("casualty-uncertainty");
  const status =
    Object.values(casualtyMeta).some((m) => m?.precision === "range" || m?.precision === "unknown") ||
    location.precision !== "exact"
      ? "developing"
      : "unconfirmed";

  return {
    title,
    description: (description || lead || text).slice(0, 5000),
    date: incidentDate.toISOString(),
    datePrecision: "exact_day",
    location,
    group,
    casualties: normalized.casualties,
    casualtyMeta: normalized.casualtyMeta,
    sources: [{ url, title, publisher, publishedAt: publishedAt?.toISOString() }],
    civilianCasualties: true,
    status,
    tags,
  };
}

/**
 * Discover candidate incidents across the given states within the trailing
 * `lookbackHours` window (default 96). Returns candidates plus a report; no
 * database writes happen here.
 */
export async function collectSearchLedIncidents(
  states: string[],
  lookbackHours = 96,
): Promise<{ attacks: RawAttackData[]; report: SearchLedReport }> {
  if (!Number.isFinite(lookbackHours) || lookbackHours < 1 || lookbackHours > 336) {
    throw new Error("lookbackHours must be between 1 and 336");
  }
  const windowEnd = new Date();
  const minMs = windowEnd.getTime() - lookbackHours * 3_600_000;
  const maxMs = windowEnd.getTime() + 2 * 3_600_000;
  const report: SearchLedReport = {
    windowStart: new Date(minMs).toISOString(),
    windowEnd: windowEnd.toISOString(),
    lookbackHours,
    queriesRun: 0,
    urlsDiscovered: 0,
    urlsFetched: 0,
    fetchRetries: 0,
    fetchFailures: [],
    candidates: 0,
    rejected: 0,
    rejectionReasons: {},
    reviewLeads: [],
    errors: 0,
    searchFailures: [],
    braveFallbackCalls: 0,
    deepseekCalls: 0,
    deepseekConfirmed: 0,
    deepseekRejected: 0,
    deepseekErrors: 0,
    deepseekReviewRequired: 0,
  };
  const attacks: RawAttackData[] = [];
  const budget = { braveCalls: 0 };
  const seenUrls = new Set<string>();
  // Shuffle so the capped Brave fallback rotates across states rather than
  // starving the tail of the list.
  const uniqueStates = shuffle([...new Set(states.map((s) => s.trim()).filter(Boolean))]);
  const stateConcurrency = Math.max(1, Math.min(STATE_SCAN_CONCURRENCY, uniqueStates.length || 1));

  for (let i = 0; i < uniqueStates.length; i += stateConcurrency) {
    const batch = uniqueStates.slice(i, i + stateConcurrency);
    console.log(`[Scheduled Discovery] Scanning batch ${Math.floor(i / stateConcurrency) + 1}/${Math.ceil(uniqueStates.length / stateConcurrency)}: ${batch.join(", ")}`);
    const batchResults = await Promise.all(
      batch.map(async (state) => {
        report.queriesRun++;
        const query = buildQuery(state);

        // Free-first lane.
        const free = await discoverForQuery(query, state, ["duckduckgo"], budget, report);
        let found = await fetchAndExtract(absorbResults(free.results, seenUrls, report), report, minMs, maxMs);

        // Brave recency fallback: free HTML search does not reliably honor a
        // date filter, so only reach for Brave when the free lane found nothing.
        if (found.length === 0) {
          const brave = await discoverForQuery(query, state, ["brave"], budget, report);
          if (brave.braveFallbackUsed) report.braveFallbackCalls++;
          found = await fetchAndExtract(absorbResults(brave.results, seenUrls, report), report, minMs, maxMs);
        }
        return found;
      }),
    );
    attacks.push(...batchResults.flat());
  }

  return { attacks, report };
}

/**
 * Free (non-AI) ingestion: SHA-256 hash + source-URL + location/date dedup,
 * mirroring the whole-year backfill apply scripts. Never calls Gemini.
 */
export async function ingestSearchLedAttacks(
  candidates: RawAttackData[],
  label = "SearchLed",
): Promise<SearchLedIngestResult> {
  let inserted = 0;
  let merged = 0;
  let errors = 0;
  const reviewRequired: SearchLedIngestResult["reviewRequired"] = [];

  for (const candidate of candidates) {
    try {
      const hash = hashFor(candidate);
      const date = new Date(candidate.date);
      const town = (candidate.location.town || "").trim();
      const lga = (candidate.location.lga || "Unknown").trim();
      const hasSpecificTown = town !== "" && !/^(?:unknown|multiple|various|unspecified|n\/?a)$/i.test(town);
      const candidateUrls = [...new Set((candidate.sources || []).map((source) => normalizeSourceUrl(source.url)).filter(Boolean))];
      const duplicateFilters: Record<string, unknown>[] = [
        { hash },
      ];
      // State + LGA + date alone is too broad: separate attacks can happen in
      // the same LGA on the same day. Only use the location/date fallback when
      // both records identify the same specific town.
      if (hasSpecificTown) {
        const sameEventLocation = {
          "location.state": candidate.location.state,
          "location.lga": candidate.location.lga || "Unknown",
          "location.town": { $regex: `^${escapeRegExp(town)}$`, $options: "i" },
        };
        duplicateFilters.push({
          date,
          ...sameEventLocation,
        });
      }
      const existing = await Attack.findOne({
        _deleted: { $ne: true },
        $or: duplicateFilters,
      });

      if (existing) {
        const sourceMerge = mergeSourceMetadata(existing.sources || [], candidate.sources || []);
        if (sourceMerge.changed) {
          await Attack.findByIdAndUpdate(existing._id, {
            $set: { sources: sourceMerge.sources, updatedAt: new Date() },
          });
        }
        merged++;
        continue;
      }

      // An article URL alone is not an event key: roundups and multi-event
      // stories may legitimately support several records. Treat it as a strong
      // duplicate signal only when the event location also matches, the event
      // dates are within one day, and known casualty values do not conflict.
      const dateWindowStart = new Date(utcDay(date) - 24 * 60 * 60 * 1000);
      const dateWindowEnd = new Date(utcDay(date) + 2 * 24 * 60 * 60 * 1000 - 1);
      const possibleMatches = await Attack.find({
        _deleted: { $ne: true },
        $or: [
          ...(candidateUrls.length ? [{ "sources.url": { $in: (candidate.sources || []).map((source) => source.url) } }] : []),
          {
            "location.state": { $regex: `^${escapeRegExp(candidate.location.state)}$`, $options: "i" },
            "location.lga": { $regex: `^${escapeRegExp(lga)}$`, $options: "i" },
            date: { $gte: dateWindowStart, $lte: dateWindowEnd },
          },
        ],
      }).lean();

      const nearbySourceMatches = possibleMatches.filter((record) => {
        const sameSource = sharedSourceUrl(candidateUrls, record.sources || []);
        const sameState = normalizeLocationName(record.location?.state || "").join(" ") === normalizeLocationName(candidate.location.state).join(" ");
        const sameLga = normalizeLocationName(record.location?.lga || "").join(" ") === normalizeLocationName(lga).join(" ");
        const sameTown = hasSpecificTown && sameSpecificLocation(town, record.location?.town || "");
        const daysApart = Math.abs(utcDay(new Date(record.date)) - utcDay(date)) / (24 * 60 * 60 * 1000);
        return sameSource && sameState && sameLga && sameTown && daysApart <= 1;
      });

      const sourceDuplicate = nearbySourceMatches.find((record) =>
        utcDay(new Date(record.date)) === utcDay(date) && casualtiesCompatible(candidate.casualties, record.casualties),
      );
      if (sourceDuplicate) {
        const sourceMerge = mergeSourceMetadata(sourceDuplicate.sources || [], candidate.sources || []);
        if (sourceMerge.changed) {
          await Attack.findByIdAndUpdate(sourceDuplicate._id, {
            $set: { sources: sourceMerge.sources, updatedAt: new Date() },
          });
        }
        merged++;
        continue;
      }

      if (nearbySourceMatches.length) {
        const dateDiffers = utcDay(new Date(nearbySourceMatches[0].date)) !== utcDay(date);
        reviewRequired.push({
          url: candidate.sources?.[0]?.url || "",
          candidateTitle: candidate.title,
          existingId: String(nearbySourceMatches[0]._id),
          reason: dateDiffers
            ? "Shared source and location match an incident on an adjacent date; held for event-date review instead of inserting a possible duplicate."
            : "Shared source and event identity match an existing incident, but casualty values conflict; held instead of inserting a possible duplicate.",
        });
        continue;
      }

      await Attack.create({
        title: candidate.title,
        description: candidate.description,
        date,
        datePrecision: candidate.datePrecision || "exact_day",
        location: {
          state: candidate.location.state,
          lga: candidate.location.lga || "Unknown",
          town: candidate.location.town || "Unknown",
          precision: candidate.location.precision || "exact",
          notes: candidate.location.notes || "",
        },
        group: candidate.group,
        casualties: candidate.casualties,
        casualtyMeta: candidate.casualtyMeta,
        sources: (candidate.sources || []).map((s) => ({
          url: s.url,
          title: s.title || "",
          publisher: s.publisher || "",
          publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
        })),
        status: candidate.status || "unconfirmed",
        tags: candidate.tags || [],
        hash,
        _deleted: false,
      });
      inserted++;
    } catch (error) {
      errors++;
      console.error(`[${label}] error ingesting candidate:`, error);
    }
  }

  return { inserted, merged, errors, reviewRequired };
}
