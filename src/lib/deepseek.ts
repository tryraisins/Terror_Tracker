/**
 * Optional DeepSeek cleanup/confirmation pass for already-heuristic-cleared
 * incidents. It runs only when DEEPSEEK_API_KEY is set (and cleanup is not
 * explicitly disabled), so the scheduled scan stays free by default.
 *
 * The model receives the candidate plus the fetched article text and must
 * (a) classify a source as one event, multiple events, review-required, or
 * ineligible, and (b) return source-grounded event records. It is a gate +
 * normalizer, never a source of new URLs.
 */

import { RawAttackData, dateEvidenceFromText } from "./free-news";
import { normalizeStateName } from "./normalize-state";
import { screenIncidentCandidate } from "./incident-scope";
import { normalizeIncidentDate } from "./incident-date";

const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const DEEPSEEK_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 30000);
const MAX_ARTICLE_CHARS = 6000;

export interface DeepSeekCleanupResult {
  confirmed: boolean;
  reason: string;
  classification?: "single_event" | "multiple_events" | "review_required" | "not_incident";
  incident?: RawAttackData;
  incidents?: RawAttackData[];
  reviewRequired?: boolean;
  /** True when DeepSeek could not be reached/parsed and the heuristic candidate was kept. */
  fallback?: boolean;
}

export type DeepSeekDuplicateClassification = "same_event" | "distinct_events" | "review_required";

export interface DeepSeekDuplicateAssessment {
  classification: DeepSeekDuplicateClassification;
  reason: string;
}

export interface DuplicateCheckIncident {
  title: string;
  description: string;
  date: Date | string;
  datePrecision?: RawAttackData["datePrecision"];
  dateRange?: { start?: Date | string | null; end?: Date | string | null };
  location: { state: string; lga: string; town: string };
  group: string;
  casualties: { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };
  sources?: Array<{ title?: string; publisher?: string }>;
}

export function isDeepSeekCleanupEnabled(): boolean {
  if (process.env.DEEPSEEK_CLEANUP_ENABLED === "false") return false;
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export function isDeepSeekDuplicateCheckEnabled(): boolean {
  return process.env.DEEPSEEK_DUPLICATE_CHECK_ENABLED !== "false" && Boolean(process.env.DEEPSEEK_API_KEY);
}

/**
 * Compare two incident records semantically. Source URLs are intentionally not
 * part of identity: independent outlets commonly report the same event.
 * Unavailable or ambiguous model results fail closed to review_required.
 */
export async function assessIncidentDuplicate(
  reportA: DuplicateCheckIncident,
  reportB: DuplicateCheckIncident,
): Promise<DeepSeekDuplicateAssessment> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!isDeepSeekDuplicateCheckEnabled() || !apiKey) {
    return { classification: "review_required", reason: "DeepSeek duplicate check is disabled or unconfigured" };
  }

  const view = (incident: DuplicateCheckIncident) => ({
    title: incident.title,
    description: incident.description,
    eventDate: incident.date instanceof Date ? incident.date.toISOString() : incident.date,
    datePrecision: incident.datePrecision || "exact_day",
    dateRange: incident.dateRange || null,
    location: incident.location,
    group: incident.group,
    casualties: incident.casualties,
    sourceReports: (incident.sources || []).map(({ title, publisher }) => ({ title, publisher })),
  });

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a conservative Nigerian security incident deduplication analyst. Reply with one JSON object only.",
          },
          {
            role: "user",
            content: `Decide whether REPORT A and REPORT B describe the same real-world attack or abduction episode. Independent news URLs and different headlines are expected and MUST NOT count as evidence that events are distinct. Compare the original event date or supported date interval, specific town and LGA, victim counts, named victims/participants, and event descriptions. An exact day inside a broader range is only compatible evidence, not proof of identity. Adjacent or overlapping dates with incomplete identity evidence require review_required. Events in the same state or LGA, or involving the same armed group, are not duplicates without a specific event-level link. If evidence is incomplete or conflicts materially, choose review_required. Never infer facts absent from these records.\n\nReturn JSON: {"classification":"same_event"|"distinct_events"|"review_required","reason":"short evidence-based reason"}\n\nREPORT A:\n${JSON.stringify(view(reportA), null, 2)}\n\nREPORT B:\n${JSON.stringify(view(reportB), null, 2)}`,
          },
        ],
        temperature: 0,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { classification: "review_required", reason: `DeepSeek duplicate check returned HTTP ${response.status}` };
    }
    const data: unknown = await response.json();
    const content = data && typeof data === "object" && Array.isArray((data as { choices?: unknown[] }).choices)
      ? (data as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]?.message?.content
      : undefined;
    if (typeof content !== "string" || !content.trim()) {
      return { classification: "review_required", reason: "DeepSeek duplicate check returned an empty response" };
    }
    const parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()) as Record<string, unknown>;
    const classification = parsed.classification;
    const reason = typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim().slice(0, 500)
      : "DeepSeek returned no duplicate rationale";
    if (classification === "same_event" || classification === "distinct_events" || classification === "review_required") {
      return { classification, reason };
    }
    return { classification: "review_required", reason: "DeepSeek returned an invalid duplicate classification" };
  } catch (error) {
    return {
      classification: "review_required",
      reason: `DeepSeek duplicate check failed: ${error instanceof Error ? error.message : String(error)}`.slice(0, 500),
    };
  }
}

const VALID_STATUSES = new Set(["confirmed", "unconfirmed", "developing"]);

function toCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function toDateString(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildPrompt(candidate: RawAttackData, articleText: string): string {
  const candidateView = {
    title: candidate.title,
    date: candidate.date,
    datePrecision: candidate.datePrecision || "exact_day",
    dateRange: candidate.dateRange || null,
    sourcePublishedAt: candidate.sources?.[0]?.publishedAt || null,
    location: candidate.location,
    group: candidate.group,
    casualties: candidate.casualties,
    status: candidate.status,
  };
  return `You verify and clean news-derived security incidents for a Nigerian tracker.

Classify the ARTICLE as a report of one event, multiple distinct events, a roundup with events that
cannot be separated from the text, or not an eligible incident. An event is one attack/abduction
episode with its own date and place. Separate attacks remain separate even when the article gives
one aggregate headline total. Do not combine casualties from different dates, towns, LGAs, or states.

Classify as "not_incident" if the article is any of:
- a denial, dismissal, or fact-check of an incident ("police dismiss...", "false claim", "no such attack");
- a security-force offensive operation or arrest with NO victim casualties (e.g. routine patrols, raid on criminal hideouts, or neutralization of terrorists where NO civilian or security personnel were killed, injured, or abducted);
- a threat, warning, analysis, opinion, or retrospective;
- not about Nigeria, or not a completed incident;
- no qualifying original armed/security incident.

NOTE: If the article documents an armed attack, ambush, or kidnapping/abduction of victims (even if troops subsequently responded, repelled attackers, or rescued/recovered the kidnap victims), CONFIRM the incident and record the victims affected (e.g. number abducted, killed, injured).

If one or more events are individually separable, return one object per event in "incidents". If an
article is a roundup or reports multiple events but you cannot confidently assign each event's date,
location, or victim count separately, or the original event date is unclear, set classification to
"review_required" and return no incidents.
Do not turn an article-wide total into a per-event count. Do not treat a report that explicitly says
it could not confirm an event as confirmed; it may be returned as unconfirmed with that limitation.

For EVERY event, provide short verbatim evidence excerpts copied from ARTICLE TEXT for the date,
location, and each non-null casualty count. Each excerpt must support only that event and field. If
the evidence for a field is absent or ambiguous, use null for a casualty count or request review for
date/location. RULES:
- Count VICTIMS only (civilians, soldiers, police, vigilantes). NEVER count attacker/bandit/insurgent deaths.
- Use null when a count is not stated. Do not invent numbers.
- Resolve relative event dates such as "yesterday" or a named weekday only against sourcePublishedAt. If sourcePublishedAt is absent or the relative phrase remains ambiguous, request review.
- Use "exact_day" only when one original event day is supported. Use "date_range" when the source supports a bounded multi-day period. In that case date is the range start and dateRange contains both bounds. Never substitute the publication date.
- "state" must be one canonical Nigerian state. "lga"/"town" use "Unknown" if not stated.
- Keep "status": "confirmed" if two+ independent sources clearly agree, "developing" if casualty figures conflict, otherwise "unconfirmed".

Respond with JSON only:
{
  "classification": "single_event" | "multiple_events" | "review_required" | "not_incident",
  "reason": "short explanation",
  "incidents": [{
    "title": string,
    "date": string,
    "datePrecision": "exact_day" | "date_range",
    "dateRange": { "start": string | null, "end": string | null },
    "dateEvidence": string,
    "state": string,
    "lga": string,
    "town": string,
    "locationEvidence": string,
    "group": string,
    "status": "confirmed" | "unconfirmed" | "developing",
    "killed": number | null,
    "killedEvidence": string,
    "injured": number | null,
    "injuredEvidence": string,
    "kidnapped": number | null,
    "kidnappedEvidence": string,
    "displaced": number | null,
    "displacedEvidence": string,
    "tags": string[]
  }]
}

CANDIDATE:
${JSON.stringify(candidateView, null, 2)}

ARTICLE TEXT:
${articleText.slice(0, MAX_ARTICLE_CHARS)}`;
}

function fallback(reason: string, candidate?: RawAttackData): DeepSeekCleanupResult {
  return candidate
    ? { confirmed: true, reason, incident: candidate, fallback: true }
    : { confirmed: false, reason };
}

export async function cleanAndConfirmIncident(
  candidate: RawAttackData,
  articleText: string,
): Promise<DeepSeekCleanupResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!isDeepSeekCleanupEnabled() || !apiKey) return { confirmed: true, reason: "deepseek disabled", incident: candidate };

  let parsed: Record<string, unknown>;
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a conservative Nigerian security-incident verification analyst. Reply with a single JSON object and nothing else.",
          },
          { role: "user", content: buildPrompt(candidate, articleText) },
        ],
        temperature: 0,
        max_tokens: 2200,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(DEEPSEEK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return fallback(`deepseek HTTP ${response.status}; kept heuristic candidate`, candidate);
    }

    const data: unknown = await response.json();
    const content =
      data && typeof data === "object" && Array.isArray((data as { choices?: unknown[] }).choices)
        ? ((data as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]?.message?.content ?? "")
        : "";
    if (typeof content !== "string" || !content.trim()) {
      return fallback("deepseek empty response; kept heuristic candidate", candidate);
    }
    parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()) as Record<string, unknown>;
  } catch (error) {
    return fallback(`deepseek error (${error instanceof Error ? error.message : String(error)}); kept heuristic candidate`, candidate);
  }

  const classification = parsed.classification;
  const reason = typeof parsed.reason === "string" ? parsed.reason : "DeepSeek could not establish event identity";
  if (classification === "review_required") return { confirmed: false, reviewRequired: true, reason, classification };
  if (classification === "not_incident") return { confirmed: false, reason, classification };
  if (classification !== "single_event" && classification !== "multiple_events") {
    return { confirmed: false, reviewRequired: true, reason: "DeepSeek returned an invalid event classification" };
  }
  if (!Array.isArray(parsed.incidents) || parsed.incidents.length === 0) {
    return { confirmed: false, reviewRequired: true, reason: "DeepSeek classified the article as an incident but returned no event records" };
  }
  if ((classification === "single_event" && parsed.incidents.length !== 1) || (classification === "multiple_events" && parsed.incidents.length < 2)) {
    return { confirmed: false, reviewRequired: true, reason: "DeepSeek classification and event count disagree" };
  }

  const normalizedArticle = normalizeEvidenceText(articleText);
  const cleanedIncidents: RawAttackData[] = [];
  for (const raw of parsed.incidents) {
    if (!raw || typeof raw !== "object") return { confirmed: false, reviewRequired: true, reason: "DeepSeek returned an invalid event record" };
    const event = raw as Record<string, unknown>;
    const evidence = (field: string) => typeof event[field] === "string" ? normalizeEvidenceText(event[field] as string) : "";
    const date = toDateString(event.date);
    const datePrecision = event.datePrecision === "date_range" ? "date_range" : event.datePrecision === "exact_day" ? "exact_day" : null;
    const rangeValue = event.dateRange && typeof event.dateRange === "object" ? event.dateRange as Record<string, unknown> : null;
    const rangeStart = toDateString(rangeValue?.start);
    const rangeEnd = toDateString(rangeValue?.end);
    const stateValue = typeof event.state === "string" ? event.state.trim() : "";
    const lga = typeof event.lga === "string" ? event.lga.trim() : "";
    const town = typeof event.town === "string" ? event.town.trim() : "";
    const dateEvidence = evidence("dateEvidence");
    const locationEvidence = evidence("locationEvidence");
    const normalizedDate = datePrecision ? normalizeIncidentDate({
      date,
      datePrecision,
      dateRange: datePrecision === "date_range" ? { start: rangeStart, end: rangeEnd } : undefined,
    }) : null;
    const sourcePublishedAt = candidate.sources?.[0]?.publishedAt ? new Date(candidate.sources[0].publishedAt) : null;
    const reparsedEvidence = dateEvidence
      ? dateEvidenceFromText(`${dateEvidence} attack`, sourcePublishedAt && !Number.isNaN(sourcePublishedAt.getTime()) ? sourcePublishedAt : null)
      : null;
    const reparsedDate = reparsedEvidence ? normalizeIncidentDate({
      date: reparsedEvidence.date,
      datePrecision: reparsedEvidence.datePrecision,
      dateRange: reparsedEvidence.dateRange,
    }) : null;
    const now = new Date();
    const latestSupportedDay = sourcePublishedAt && !Number.isNaN(sourcePublishedAt.getTime()) ? sourcePublishedAt : now;
    const lagosAnchor = new Date(latestSupportedDay.getTime() + 60 * 60 * 1000);
    const latestSupportedDayEnd = Date.UTC(lagosAnchor.getUTCFullYear(), lagosAnchor.getUTCMonth(), lagosAnchor.getUTCDate(), 23, 59, 59, 999);
    const unsupportedFuture = Boolean(normalizedDate && normalizedDate.interval.end.getTime() > latestSupportedDayEnd);
    const evidenceMismatch = Boolean(reparsedDate && normalizedDate && (
      reparsedDate.datePrecision !== normalizedDate.datePrecision ||
      reparsedDate.interval.start.toISOString().slice(0, 10) !== normalizedDate.interval.start.toISOString().slice(0, 10) ||
      reparsedDate.interval.end.toISOString().slice(0, 10) !== normalizedDate.interval.end.toISOString().slice(0, 10)
    ));
    if (!date || !normalizedDate || !stateValue || !lga || !town || !dateEvidence || !locationEvidence ||
        !normalizedArticle.includes(dateEvidence) || !normalizedArticle.includes(locationEvidence) ||
        unsupportedFuture || evidenceMismatch || (datePrecision === "date_range" && !reparsedDate) ||
        /^(unknown|unspecified|n\/a)$/i.test(lga) || /^(unknown|unspecified|n\/a)$/i.test(town)) {
      return { confirmed: false, reviewRequired: true, reason: "Event date or location lacks specific supporting article text" };
    }

    const countFields = ["killed", "injured", "kidnapped", "displaced"] as const;
    const counts: Record<string, number | null> = {};
    const casualtyMeta: Record<string, { precision: "exact" | "range"; min: number | null; max: number | null; estimate: number | null; sourceText?: string }> = {};
    for (const field of countFields) {
      const value = toCount(event[field]);
      const quote = evidence(`${field}Evidence`);
      if (value != null && (!quote || !normalizedArticle.includes(quote))) {
        return { confirmed: false, reviewRequired: true, reason: `The ${field} figure lacks supporting article text` };
      }
      counts[field] = value;
      if (value != null) {
        const isMinimum = /\b(?:more than|over|at least|no fewer than)\b/i.test(quote);
        const minimum = isMinimum ? value + (/\b(?:more than|over)\b/i.test(quote) ? 1 : 0) : value;
        casualtyMeta[field] = {
          precision: isMinimum ? "range" : "exact",
          min: minimum,
          max: isMinimum ? null : value,
          estimate: minimum,
          sourceText: typeof event[`${field}Evidence`] === "string" ? (event[`${field}Evidence`] as string).slice(0, 300) : undefined,
        };
        if (isMinimum) counts[field] = minimum;
      }
    }

    const title = typeof event.title === "string" && event.title.trim() ? event.title.trim().slice(0, 500) : "";
    const group = typeof event.group === "string" && event.group.trim() ? event.group.trim().slice(0, 120) : candidate.group;
    const status = typeof event.status === "string" && VALID_STATUSES.has(event.status)
      ? (event.status as RawAttackData["status"])
      : "unconfirmed";
    if (!title || !VALID_STATUSES.has(status)) return { confirmed: false, reviewRequired: true, reason: "Event title or status is invalid" };
    const cleaned: RawAttackData = {
      ...candidate,
      title,
      description: `${title}. ${typeof event.description === "string" ? event.description.trim() : event.locationEvidence}`.slice(0, 5000),
      date: normalizedDate.date.toISOString(),
      datePrecision: normalizedDate.datePrecision,
      dateRange: normalizedDate.dateRange ? {
        start: normalizedDate.dateRange.start.toISOString(),
        end: normalizedDate.dateRange.end.toISOString(),
      } : undefined,
      dateEvidence: typeof event.dateEvidence === "string" ? event.dateEvidence.trim().slice(0, 300) : candidate.dateEvidence,
      location: {
        state: normalizeStateName(stateValue), lga: lga.slice(0, 120), town: town.slice(0, 160),
        precision: candidate.location.precision, notes: `Event location supported by source text: ${event.locationEvidence}`.slice(0, 500),
      },
      group,
      casualties: counts as RawAttackData["casualties"],
      casualtyMeta,
      status: normalizedDate.datePrecision === "exact_day" ? status : "developing",
      tags: Array.from(new Set([...(candidate.tags || []), ...(Array.isArray(event.tags) ? event.tags.filter((t): t is string => typeof t === "string") : []), "deepseek-verified", ...(normalizedDate.datePrecision === "exact_day" ? [] : ["date-uncertainty"])])),
    };
    const scopeRejection = screenIncidentCandidate({ title: cleaned.title, description: cleaned.description, group: cleaned.group });
    if (scopeRejection) return { confirmed: false, reason: `scope re-check failed: ${scopeRejection}` };
    cleanedIncidents.push(cleaned);
  }

  return {
    confirmed: true,
    reason,
    classification,
    incidents: cleanedIncidents,
    incident: cleanedIncidents.length === 1 ? cleanedIncidents[0] : undefined,
  };
}

function normalizeEvidenceText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
