/**
 * Search-engine-led discovery + free (non-AI) ingestion.
 *
 * Replaces the Gemini/VertexAI discovery path with a free-first search strategy
 * that mirrors the whole-year backfill: DuckDuckGo/Bing HTML search for free,
 * Brave Search API only as a fallback, direct article fetch with a Jina reader
 * fallback for 403s, and regex extraction of the incident fields. Ingestion
 * uses a SHA-256 dedup guard with source-URL and normalized same-town/date checks. Optional
 * DeepSeek cleanup can confirm candidates when configured.
 */

import crypto from "crypto";
import Attack from "./models/Attack";
import { NewsDiscoveryProvider, NewsDiscoveryResult, searchNews } from "./news-discovery";
import {
  RawAttackData,
  dateEvidenceFromText,
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
import { incidentDateIntervalsOverlap, incidentDateKey, normalizeIncidentDate } from "./incident-date";
import { discoverRegisteredFeedArticles, type DiscoveryFeedFailure } from "./discovery-feeds";

export type SearchLedReviewLead = {
  url: string;
  title: string;
  publisher: string;
  reason: string;
  retryable: boolean;
  articleText?: string;
  publishedAt?: string;
  state?: string;
  candidates?: RawAttackData[];
};

export type SearchLedJurisdictionReport = {
  state: string;
  status: "PASS" | "RECOVERED" | "DEGRADED" | "FAILED";
  errors: string[];
  retries: number;
  resultCount: number;
};

export interface SearchLedReport {
  windowStart: string;
  windowEnd: string;
  lookbackHours: number;
  queriesRun: number;
  urlsDiscovered: number;
  urlsFetched: number;
  fetchRetries: number;
  fetchFailures: Array<{ url: string; title: string; publisher: string; error: string; retryable: boolean }>;
  searchFailures: Array<{ state: string; provider: NewsDiscoveryProvider; status: string; reason: string }>;
  candidates: number;
  rejected: number;
  rejectionReasons: Record<string, number>;
  reviewLeads: SearchLedReviewLead[];
  jurisdictions: SearchLedJurisdictionReport[];
  feedFailures: DiscoveryFeedFailure[];
  feedUrlsDiscovered: number;
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

type DiscoverySource = { url: string; title: string; publisher: string; publishedAt?: Date };

const FETCH_TIMEOUT_MS = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 8000);
const SEARCH_RESULTS_PER_QUERY = Number(process.env.SEARCH_RESULTS_PER_QUERY || 10);
const SEARCH_FRESHNESS = (process.env.SEARCH_FRESHNESS as "day" | "week" | "month" | undefined) || "week";
const SEARCH_PUBLICATION_MAX_AGE_HOURS = Math.max(1, Number(process.env.SEARCH_PUBLICATION_MAX_AGE_HOURS || 168));
const ARTICLE_FETCH_CONCURRENCY = Math.max(1, Math.min(8, Number(process.env.FREE_SOURCE_CONCURRENCY || 4)));
const STATE_SCAN_CONCURRENCY = Math.max(1, Number(process.env.STATE_SCAN_CONCURRENCY || 3));
const BRAVE_CALL_LIMIT = Number(process.env.BRAVE_SEARCH_MAX_CALLS_PER_RUN || 40);
const USER_AGENT = "NigeriaAttackTracker/1.0 (+search-led OSINT collector)";

function createReport(lookbackHours: number, windowEnd = new Date()): SearchLedReport {
  const minMs = windowEnd.getTime() - lookbackHours * 3_600_000;
  return {
    windowStart: new Date(minMs).toISOString(),
    windowEnd: windowEnd.toISOString(),
    lookbackHours,
    queriesRun: 0,
    urlsDiscovered: 0,
    urlsFetched: 0,
    fetchRetries: 0,
    fetchFailures: [],
    searchFailures: [],
    candidates: 0,
    rejected: 0,
    rejectionReasons: {},
    reviewLeads: [],
    jurisdictions: [],
    feedFailures: [],
    feedUrlsDiscovered: 0,
    errors: 0,
    braveFallbackCalls: 0,
    deepseekCalls: 0,
    deepseekConfirmed: 0,
    deepseekRejected: 0,
    deepseekErrors: 0,
    deepseekReviewRequired: 0,
  };
}

function addReviewLead(report: SearchLedReport, lead: SearchLedReviewLead): void {
  if (report.reviewLeads.length >= 1000) return;
  const key = `${normalizeSourceUrl(lead.url)}|${lead.reason}`;
  if (report.reviewLeads.some((item) => `${normalizeSourceUrl(item.url)}|${item.reason}` === key)) return;
  report.reviewLeads.push({
    ...lead,
    articleText: lead.articleText?.slice(0, 12_000),
    candidates: lead.candidates?.map((candidate) => ({ ...candidate })),
  });
}

function buildQuery(state: string): string {
  // Keep the query Nigeria-specific and include victim outcomes as well as
  // attacker/event terms so reports are not missed when headlines omit "attack".
  // Provider freshness filters publication time. A current-month keyword would
  // hide late reports and catch-up events spanning a calendar boundary.
  return `Nigeria "${state}" attack OR ambush OR kidnapping OR abduction OR killed OR injured`;
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
  const normalizedDate = normalizeIncidentDate(candidate);
  const dateStr = normalizedDate?.datePrecision === "date_range"
    ? incidentDateKey(candidate)
    : new Date(candidate.date).toISOString().slice(0, 10);
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
): Promise<{ results: NewsDiscoveryResult[]; braveFallbackUsed: boolean; hadFailure: boolean; succeeded: boolean }> {
  let hadFailure = false;
  let succeeded = false;
  for (const provider of providers) {
    if (provider === "brave" && (!process.env.BRAVE_SEARCH_API_KEY || budget.braveCalls >= BRAVE_CALL_LIMIT)) continue;
    if (provider === "brave") budget.braveCalls++;
    const res = await searchNews(query, { providers: provider, maxResults: SEARCH_RESULTS_PER_QUERY, freshness: SEARCH_FRESHNESS });
    for (const receipt of res.receipts) {
      if (receipt.status === "PASS") succeeded = true;
      if (receipt.status === "FAIL" || receipt.status === "BLOCKED") {
        hadFailure = true;
        report.searchFailures.push({ state, provider: receipt.provider, status: receipt.status, reason: receipt.reason });
      }
    }
    if (res.results.length > 0) return { results: res.results, braveFallbackUsed: provider === "brave", hadFailure, succeeded };
  }
  return { results: [], braveFallbackUsed: false, hadFailure, succeeded };
}

function absorbResults(
  results: NewsDiscoveryResult[],
  seenUrls: Set<string>,
  report: SearchLedReport,
): DiscoverySource[] {
  const urls: DiscoverySource[] = [];
  for (const r of results) {
    const key = normalizeSourceUrl(r.url);
    if (!key || seenUrls.has(key)) continue;
    if (isSuppressedSourceHost(r.url)) continue;
    seenUrls.add(key);
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
): Promise<RawAttackData[] | null> {
  const source = candidate.sources[0];
  const reviewContext = {
    url: source?.url || "",
    title: candidate.title,
    publisher: source?.publisher || "",
    articleText: parts.text,
    publishedAt: source?.publishedAt,
    state: candidate.location.state,
    candidates: [candidate],
  };
  const multiEventSignal = /\b(?:separate attacks?|separate incidents?|another separate|in separate|across (?:several|multiple|two|three|four) (?:communities|villages|states|locations)|in different (?:communities|villages|locations|states))\b/i.test(`${parts.title}. ${parts.lead}. ${parts.text}`);
  if (!isDeepSeekCleanupEnabled()) {
    if (multiEventSignal) {
      report.deepseekReviewRequired++;
      addReviewLead(report, { ...reviewContext, reason: "Multiple incidents indicated but DeepSeek cleanup is disabled", retryable: true });
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
      addReviewLead(report, { ...reviewContext, reason: "Multiple incidents indicated but DeepSeek cleanup failed", retryable: true });
      return null;
    }
    return [result.incident ?? candidate];
  }
  if (result.reviewRequired) {
    report.deepseekReviewRequired++;
    addReviewLead(report, { ...reviewContext, reason: result.reason, retryable: true });
    return null;
  }
  const incidents = result.incidents || (result.incident ? [result.incident] : []);
  if (!result.confirmed || incidents.length === 0) {
    report.deepseekRejected++;
    addReviewLead(report, {
      ...reviewContext,
      reason: `DeepSeek ${result.classification || "rejection"}: ${result.reason}`,
      retryable: false,
    });
    if (process.env.SEARCH_LED_DEBUG === "true") console.log(`[search-led] deepseek rejected (${result.reason}): ${candidate.title}`);
    return null;
  }
  if (multiEventSignal && incidents.length < 2) {
    report.deepseekReviewRequired++;
    addReviewLead(report, { ...reviewContext, reason: "Article signals separate incidents but DeepSeek returned a single event", retryable: true });
    return null;
  }
  report.deepseekConfirmed++;
  return incidents;
}

async function fetchAndExtract(
  urls: DiscoverySource[],
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
          const failure = { url: u.url, title: u.title, publisher: u.publisher, error: article.error, retryable: true };
          report.fetchFailures.push(failure);
          addReviewLead(report, { ...failure, reason: `Article fetch failed: ${article.error}` });
          return;
        }
        report.urlsFetched++;
        const parts = article.viaJina ? partsFromMarkdown(u.title, article.html) : extractArticleParts(article.html, u.title);
        const publishedAt = (article.viaJina ? readerPublishedAt(article.html) : extractPublishedAt(article.html)) || u.publishedAt || null;
        const candidate = buildCandidate(parts, u.url, u.publisher, publishedAt, maxMs, report.lookbackHours, (reason) => {
          report.rejected++;
          report.rejectionReasons[reason] = (report.rejectionReasons[reason] || 0) + 1;
          if (isReviewableRejection(reason) && report.reviewLeads.length < 1000) {
            addReviewLead(report, {
              url: u.url,
              title: parts.title || u.title,
              publisher: u.publisher,
              reason,
              retryable: /publication date|relative incident date|no explicit incident date|no Nigerian state/i.test(reason),
              articleText: parts.text,
              publishedAt: publishedAt?.toISOString(),
              state: extractState(parts.lead) || undefined,
            });
          }
        });
        if (!candidate) {
          return;
        }
        const final = await applyDeepSeekCleanup(candidate, parts, report);
        if (final) {
          for (const incident of final) {
            const normalized = normalizeIncidentDate(incident);
            if (!normalized) {
              report.rejected++;
              addReviewLead(report, {
                url: u.url, title: incident.title, publisher: u.publisher,
                reason: "Incident has ambiguous or invalid date evidence", retryable: false,
                articleText: parts.text, publishedAt: publishedAt?.toISOString(),
                state: incident.location.state, candidates: [incident],
              });
              continue;
            }
            const inWindow = incidentDateIntervalsOverlap(normalized, {
              interval: { start: new Date(minMs), end: new Date(maxMs) },
            });
            if (!inWindow) {
              report.rejected++;
              const lateReport = normalized.interval.end.getTime() < minMs;
              const reason = lateReport
                ? `Recent publication reports a supported event date outside the ${report.lookbackHours}-hour event window; retained as a late-report review lead`
                : "Supported event date is after the active scan window; retained for review";
              report.rejectionReasons[reason] = (report.rejectionReasons[reason] || 0) + 1;
              addReviewLead(report, {
                url: u.url, title: incident.title, publisher: u.publisher, reason, retryable: false,
                articleText: parts.text, publishedAt: publishedAt?.toISOString(),
                state: incident.location.state, candidates: [incident],
              });
              continue;
            }
            found.push(incident);
            report.candidates++;
          }
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
  maxMs: number,
  publicationMaxAgeHours: number,
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
  if (publishedAt && !isPublishedWithinDiscoveryHorizon(publishedAt, maxMs, publicationMaxAgeHours)) {
    return reject("published outside the configured discovery horizon");
  }

  const group = extractGroup(lead);
  const scopeRejection = screenIncidentCandidate({ title, description: lead, group });
  if (scopeRejection) return reject(scopeRejection);
  const state = extractState(lead);
  if (!state) return reject("no Nigerian state");

  const incidentDate = dateEvidenceFromText(lead, publishedAt);
  if (!incidentDate) {
    return reject(publishedAt && /\b(?:today|yesterday)\b/i.test(lead)
      ? "no explicit incident date"
      : !publishedAt && /\b(?:today|yesterday)\b/i.test(lead)
        ? "relative incident date requires a reliable publication date"
        : "no explicit incident date");
  }

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
    date: incidentDate.date.toISOString(),
    datePrecision: incidentDate.datePrecision,
    dateRange: incidentDate.dateRange ? {
      start: incidentDate.dateRange.start.toISOString(),
      end: incidentDate.dateRange.end.toISOString(),
    } : undefined,
    dateEvidence: incidentDate.evidence,
    location,
    group,
    casualties: normalized.casualties,
    casualtyMeta: normalized.casualtyMeta,
    sources: [{ url, title, publisher, publishedAt: publishedAt?.toISOString() }],
    civilianCasualties: true,
    status: incidentDate.datePrecision === "exact_day" ? status : "developing",
    tags: incidentDate.datePrecision === "exact_day" ? tags : [...tags, "date-uncertainty"],
  };
}

/**
 * Discover candidate incidents across the given states within the trailing
 * `lookbackHours` window (default 168). Returns candidates plus a report; no
 * database writes happen here.
 */
export async function collectSearchLedIncidents(
  states: string[],
  lookbackHours = 168,
): Promise<{ attacks: RawAttackData[]; report: SearchLedReport }> {
  if (!Number.isFinite(lookbackHours) || lookbackHours < 1 || lookbackHours > 336) {
    throw new Error("lookbackHours must be between 1 and 336");
  }
  const windowEnd = new Date();
  const minMs = windowEnd.getTime() - lookbackHours * 3_600_000;
  const maxMs = windowEnd.getTime() + 2 * 3_600_000;
  const report = createReport(lookbackHours, windowEnd);
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
        let retries = 0;
        let fallback: Awaited<ReturnType<typeof discoverForQuery>> | null = null;

        // Free-first lane.
        const free = await discoverForQuery(query, state, ["duckduckgo"], budget, report);
        let found = await fetchAndExtract(absorbResults(free.results, seenUrls, report), report, minMs, maxMs);

        // Retry only states where the primary search failed or produced no
        // admissible direct-source candidate. Brave is preferred when budgeted;
        // Bing remains the no-key provider fallback.
        if (free.hadFailure || found.length === 0) {
          retries++;
          const fallbackProviders: NewsDiscoveryProvider[] = process.env.BRAVE_SEARCH_API_KEY
            ? ["brave", "bing"]
            : ["bing"];
          fallback = await discoverForQuery(query, state, fallbackProviders, budget, report);
          if (fallback.braveFallbackUsed) report.braveFallbackCalls++;
          found = [...found, ...await fetchAndExtract(absorbResults(fallback.results, seenUrls, report), report, minMs, maxMs)];
        }
        const errors = report.searchFailures
          .filter((failure) => failure.state === state)
          .map((failure) => `${failure.provider}: ${failure.reason}`);
        const status: SearchLedJurisdictionReport["status"] = !free.succeeded
          ? (fallback?.succeeded ? "RECOVERED" : "FAILED")
          : fallback && !fallback.succeeded && fallback.hadFailure
            ? "DEGRADED"
            : "PASS";
        report.jurisdictions.push({
          state,
          status,
          errors,
          retries,
          resultCount: found.length,
        });
        return found;
      }),
    );
    attacks.push(...batchResults.flat());
  }

  // Registered publisher feeds supplement search recall. Every item still
  // passes the same direct-article, date, scope and DeepSeek gates above.
  const feedDiscovery = process.env.SEARCH_LED_FEEDS_ENABLED === "false"
    ? { articles: [], failures: [], feedsChecked: 0 }
    : await discoverRegisteredFeedArticles(lookbackHours, windowEnd);
  report.feedFailures.push(...feedDiscovery.failures);
  const feedSources = feedDiscovery.articles.filter((article) => {
    const key = normalizeSourceUrl(article.url);
    if (!key || seenUrls.has(key) || isSuppressedSourceHost(article.url)) return false;
    seenUrls.add(key);
    report.urlsDiscovered++;
    report.feedUrlsDiscovered++;
    return true;
  });
  const feedAttacks = await fetchAndExtract(feedSources, report, minMs, maxMs);
  attacks.push(...feedAttacks);
  for (const attack of feedAttacks) {
    const jurisdiction = report.jurisdictions.find((item) => item.state.toLowerCase() === attack.location.state.toLowerCase());
    if (jurisdiction) jurisdiction.resultCount++;
  }
  report.jurisdictions.sort((a, b) => a.state.localeCompare(b.state));

  return { attacks, report };
}

/** Re-run one queued URL through the normal guarded extraction path. */
export async function reextractSearchLedSource(
  source: { url: string; title: string; publisher: string },
  lookbackHours = 336,
): Promise<{ attacks: RawAttackData[]; report: SearchLedReport }> {
  if (!Number.isFinite(lookbackHours) || lookbackHours < 1 || lookbackHours > 336) {
    throw new Error("lookbackHours must be between 1 and 336");
  }
  const windowEnd = new Date();
  const minMs = windowEnd.getTime() - lookbackHours * 3_600_000;
  const maxMs = windowEnd.getTime() + 2 * 3_600_000;
  const report = createReport(lookbackHours, windowEnd);
  report.urlsDiscovered = 1;
  const attacks = await fetchAndExtract([source], report, minMs, maxMs);
  const states = new Set([
    ...attacks.map((attack) => attack.location.state),
    ...report.reviewLeads.map((lead) => lead.state).filter((state): state is string => Boolean(state)),
  ]);
  report.jurisdictions = [...states].map((state) => ({
    state,
    status: attacks.some((attack) => attack.location.state === state) ? "PASS" : "DEGRADED",
    errors: report.fetchFailures.map((failure) => failure.error),
    retries: report.fetchRetries,
    resultCount: attacks.filter((attack) => attack.location.state === state).length,
  }));
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
      const candidateDate = normalizeIncidentDate(candidate);
      if (!candidateDate) {
        reviewRequired.push({
          url: candidate.sources?.[0]?.url || "",
          candidateTitle: candidate.title,
          existingId: "",
          reason: "Candidate has invalid or ambiguous event-date evidence; held for review.",
        });
        continue;
      }
      const hash = hashFor(candidate);
      const date = candidateDate.date;
      const town = (candidate.location.town || "").trim();
      const lga = (candidate.location.lga || "Unknown").trim();
      const hasSpecificTown = town !== "" && !/^(?:unknown|multiple|various|unspecified|n\/?a)$/i.test(town);
      const candidateUrls = [...new Set((candidate.sources || []).map((source) => normalizeSourceUrl(source.url)).filter(Boolean))];
      const duplicateFilters: Record<string, unknown>[] = [
        { hash },
      ];
      const existing = await Attack.findOne({
        _deleted: { $ne: true },
        $or: duplicateFilters,
      });

      if (existing) {
        if (!casualtiesCompatible(candidate.casualties, existing.casualties)) {
          reviewRequired.push({
            url: candidate.sources?.[0]?.url || "",
            candidateTitle: candidate.title,
            existingId: String(existing._id),
            reason: "Incident identity matches an existing record, but casualty values conflict; held for review instead of merging.",
          });
          continue;
        }
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
      // stories may legitimately support several records. Compare all records
      // with the same normalized state/LGA/town in the one-day window so that
      // independent reports with town aliases (for example, "Babban Saura PW"
      // and "Babban Saura") are not inserted as separate incidents.
      const dateWindowStart = new Date(candidateDate.interval.start.getTime() - 24 * 60 * 60 * 1000);
      const dateWindowEnd = new Date(candidateDate.interval.end.getTime() + 24 * 60 * 60 * 1000);
      const possibleMatches = await Attack.find({
        _deleted: { $ne: true },
        $or: [
          ...(candidateUrls.length ? [{ "sources.url": { $in: (candidate.sources || []).map((source) => source.url) } }] : []),
          {
            "location.state": { $regex: `^${escapeRegExp(candidate.location.state)}$`, $options: "i" },
            "location.lga": { $regex: `^${escapeRegExp(lga)}$`, $options: "i" },
            $or: [
              { date: { $gte: dateWindowStart, $lte: dateWindowEnd } },
              { "dateRange.start": { $lte: dateWindowEnd }, "dateRange.end": { $gte: dateWindowStart } },
            ],
          },
        ],
      }).lean();

      const nearbyEventMatches = possibleMatches.filter((record) => {
        const sameState = normalizeLocationName(record.location?.state || "").join(" ") === normalizeLocationName(candidate.location.state).join(" ");
        const sameLga = normalizeLocationName(record.location?.lga || "").join(" ") === normalizeLocationName(lga).join(" ");
        const sameTown = hasSpecificTown && sameSpecificLocation(town, record.location?.town || "");
        const recordDate = normalizeIncidentDate(record);
        return Boolean(recordDate && sameState && sameLga && sameTown && incidentDateIntervalsOverlap(candidateDate, recordDate, 24 * 60 * 60 * 1000));
      });

      const sameDayDuplicate = nearbyEventMatches.find((record) =>
        incidentDateKey(record) === incidentDateKey(candidate) && casualtiesCompatible(candidate.casualties, record.casualties),
      );
      if (sameDayDuplicate) {
        const sourceMerge = mergeSourceMetadata(sameDayDuplicate.sources || [], candidate.sources || []);
        if (sourceMerge.changed) {
          await Attack.findByIdAndUpdate(sameDayDuplicate._id, {
            $set: { sources: sourceMerge.sources, updatedAt: new Date() },
          });
        }
        merged++;
        continue;
      }

      if (nearbyEventMatches.length) {
        const possibleMatch = nearbyEventMatches[0];
        const dateDiffers = incidentDateKey(possibleMatch) !== incidentDateKey(candidate);
        reviewRequired.push({
          url: candidate.sources?.[0]?.url || "",
          candidateTitle: candidate.title,
          existingId: String(possibleMatch._id),
          reason: dateDiffers
            ? "Location matches an incident on an overlapping or adjacent date interval; held for event-date review instead of inserting a possible duplicate."
            : "Location and event date match an existing incident, but casualty values conflict; held instead of inserting a possible duplicate.",
        });
        continue;
      }

      await Attack.create({
        title: candidate.title,
        description: candidate.description,
        date,
        datePrecision: candidateDate.datePrecision,
        dateEvidence: candidate.dateEvidence?.slice(0, 1000) || "",
        dateRange: candidateDate.dateRange ? {
          start: candidateDate.dateRange.start,
          end: candidateDate.dateRange.end,
        } : undefined,
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
