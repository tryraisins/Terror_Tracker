/**
 * Optional DeepSeek cleanup/confirmation pass for already-heuristic-cleared
 * incidents. It runs only when DEEPSEEK_API_KEY is set (and cleanup is not
 * explicitly disabled), so the scheduled scan stays free by default.
 *
 * The model receives the candidate plus the fetched article text and must
 * (a) confirm the source describes a specific, completed, original armed/
 * security incident in Nigeria, and (b) return cleaned structured fields.
 * It is a gate + normalizer, never a source of new URLs.
 */

import { RawAttackData } from "./free-news";
import { normalizeCasualtyFields } from "./incident-uncertainty";
import { normalizeStateName } from "./normalize-state";
import { screenIncidentCandidate } from "./incident-scope";

const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const DEEPSEEK_TIMEOUT_MS = Number(process.env.DEEPSEEK_TIMEOUT_MS || 30000);
const MAX_ARTICLE_CHARS = 6000;

export interface DeepSeekCleanupResult {
  confirmed: boolean;
  reason: string;
  incident?: RawAttackData;
  /** True when DeepSeek could not be reached/parsed and the heuristic candidate was kept. */
  fallback?: boolean;
}

export function isDeepSeekCleanupEnabled(): boolean {
  if (process.env.DEEPSEEK_CLEANUP_ENABLED === "false") return false;
  return Boolean(process.env.DEEPSEEK_API_KEY);
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
    location: candidate.location,
    group: candidate.group,
    casualties: candidate.casualties,
    status: candidate.status,
  };
  return `You verify and clean news-derived security incidents for a Nigerian tracker.

Decide whether the ARTICLE describes a specific, completed, original armed/security incident in
Nigeria (attack, ambush, raid, shooting, kidnapping/abduction, massacre, IED/bombing, or an armed
attack on civilians or security personnel).

Set "confirmed" to false if the article is any of:
- a denial, dismissal, or fact-check of an incident ("police dismiss...", "false claim", "no such attack");
- a security-force offensive operation or arrest with NO victim casualties (e.g. routine patrols, raid on criminal hideouts, or neutralization of terrorists where NO civilian or security personnel were killed, injured, or abducted);
- a threat, warning, analysis, opinion, roundup, or retrospective;
- not about Nigeria, or not a completed incident;
- missing a clear original event date.

NOTE: If the article documents an armed attack, ambush, or kidnapping/abduction of victims (even if troops subsequently responded, repelled attackers, or rescued/recovered the kidnap victims), CONFIRM the incident and record the victims affected (e.g. number abducted, killed, injured).

If confirmed, return cleaned fields. RULES:
- Count VICTIMS only (civilians, soldiers, police, vigilantes). NEVER count attacker/bandit/insurgent deaths.
- Use null when a count is not stated. Do not invent numbers.
- "date" must be the original event date in ISO 8601 (YYYY-MM-DD or full ISO); never the publication date.
- "state" must be one canonical Nigerian state. "lga"/"town" use "Unknown" if not stated.
- Keep "status": "confirmed" if two+ independent sources clearly agree, "developing" if casualty figures conflict, otherwise "unconfirmed".

Respond with JSON only:
{
  "confirmed": boolean,
  "reason": "short explanation",
  "title": string,
  "date": string,
  "state": string,
  "lga": string,
  "town": string,
  "group": string,
  "status": "confirmed" | "unconfirmed" | "developing",
  "killed": number | null,
  "injured": number | null,
  "kidnapped": number | null,
  "displaced": number | null,
  "tags": string[]
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
        max_tokens: 900,
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

  if (parsed.confirmed !== true) {
    return { confirmed: false, reason: typeof parsed.reason === "string" ? parsed.reason : "not confirmed by deepseek" };
  }

  const state = typeof parsed.state === "string" && parsed.state.trim()
    ? normalizeStateName(parsed.state)
    : candidate.location.state;
  const date = toDateString(parsed.date) || candidate.date;
  const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim().slice(0, 500) : candidate.title;
  const group = typeof parsed.group === "string" && parsed.group.trim() ? parsed.group.trim().slice(0, 120) : candidate.group;
  const status = typeof parsed.status === "string" && VALID_STATUSES.has(parsed.status)
    ? (parsed.status as RawAttackData["status"])
    : candidate.status;

  const normalizedImpact = normalizeCasualtyFields({
    killed: toCount(parsed.killed),
    injured: toCount(parsed.injured),
    kidnapped: toCount(parsed.kidnapped),
    displaced: toCount(parsed.displaced),
  });

  const cleaned: RawAttackData = {
    ...candidate,
    title,
    date,
    datePrecision: "exact_day",
    location: {
      state,
      lga: typeof parsed.lga === "string" && parsed.lga.trim() ? parsed.lga.trim() : candidate.location.lga || "Unknown",
      town: typeof parsed.town === "string" && parsed.town.trim() ? parsed.town.trim() : candidate.location.town || "Unknown",
      precision: candidate.location.precision,
      notes: candidate.location.notes,
    },
    group,
    casualties: normalizedImpact.casualties,
    casualtyMeta: normalizedImpact.casualtyMeta,
    status,
    tags: Array.from(new Set([...(candidate.tags || []), ...(Array.isArray(parsed.tags) ? parsed.tags.filter((t): t is string => typeof t === "string") : []), "deepseek-verified"])),
  };

  const scopeRejection = screenIncidentCandidate({ title: cleaned.title, description: articleText, group: cleaned.group });
  if (scopeRejection) return { confirmed: false, reason: `scope re-check failed: ${scopeRejection}` };

  return { confirmed: true, reason: typeof parsed.reason === "string" ? parsed.reason : "confirmed", incident: cleaned };
}
