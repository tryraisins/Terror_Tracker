/**
 * Search-engine-led discovery + free (non-AI) ingestion.
 *
 * Replaces the Gemini/VertexAI discovery path with a free-first search strategy
 * that mirrors the whole-year backfill: DuckDuckGo/Bing HTML search for free,
 * Brave Search API only as a fallback, direct article fetch with a Jina reader
 * fallback for 403s, and regex extraction of the incident fields. Ingestion
 * uses a SHA-256 dedup guard with source-URL and location/date checks — no AI
 * is ever called, so this path is fully free to run on a schedule.
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
  extractState,
  hasSecurityIncidentSignal,
  sourceLedAdmissionRejection,
} from "./free-news";
import { screenIncidentCandidate } from "./incident-scope";
import { CasualtyMetadata, normalizeCasualtyFields } from "./incident-uncertainty";
import { isSuppressedSourceHost } from "./news-source-registry";

export interface SearchLedReport {
  queriesRun: number;
  urlsDiscovered: number;
  urlsFetched: number;
  candidates: number;
  rejected: number;
  errors: number;
  braveFallbackCalls: number;
}

export interface SearchLedIngestResult {
  inserted: number;
  merged: number;
  errors: number;
}

interface ArticleParts {
  title: string;
  description: string;
  lead: string;
  text: string;
}

const FETCH_TIMEOUT_MS = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 8000);
const SEARCH_RESULTS_PER_QUERY = Number(process.env.SEARCH_RESULTS_PER_QUERY || 5);
const ARTICLE_FETCH_CONCURRENCY = Math.max(1, Math.min(8, Number(process.env.FREE_SOURCE_CONCURRENCY || 4)));
const STATE_SCAN_CONCURRENCY = Math.max(1, Number(process.env.STATE_SCAN_CONCURRENCY || 3));
const BRAVE_CALL_LIMIT = Number(process.env.BRAVE_SEARCH_MAX_CALLS_PER_RUN || 20);
const USER_AGENT = "NigeriaAttackTracker/1.0 (+search-led OSINT collector)";

function buildQuery(state: string): string {
  return `${state} attack OR abduction OR bandits OR gunmen`;
}

function hashFor(candidate: RawAttackData): string {
  const title = (candidate.title || "").trim().toLowerCase();
  const dateStr = new Date(candidate.date).toISOString().slice(0, 10);
  const state = (candidate.location.state || "").trim().toLowerCase();
  const lga = (candidate.location.lga || "").trim().toLowerCase();
  return crypto.createHash("sha256").update(`${title}|${dateStr}|${state}|${lga}`).digest("hex");
}

async function discoverForQuery(
  query: string,
  budget: { braveCalls: number },
): Promise<{ results: NewsDiscoveryResult[]; braveFallbackUsed: boolean }> {
  const freeProviders: NewsDiscoveryProvider[] = ["duckduckgo"];
  if (process.env.NEWS_DISCOVERY_ENABLE_BING === "true") freeProviders.push("bing");

  for (const provider of freeProviders) {
    const res = await searchNews(query, { providers: provider, maxResults: SEARCH_RESULTS_PER_QUERY });
    if (res.results.length > 0) return { results: res.results, braveFallbackUsed: false };
  }

  // Brave is the paid fallback, used only when every free engine came back
  // empty or blocked, and only up to the per-run budget.
  if (process.env.BRAVE_SEARCH_API_KEY && budget.braveCalls < BRAVE_CALL_LIMIT) {
    budget.braveCalls++;
    const res = await searchNews(query, { providers: "brave", maxResults: SEARCH_RESULTS_PER_QUERY });
    return { results: res.results, braveFallbackUsed: true };
  }

  return { results: [], braveFallbackUsed: false };
}

async function fetchArticleHtml(url: string): Promise<{ html: string; viaJina: boolean } | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT },
    });
    if (res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
      return { html: await res.text(), viaJina: false };
    }
  } catch {
    /* fall through to reader */
  }
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: AbortSignal.timeout(20000),
      headers: { "user-agent": USER_AGENT },
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 200) return { html: text, viaJina: true };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function partsFromMarkdown(title: string, text: string): ArticleParts {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return { title, description: "", lead: cleaned.slice(0, 6000), text: cleaned };
}

function buildCandidate(
  parts: ArticleParts,
  url: string,
  publisher: string,
  minMs: number,
  maxMs: number,
): RawAttackData | null {
  const { title, description, lead, text } = parts;
  if (sourceLedAdmissionRejection(title, lead)) return null;
  if (!hasSecurityIncidentSignal(lead)) return null;
  const group = extractGroup(lead);
  if (screenIncidentCandidate({ title, description: lead, group })) return null;
  const state = extractState(lead);
  if (!state) return null;

  const incidentDate = dateFromText(lead, new Date());
  if (!incidentDate) return null;
  const ts = incidentDate.getTime();
  if (ts < minMs || ts > maxMs) return null;

  const location = extractLocation(title, lead, state);
  const casualtyMeta: CasualtyMetadata = {
    killed: extractCasualtyAssessment(lead, "killed"),
    injured: extractCasualtyAssessment(lead, "injured|wounded"),
    kidnapped: extractCasualtyAssessment(lead, "kidnapped|abducted"),
    displaced: extractCasualtyAssessment(lead, "displaced|forced to flee"),
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
    sources: [{ url, title, publisher }],
    civilianCasualties: true,
    status,
    tags,
  };
}

/**
 * Discover candidate incidents across the given states within the trailing
 * `lookbackHours` window (default 48). Returns candidates plus a report; no
 * database writes happen here.
 */
export async function collectSearchLedIncidents(
  states: string[],
  lookbackHours = 48,
): Promise<{ attacks: RawAttackData[]; report: SearchLedReport }> {
  const report: SearchLedReport = {
    queriesRun: 0,
    urlsDiscovered: 0,
    urlsFetched: 0,
    candidates: 0,
    rejected: 0,
    errors: 0,
    braveFallbackCalls: 0,
  };
  const attacks: RawAttackData[] = [];
  const budget = { braveCalls: 0 };
  const seenUrls = new Set<string>();
  const minMs = Date.now() - lookbackHours * 3_600_000;
  const maxMs = Date.now() + 2 * 3_600_000;

  const uniqueStates = [...new Set(states.map((s) => s.trim()).filter(Boolean))];
  const stateConcurrency = Math.max(1, Math.min(STATE_SCAN_CONCURRENCY, uniqueStates.length || 1));

  for (let i = 0; i < uniqueStates.length; i += stateConcurrency) {
    const batch = uniqueStates.slice(i, i + stateConcurrency);
    const discovered = await Promise.all(
      batch.map(async (state) => {
        const query = buildQuery(state);
        const { results, braveFallbackUsed } = await discoverForQuery(query, budget);
        if (braveFallbackUsed) report.braveFallbackCalls++;
        report.queriesRun++;
        const urls: Array<{ url: string; title: string; publisher: string }> = [];
        for (const r of results) {
          if (seenUrls.has(r.url)) continue;
          if (isSuppressedSourceHost(r.url)) continue;
          seenUrls.add(r.url);
          report.urlsDiscovered++;
          urls.push({ url: r.url, title: r.title, publisher: r.publisher });
        }
        return urls;
      }),
    );

    const allUrls = discovered.flat();
    for (let j = 0; j < allUrls.length; j += ARTICLE_FETCH_CONCURRENCY) {
      const chunk = allUrls.slice(j, j + ARTICLE_FETCH_CONCURRENCY);
      await Promise.all(
        chunk.map(async (u) => {
          const html = await fetchArticleHtml(u.url);
          if (!html) {
            report.errors++;
            return;
          }
          report.urlsFetched++;
          const parts = html.viaJina ? partsFromMarkdown(u.title, html.html) : extractArticleParts(html.html, u.title);
          const candidate = buildCandidate(parts, u.url, u.publisher, minMs, maxMs);
          if (candidate) {
            attacks.push(candidate);
            report.candidates++;
          } else {
            report.rejected++;
          }
        }),
      );
    }
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

  for (const candidate of candidates) {
    try {
      const hash = hashFor(candidate);
      const date = new Date(candidate.date);
      const existing = await Attack.findOne({
        _deleted: { $ne: true },
        $or: [
          { hash },
          { "sources.url": { $in: (candidate.sources || []).map((s) => s.url) } },
          { "location.state": candidate.location.state, "location.lga": candidate.location.lga, date },
        ],
      });

      if (existing) {
        const existingUrls = new Set((existing.sources || []).map((s) => s.url.replace(/\/$/, "")));
        const newSources = (candidate.sources || []).filter((s) => s.url && !existingUrls.has(s.url.replace(/\/$/, "")));
        if (newSources.length > 0) {
          await Attack.findByIdAndUpdate(existing._id, {
            $push: { sources: { $each: newSources } },
            $set: { updatedAt: new Date() },
          });
        }
        merged++;
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

  return { inserted, merged, errors };
}
