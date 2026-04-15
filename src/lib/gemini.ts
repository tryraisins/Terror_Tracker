import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { normalizeStateName } from "./normalize-state";


export interface RawAttackData {
  title: string;
  description: string;
  date: string;
  location: {
    state: string;
    lga: string;
    town: string;
  };
  group: string;
  casualties: {
    killed: number | null;
    injured: number | null;
    kidnapped: number | null;
    displaced: number | null;
  };
  sources: {
    url: string;
    title: string;
    publisher: string;
  }[];
  civilianCasualties: boolean;
  status: "confirmed" | "unconfirmed" | "developing";
  tags: string[];
}

/**
 * Generate a deduplication hash based on core attack identifiers.
 * Uses date (day-level), state, town, and group to create a unique hash.
 * This prevents the same incident from being stored twice even if
 * described differently by different sources.
 */
export function generateAttackHash(attack: RawAttackData): string {
  const dateStr = new Date(attack.date).toISOString().split("T")[0]; // Day-level
  const normalizedState = normalizeStateName(attack.location.state).toLowerCase();
  const normalizedGroup = attack.group.toLowerCase().trim();

  // When town is unknown/unspecified, fall back to LGA so that two reports of the
  // same incident — one with a specific LGA and one with "Unknown" town — produce
  // the same hash and are blocked at the unique-index level.
  const rawTown = (attack.location.town || "").toLowerCase().trim();
  const townIsUnknown = !rawTown || rawTown === "unknown" || rawTown.startsWith("unknown ");
  const normalizedTown = townIsUnknown
    ? (attack.location.lga || "unknown").toLowerCase().trim()
    : rawTown;

  const hashInput = `${dateStr}|${normalizedState}|${normalizedTown}|${normalizedGroup}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

// ──────────────────────────────────────────────
// Shared source credibility validation
// ──────────────────────────────────────────────

const TRUSTED_DOMAINS = new Set([
  // Nigerian Media
  "premiumtimesng.com", "thecable.ng", "gazettengr.com", "channelstv.com",
  "saharareporters.com", "punchng.com", "vanguardngr.com", "dailytrust.com",
  "humanglemedia.com", "guardian.ng", "dailypost.ng", "newscentral.africa",
  "arise.tv", "tvcnews.tv", "thisdaylive.com", "thenationonlineng.net",
  "leadership.ng", "sunnewsonline.com", "tribuneonlineng.com", "blueprint.ng",
  "businessday.ng", "thewhistler.ng", "icirnigeria.org", "ripplesnigeria.com",
  "dailynigerian.com", "prnigeria.com", "parallelfactsnews.com",
  // International Media
  "aljazeera.com", "dw.com", "news.sky.com", "bbc.com", "bbc.co.uk",
  "cnn.com", "france24.com", "voanews.com", "apnews.com", "reuters.com",
  // Security Trackers
  "acleddata.com", "network.zagazola.org",
  // Reference
  "en.wikipedia.org",
  // Social — Tier 1 intelligence
  "x.com", "twitter.com",
  // Popular Nigerian news portals
  "pulse.ng",
]);

const TRUSTED_PUBLISHERS = [
  "Premium Times", "The Cable", "Peoples Gazette", "Channels TV", "Sahara Reporters",
  "Punch", "Vanguard", "Daily Trust", "HumAngle", "Guardian Nigeria", "The Guardian Nigeria",
  "Daily Post", "News Central", "Arise News", "TVC News", "ThisDay", "The Nation",
  "Leadership", "Sun News", "Tribune", "Blueprint", "Business Day", "The Whistler",
  "ICIR", "Ripples Nigeria", "Daily Nigerian", "PRNigeria", "Parallel Facts", "Parallel Facts News",
  "Al Jazeera", "Deutsche Welle", "DW", "Sky News", "BBC", "CNN", "France 24",
  "Voice of America", "VOA", "Associated Press", "AP", "AFP", "Reuters",
  "ACLED", "Zagazola", "Wikipedia",
  "Twitter", "X.com", "@BrantPhilip_", "BrantPhilip", "@Sazedek", "Sazedek",
  "Pulse Nigeria",
];

const BANNED_SOURCES = [
  "truth nigeria", "aid to the church in need", "acn international",
  "the journal", "council on foreign relations", "cfr.org", "trust tv",
  "zenit news", "youtube", "blogspot", "wordpress.com", "medium.com",
];

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return "";
  }
}

function isSourceTrusted(source: { url: string; publisher: string }): boolean {
  const pubLower = (source.publisher || "").toLowerCase();
  if (BANNED_SOURCES.some(banned => pubLower.includes(banned))) return false;
  if (source.url && BANNED_SOURCES.some(banned => source.url.toLowerCase().includes(banned))) return false;

  const domain = extractDomain(source.url);
  if (domain && TRUSTED_DOMAINS.has(domain)) return true;
  const parts = domain.split(".");
  if (parts.length > 2) {
    const rootDomain = parts.slice(-2).join(".");
    if (TRUSTED_DOMAINS.has(rootDomain)) return true;
  }

  if (pubLower && TRUSTED_PUBLISHERS.some(tp => pubLower.includes(tp.toLowerCase()))) return true;
  if (!source.publisher || pubLower === "unknown" || pubLower.length < 3) return false;

  return false;
}

const SOURCE_STOPWORDS = new Set([
  "attack", "attacks", "attacked", "kills", "kill", "killed", "gunmen", "bandits",
  "terrorists", "terrorist", "unknown", "armed", "group", "groups", "incident",
  "incidents", "state", "states", "community", "communities", "village", "villages",
  "security", "forces", "troops", "police", "soldiers", "residents", "people",
  "breaking", "news", "report", "reports", "nigeria", "nigerian",
]);

const EVIDENCE_FETCH_TIMEOUT_MS = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 8000);
const MAX_SOURCES_TO_VERIFY = Number(process.env.MAX_SOURCES_TO_VERIFY || 3);

interface ValidationOptions {
  windowStart: Date;
  windowEnd: Date;
  maxSourceAgeDays: number;
  label: string;
}

interface SourceInspection {
  ok: boolean;
  finalUrl: string;
  finalTitle: string;
  publishedAt: Date | null;
}

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function inferIncidentDateFromNarrative(description: string): Date | null {
  const text = String(description || "");
  const patterns = [
    /\b(?:On\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:or|\/|-)\s*(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(20\d{2})\b/i,
    /\bOn\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(20\d{2})\b/i,
    /\b(?:On\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(20\d{2})\b/i,
    /\b(?:On|Since)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:,\s*|\s+)(20\d{2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let day: number;
    let monthName: string;
    let year: number;

    if (match.length === 5) {
      monthName = match[1];
      day = Number(match[2]);
      year = Number(match[4]);
    } else if (Number.isNaN(Number(match[1]))) {
      monthName = match[1];
      day = Number(match[2]);
      year = Number(match[3]);
    } else {
      day = Number(match[1]);
      monthName = match[2];
      year = Number(match[3]);
    }

    const monthIndex = MONTH_NAME_TO_INDEX[monthName.toLowerCase()];
    if (monthIndex === undefined || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    if (day < 1 || day > 31 || year < 2015 || year > new Date().getUTCFullYear() + 1) continue;

    const inferred = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
    if (!Number.isNaN(inferred.getTime())) return inferred;
  }

  return null;
}

function reconcileIncidentDate(attack: RawAttackData): Date {
  const parsed = new Date(attack.date);
  if (Number.isNaN(parsed.getTime())) return parsed;

  const hinted = inferIncidentDateFromNarrative(attack.description);
  if (!hinted) return parsed;

  const diffDays = Math.abs(hinted.getTime() - parsed.getTime()) / (24 * 60 * 60 * 1000);

  // Only trust explicit narrative dates when the gap is meaningful but still plausible
  // for late publication / follow-up reports.
  if (diffDays >= 7 && diffDays <= 60) {
    return hinted;
  }

  return parsed;
}

function isLikelyOperationalUpdate(attack: RawAttackData): boolean {
  const title = String(attack.title || "");
  const description = String(attack.description || "");
  const combined = `${title} ${description}`.toLowerCase();

  const isSecurityOperation =
    /\b(troops?|soldiers?|military|army|air\s*force|naf|joint\s*task\s*force|jtf|operation\s*hadin\s*kai|dhq|security\s*operatives?|police)\b/i.test(combined);

  const operationalVerb =
    /\b(rescue|rescued|arrest|arrested|foiled?|foil|recover|recovered|neutrali[sz]e|neutrali[sz]ed|eliminat(?:e|ed|ing)|raid(?:ed|ing)?)\b/i.test(combined);

  const attackDrivenTitle =
    /\b(boko\s*haram|iswap|bandits?|gunmen|terrorists?|insurgents?|militants?|unknown\s*gunmen)\s+(kill(?:ed|s|ing)?|abduct(?:ed|s|ing)?|attack(?:ed|s|ing)?|kidnap(?:ped|s|ping)?|storm(?:ed|s|ing)?|raid(?:ed|s|ing)?)\b/i.test(title);

  const victimRolePresent =
    /\b(civilians?|villagers?|residents?|farmers?|passengers?|worshippers?|students?|women|children|soldiers?|troops?|police|officers?|personnel|vigilantes?)\b/i.test(combined);
  const harmVerbPresent =
    /\b(killed|died|injured|wounded|kidnapped|abducted|attacked|ambushed|massacred|slaughtered)\b/i.test(combined);
  const mentionsVictimHarm = victimRolePresent && harmVerbPresent;

  return isSecurityOperation && operationalVerb && !mentionsVictimHarm && !attackDrivenTitle;
}

function normalizeText(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string, minLength = 4): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => token.length >= minLength && !SOURCE_STOPWORDS.has(token));
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function isUsableEvidenceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (hostname === "vertexaisearch.cloud.google.com") return false;
    if (hostname.endsWith("google.com") && pathname.startsWith("/search")) return false;

    // Reject homepages — must point to a specific article path
    if (!pathname || pathname === "/" || pathname.length < 3) return false;

    // Reject direct links to files and assets
    const invalidExtensions = [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".pdf", ".json", ".xml", ".ico"];
    if (invalidExtensions.some(ext => pathname.endsWith(ext))) return false;

    return true;
  } catch {
    return false;
  }
}

function parseLooseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  if (year < 2015 || year > new Date().getUTCFullYear() + 1) return null;

  return parsed;
}

function extractDateFromUrl(url: string): Date | null {
  const match = url.match(/(20\d{2})[/-](\d{2})[/-](\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return parseLooseDate(`${year}-${month}-${day}T12:00:00Z`);
}

function extractHtmlTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return "";

  return titleMatch[1]
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function extractPublishedDate(html: string, finalUrl: string): Date | null {
  const patterns = [
    /"datePublished"\s*:\s*"([^"]+)"/i,
    /"dateCreated"\s*:\s*"([^"]+)"/i,
    /property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
    /name=["']pubdate["'][^>]*content=["']([^"']+)["']/i,
    /name=["']publishdate["'][^>]*content=["']([^"']+)["']/i,
    /itemprop=["']datePublished["'][^>]*content=["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const parsed = parseLooseDate(match?.[1] || "");
    if (parsed) return parsed;
  }

  return extractDateFromUrl(finalUrl);
}

function buildAttackMatchers(attack: RawAttackData) {
  const locationTokens = dedupeStrings([
    ...tokenize(attack.location.state, 3),
    ...tokenize(attack.location.lga, 3),
    ...tokenize(attack.location.town, 3),
  ]).filter(token => token !== "unknown");

  const semanticTokens = dedupeStrings([
    ...tokenize(attack.title, 4),
    ...tokenize(attack.group, 4),
    ...tokenize(attack.description, 4).slice(0, 12),
  ]).filter(token => !locationTokens.includes(token));

  return { locationTokens, semanticTokens };
}

function isSourceRelevantToAttack(
  attack: RawAttackData,
  title: string,
  url: string,
): boolean {
  const { locationTokens, semanticTokens } = buildAttackMatchers(attack);
  const sourceText = `${title} ${url}`;
  const sourceTokens = new Set([
    ...tokenize(sourceText, 3),
    ...tokenize(sourceText, 4),
  ]);

  const locationHits = locationTokens.filter(token => sourceTokens.has(token)).length;
  const semanticHits = semanticTokens.filter(token => sourceTokens.has(token)).length;

  if (locationHits >= 1 && semanticHits >= 1) return true;
  if (semanticHits >= 2) return true;

  return false;
}

function scoreGroundingChunkMatch(
  attack: RawAttackData,
  source: { title: string; publisher: string },
  chunk: any,
): number {
  const chunkTitle = normalizeText(chunk?.web?.title || "");
  const sourceTitle = normalizeText(source.title || "");
  if (!chunkTitle || !sourceTitle) return -1;

  const sourceTokens = new Set(tokenize(sourceTitle, 3));
  const chunkTokens = tokenize(chunkTitle, 3);
  const titleOverlap = chunkTokens.filter(token => sourceTokens.has(token)).length;

  let score = titleOverlap;

  const domain = extractDomain(chunk?.web?.uri || "");
  const publisher = normalizeText(source.publisher || "");
  if (publisher && domain) {
    // Award +2 whenever the publisher name maps to the chunk's domain
    const PUBLISHER_DOMAIN_MAP: [string, string][] = [
      ["zagazola",       "zagazola"],
      ["premium times",  "premiumtimesng.com"],
      ["punch",          "punchng.com"],
      ["channels",       "channelstv.com"],
      ["daily post",     "dailypost.ng"],
      ["daily trust",    "dailytrust.com"],
      ["vanguard",       "vanguardngr.com"],
      ["sahara",         "saharareporters.com"],
      ["humangle",       "humanglemedia.com"],
      ["the cable",      "thecable.ng"],
      ["peoples gazette","gazettengr.com"],
      ["prnigeria",      "prnigeria.com"],
      ["leadership",     "leadership.ng"],
      ["blueprint",      "blueprint.ng"],
      ["the nation",     "thenationonlineng.net"],
      ["thisday",        "thisdaylive.com"],
      ["tvc",            "tvcnews.tv"],
      ["arise",          "arise.tv"],
      ["icir",           "icirnigeria.org"],
      ["ripples",        "ripplesnigeria.com"],
      ["guardian nigeria","guardian.ng"],
      ["daily nigerian", "dailynigerian.com"],
      ["parallel facts", "parallelfactsnews.com"],
      ["the whistler",   "thewhistler.ng"],
      ["bbc",            "bbc.com"],
      ["reuters",        "reuters.com"],
      ["ap",             "apnews.com"],
      ["al jazeera",     "aljazeera.com"],
      ["voa",            "voanews.com"],
      ["dw",             "dw.com"],
      ["pulse",          "pulse.ng"],
    ];
    for (const [pub, dom] of PUBLISHER_DOMAIN_MAP) {
      if (publisher.includes(pub) && domain.includes(dom)) { score += 2; break; }
    }
  }

  if (isSourceRelevantToAttack(attack, chunkTitle, chunk?.web?.uri || "")) {
    score += 2;
  }

  return score;
}

async function inspectSourceUrl(url: string): Promise<SourceInspection> {
  if (!isUsableEvidenceUrl(url)) {
    return { ok: false, finalUrl: url, finalTitle: "", publishedAt: null };
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(EVIDENCE_FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; NigeriaAttackTracker/1.0)",
      },
    });

    const finalUrl = response.url || url;
    if (!response.ok || !isUsableEvidenceUrl(finalUrl)) {
      return { ok: false, finalUrl, finalTitle: "", publishedAt: null };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        ok: true,
        finalUrl,
        finalTitle: "",
        publishedAt: extractDateFromUrl(finalUrl),
      };
    }

    const html = await response.text();
    return {
      ok: true,
      finalUrl,
      finalTitle: extractHtmlTitle(html),
      publishedAt: extractPublishedDate(html, finalUrl),
    };
  } catch {
    return { ok: false, finalUrl: url, finalTitle: "", publishedAt: null };
  }
}

/** Resolve grounding redirect URLs using Gemini's groundingMetadata chunks.
 *  Uses a multi-tier fallback strategy to minimise empty URLs:
 *  1. Best scored match if score >= 2 (original approach, now with expanded publisher map)
 *  2. Any chunk from the same publisher's trusted domain
 *  3. Any chunk from ANY trusted domain that is relevant to the attack
 *  4. Best scored chunk overall (even if score is low) — avoids empty URL as last resort
 */
function resolveGroundingUrls(attacks: RawAttackData[], groundingChunks: any[]): RawAttackData[] {
  if (groundingChunks.length === 0) return attacks;

  const validChunks = groundingChunks.filter((c: any) => c?.web?.uri && c?.web?.title);

  return attacks.map(attack => ({
    ...attack,
    sources: attack.sources.map(source => {
      // Non-redirect URLs: keep as-is
      if (!source.url.includes("grounding-api-redirect") && source.url.startsWith("http")) return source;

      const ranked = validChunks
        .map((chunk: any) => ({ chunk, score: scoreGroundingChunkMatch(attack, source, chunk) }))
        .sort((a: any, b: any) => b.score - a.score);

      // Tier 1: good score match
      const best = ranked[0];
      if (best && best.score >= 2) return { ...source, url: best.chunk.web.uri };

      // Tier 2: any chunk from the same publisher's known domain
      const pubLower = (source.publisher || "").toLowerCase();
      const publisherDomain = (() => {
        const MAP: [string, string][] = [
          ["prnigeria", "prnigeria.com"], ["daily trust", "dailytrust.com"],
          ["premium times", "premiumtimesng.com"], ["vanguard", "vanguardngr.com"],
          ["punch", "punchng.com"], ["channels", "channelstv.com"],
          ["sahara", "saharareporters.com"], ["humangle", "humanglemedia.com"],
          ["the cable", "thecable.ng"], ["peoples gazette", "gazettengr.com"],
          ["daily post", "dailypost.ng"], ["leadership", "leadership.ng"],
          ["the nation", "thenationonlineng.net"], ["thisday", "thisdaylive.com"],
          ["tvc", "tvcnews.tv"], ["arise", "arise.tv"], ["icir", "icirnigeria.org"],
          ["ripples", "ripplesnigeria.com"], ["guardian nigeria", "guardian.ng"],
          ["daily nigerian", "dailynigerian.com"], ["parallel facts", "parallelfactsnews.com"],
          ["whistler", "thewhistler.ng"], ["zagazola", "zagazola"],
          ["bbc", "bbc.com"], ["reuters", "reuters.com"], ["ap", "apnews.com"],
          ["al jazeera", "aljazeera.com"], ["voa", "voanews.com"], ["dw", "dw.com"],
          ["blueprint", "blueprint.ng"], ["pulse", "pulse.ng"],
        ];
        return MAP.find(([pub]) => pubLower.includes(pub))?.[1];
      })();
      if (publisherDomain) {
        const domainMatch = ranked.find((m: any) => {
          const d = extractDomain(m.chunk.web.uri || "");
          return d === publisherDomain || d.endsWith(`.${publisherDomain}`);
        });
        if (domainMatch) return { ...source, url: (domainMatch as any).chunk.web.uri };
      }

      // Tier 3: any chunk from a trusted domain that has some relevance to this attack
      const relevantTrusted = ranked.find((m: any) => {
        const d = extractDomain(m.chunk.web.uri || "");
        const domainTrusted = TRUSTED_DOMAINS.has(d) ||
          (d.split(".").length > 2 && TRUSTED_DOMAINS.has(d.split(".").slice(-2).join(".")));
        return domainTrusted && isSourceRelevantToAttack(attack, normalizeText(m.chunk.web.title || ""), m.chunk.web.uri);
      });
      if (relevantTrusted) return { ...source, url: (relevantTrusted as any).chunk.web.uri };

      // Tier 4: best available chunk from any trusted domain (last resort)
      const anyTrusted = ranked.find((m: any) => {
        const d = extractDomain(m.chunk.web.uri || "");
        return TRUSTED_DOMAINS.has(d) ||
          (d.split(".").length > 2 && TRUSTED_DOMAINS.has(d.split(".").slice(-2).join(".")));
      });
      if (anyTrusted) return { ...source, url: (anyTrusted as any).chunk.web.uri };

      // All chunk-matching tiers failed. Keep the original URL (may be a grounding
      // redirect) so validateAndNormalize can follow the redirect to recover the
      // real article URL rather than discarding the source entirely.
      return source;
    }),
  }));
}

/** Filter attacks to only those with at least one trusted source, and normalize state names */
async function validateAndNormalize(
  attacks: RawAttackData[],
  options: ValidationOptions,
): Promise<RawAttackData[]> {
  const sourceInspectionCache = new Map<string, Promise<SourceInspection>>();
  const freshnessThreshold = new Date(options.windowEnd);
  freshnessThreshold.setUTCDate(freshnessThreshold.getUTCDate() - options.maxSourceAgeDays);

  const inspected = await Promise.all(attacks
    .map(attack => ({
      ...attack,
      sources: attack.sources.filter(isSourceTrusted),
      location: { ...attack.location, state: normalizeStateName(attack.location.state) },
    }))
    .filter(attack => attack.sources.length > 0)
    .filter(attack => attack.title && attack.description && attack.date && attack.location?.state && attack.group)
    .map(async attack => {
      if (isLikelyOperationalUpdate(attack)) {
        console.log(`[${options.label}] Dropping likely operational update: ${attack.title}`);
        return null;
      }

      const attackDate = reconcileIncidentDate(attack);
      if (Number.isNaN(attackDate.getTime())) return null;
      if (attackDate < options.windowStart || attackDate > options.windowEnd) return null;

      const dedupedSources = attack.sources.filter((source, index, allSources) => {
        const key = `${source.url}|${source.title}|${source.publisher}`.toLowerCase();
        return allSources.findIndex(other => `${other.url}|${other.title}|${other.publisher}`.toLowerCase() === key) === index;
      });

      let verifiedSources = 0;
      const sources = [];



      for (let source of dedupedSources) {
        let resolvedUrl = source.url;

        // Grounding redirect URLs couldn't be matched to a real article URL via
        // chunk scoring. Try following the redirect directly to recover the
        // actual article URL (e.g. saharareporters.com, premiumtimesng.com).
        if (resolvedUrl && resolvedUrl.includes("grounding-api-redirect")) {
          try {
            const res = await fetch(resolvedUrl, {
              redirect: "follow",
              signal: AbortSignal.timeout(EVIDENCE_FETCH_TIMEOUT_MS),
              headers: { "user-agent": "Mozilla/5.0 (compatible; NigeriaAttackTracker/1.0)" },
            });
            if (res.ok && isUsableEvidenceUrl(res.url)) {
              resolvedUrl = res.url;
              source = { ...source, url: resolvedUrl };
            } else {
              console.log(`[${options.label}] Grounding redirect resolved to unusable URL (${res.status}), dropping source: ${source.publisher}`);
              continue;
            }
          } catch {
            console.log(`[${options.label}] Grounding redirect follow failed, dropping source: ${source.publisher}`);
            continue;
          }
        }

        // If URL is empty or otherwise unusable, skip this source.
        if (!resolvedUrl || !isUsableEvidenceUrl(resolvedUrl)) {
          continue;
        }

        let inspectionPromise = sourceInspectionCache.get(source.url);
        if (!inspectionPromise) {
          inspectionPromise = inspectSourceUrl(source.url);
          sourceInspectionCache.set(source.url, inspectionPromise);
        }
        const inspection = await inspectionPromise;

        // Use fetched URL if available, otherwise keep Gemini's provided URL.
        // The source already passed isSourceTrusted (trusted domain/publisher), so
        // we trust Gemini's attribution even if the article page was inaccessible
        // (Nigerian news sites often block bots with 403/429 responses).
        const finalUrl = (inspection.ok && isUsableEvidenceUrl(inspection.finalUrl))
          ? inspection.finalUrl
          : source.url;
        const effectiveTitle = inspection.finalTitle || source.title || "";

        // Apply the relevance check only when the URL was successfully fetched and we
        // have a real page title to compare. If the fetch failed, trust Gemini's
        // source attribution without the additional token-matching check.
        if (inspection.ok && !isSourceRelevantToAttack(attack, effectiveTitle, finalUrl)) continue;

        if (inspection.publishedAt && inspection.publishedAt < freshnessThreshold) continue;

        sources.push({
          ...source,
          url: finalUrl,
          title: effectiveTitle || source.title,
        });
        verifiedSources++;
        if (verifiedSources >= MAX_SOURCES_TO_VERIFY) break;
      }

      if (sources.length === 0) {
        console.log(`[${options.label}] Dropping attack with no usable evidence source: ${attack.title}`);
        return null;
      }

      return {
        ...attack,
        date: attackDate.toISOString(),
        sources,
      };
    }));

  return inspected.filter((attack): attack is RawAttackData => Boolean(attack));
}

// Reusable source tier description for prompts
const SOURCE_TIERS_PROMPT = `═══════════════════════════════════════════
SOURCE CREDIBILITY TIERS — STRICT RULES
═══════════════════════════════════════════

TIER 1 — PRIMARY INTELLIGENCE (search these FIRST):
- Twitter/X: @BrantPhilip_ (Brant Philip), @Sazedek (Sahara Reporters contributor)
- These accounts frequently break Nigerian security news before mainstream media

TIER 2 — TRUSTED & VERIFIED NEWS OUTLETS (reports MUST come from these):
Nigerian Media:
  Premium Times (premiumtimesng.com), The Cable (thecable.ng), Peoples Gazette (gazettengr.com), Channels TV (channelstv.com), Sahara Reporters (saharareporters.com), Punch Nigeria (punchng.com), Vanguard Nigeria (vanguardngr.com), Daily Trust (dailytrust.com), HumAngle (humanglemedia.com), The Guardian Nigeria (guardian.ng), Daily Post (dailypost.ng), News Central (newscentral.africa), Arise News (arise.tv), TVC News (tvcnews.tv), ThisDay (thisdaylive.com), The Nation (thenationonlineng.net), Leadership (leadership.ng), Sun News (sunnewsonline.com), Tribune Online (tribuneonlineng.com), Blueprint (blueprint.ng), Business Day (businessday.ng), The Whistler (thewhistler.ng), ICIR (icirnigeria.org), Ripples Nigeria (ripplesnigeria.com), Daily Nigerian (dailynigerian.com), PRNigeria (prnigeria.com), Parallel Facts News (parallelfactsnews.com), Pulse Nigeria (pulse.ng)

International Media:
  Al Jazeera (aljazeera.com), Deutsche Welle/DW (dw.com), Sky News (news.sky.com), BBC (bbc.com), CNN (cnn.com), France 24 (france24.com), Voice of America (voanews.com), Associated Press (apnews.com), AFP (france24.com/afp), Reuters (reuters.com)

Security Trackers:
  ACLED (acleddata.com), Zagazola Makama (network.zagazola.org), Nigeria Risk Index

Reference:
  Wikipedia (en.wikipedia.org)

TIER 3 — BANNED SOURCES (NEVER USE — reject any incident sourced ONLY from these):
  "Truth Nigeria", "Aid to the Church in Need", "ACN International", "The Journal", "Council on Foreign Relations", "cfr.org", "Trust TV", "ZENIT News", random YouTube channels, unknown blogs, unrecognizable news sites, aggregator sites that just copy-paste other articles, any source you are not confident is a real, established news organization.

⚠️ STRICT SOURCE ENFORCEMENT:
- Every incident MUST have at least one source from TIER 1 or TIER 2.
- If an incident is ONLY reported by a source NOT in Tier 1 or Tier 2, DO NOT include it.
- For the "publisher" field, use the EXACT name of the outlet (e.g., "Premium Times", "Channels TV", "BBC"). Do NOT invent or guess publisher names.
- If you cannot identify the publisher of a source URL, DO NOT include that source.`;

const OUTPUT_SCHEMA_PROMPT = `Return your response as a valid JSON array. Each element must follow this exact schema:
{
  "title": "string",
  "description": "string",
  "date": "ISO 8601 datetime string",
  "location": {
    "state": "string (EXACT canonical state name from the list above, e.g. 'Borno' not 'Borno State', 'FCT' not 'Federal Capital Territory')",
    "lga": "string or 'Unknown'",
    "town": "string or 'Unknown'"
  },
  "group": "string (standardized group name)",
  "casualties": {
    "killed": number or null,
    "injured": number or null,
    "kidnapped": number or null,
    "displaced": number or null
  },
  "civilianCasualties": true or false,
  "sources": [
    {
      "url": "string (direct URL to article or tweet)",
      "title": "string (article title or tweet excerpt)",
      "publisher": "string (EXACT outlet name from Tier 1 or Tier 2 list)"
    }
  ],
  "status": "confirmed" | "unconfirmed" | "developing",
  "tags": ["string"]
}

RESPOND ONLY WITH THE JSON ARRAY. No markdown, no explanation, no code fences.`;

/**
 * Use Gemini 2.5 Flash with Google Search grounding to find recent
 * terrorist attacks in Nigeria (general scan, past 4 days).
 */
export async function fetchRecentAttacks(): Promise<RawAttackData[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(today.getDate() - 4);

  const prompt = `You are an intelligence analyst specializing in security incidents in Nigeria.
The current date and time is ${today.toISOString()}.

YOUR PRIMARY MISSION: Search for ALL security incidents in Nigeria — terrorist attacks, insurgent attacks, bandit attacks, militant attacks, attacks by unknown gunmen, ambushes on military/police convoys, IED explosions on troops, attacks on army bases/barracks, soldiers killed in combat, kidnappings, communal clashes, and any incident where Nigerian security forces (army, police, DSS, vigilantes) or civilians came under attack or suffered casualties.

SEARCH STRATEGY — FOLLOW THIS ORDER:
1. FIRST: Search for any attacks that happened TODAY (${todayStr}). Search using both civilian and military-focused keywords:
   - "Nigeria attack today", "Nigeria soldiers killed today", "Nigeria military ambush today", "Nigeria army today"
   - Check headlines from Premium Times, Punch, Vanguard, Daily Trust, Channels TV, Sahara Reporters, Daily Post, The Cable, HumAngle, PRNigeria, and AP/Reuters for today.
   - Also check @BrantPhilip_ and @Sazedek on X (Twitter) for breaking reports.
2. SECOND: Search for attacks from YESTERDAY (${new Date(today.getTime() - 86400000).toISOString().split("T")[0]}) using same approach.
3. THIRD: Search for any remaining attacks from the past 4 days (${fourDaysAgo.toISOString().split("T")[0]} to ${todayStr}) that you haven't already found.

MILITARY ATTACK EMPHASIS: Nigerian army troops and officers are frequently targeted — always search explicitly for:
- "Nigerian soldiers killed", "troops killed Nigeria", "military convoy ambush Nigeria"
- "army officers killed Nigeria", "barracks attack Nigeria", "Operation Hadin Kai"
- "NAF airstrike" (after which ground forces may have casualties), "ISWAP ambush"

Do NOT stop after finding just 1 or 2 incidents. Be thorough — Nigeria typically has multiple security incidents per day across different states. Search multiple news sources independently to ensure comprehensive coverage.

${SOURCE_TIERS_PROMPT}

═══════════════════════════════════════════
DEDUPLICATION — CRITICAL
═══════════════════════════════════════════
- If multiple news outlets report the SAME incident (same attack, same location, same date), consolidate them into ONE entry with multiple sources.
- Do NOT create separate entries for the same attack just because different outlets covered it.
- Two reports are the SAME incident if they describe the same type of attack, in the same town/LGA, on the same date, even if casualty numbers differ slightly.
- When consolidating, use the HIGHEST reported casualty numbers and combine all source URLs.
- RESCUE/FOLLOW-UP ARTICLES: A military rescue announcement, security press release, or follow-up report that describes the outcome of a KNOWN attack (e.g. "troops rescue 50 kidnapped victims in Gwoza", "military confirms 416 abducted in Ngoshe attack") describes the SAME INCIDENT as the original attack. Consolidate it into the original incident entry — do NOT create a new entry. Use the ORIGINAL attack date (as stated in the article's narrative, e.g. "On March 3…"), not the article's publication date.
- PAST-WINDOW EVENTS: If an article describes an event that clearly happened BEFORE the current search window (e.g. "On March 3, gunmen attacked…" appearing in an April article), do NOT include it as a new incident — it was already captured in earlier tracking. Only include incidents whose attack date falls within the search window.

═══════════════════════════════════════════
DATA REQUIREMENTS
═══════════════════════════════════════════
For each incident found, provide:
1. A clear, concise title (format: "[Attack type] in [Town], [State]")
2. Detailed description of what happened. Where known, include the name and rank/title of any notable individuals (officers, politicians, community leaders) killed or kidnapped.
3. Exact date (ISO 8601 format, e.g., "2026-02-12T00:00:00.000Z"). If only the date is known, use midnight.
4. Location: Nigerian state name — use EXACTLY one of these canonical names:
   Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River,
   Delta, Ebonyi, Edo, Ekiti, Enugu, FCT, Gombe, Imo, Jigawa, Kaduna, Kano,
   Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo,
   Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara
   NEVER append "State" to the name (use "Borno" not "Borno State").
   Use "FCT" for Abuja/Federal Capital Territory.
   If an incident spans multiple states, use the state where the PRIMARY attack occurred.
   Also provide the Local Government Area (LGA) and specific town/village.
5. Armed group responsible. Use standardized names: "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN", "Herdsmen", "Cultists", "Unidentified Armed Group"
6. Casualties — VICTIMS ONLY (civilians + security forces):
   - "killed": soldiers, police, vigilantes, or civilians killed — NOT attackers/terrorists/bandits/insurgents
   - "injured": same rule — victims only
   - "kidnapped": number of people abducted
   - "displaced": number of people forced to flee
   - EXAMPLE: "5 terrorists neutralised, 2 soldiers killed, 3 civilians injured" → killed=2, injured=3
   - EXAMPLE: "troops kill 10 ISWAP fighters, no casualties on government side" → killed=null (no victims)
   - EXAMPLE: "bandits kill 4 farmers, injure 6, abduct 12" → killed=4, injured=6, kidnapped=12
   - Use null for any field that is not reported or unknown.
7. Source URLs — direct links to articles or tweets. Every URL must be real and working.
8. Status: "confirmed" (multiple reliable sources), "unconfirmed" (single source), "developing" (ongoing)
9. Tags (e.g., "boko-haram", "northeast", "kidnapping", "iswap", "banditry", "military-attack")

═══════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════
- ONLY include REAL, VERIFIED incidents. Do NOT fabricate or hallucinate any attacks.
- If you cannot find any recent attacks, return an empty array [].
- CASUALTY COUNTING: The "killed", "injured", "kidnapped", "displaced" fields track VICTIMS ONLY — civilians and security forces (soldiers, officers, police, vigilantes). NEVER include attacker/terrorist/bandit/insurgent fatalities in these counts. If a report says "10 insurgents killed, 3 soldiers killed" → killed=3. If a report says "troops kill 8 bandits, no government casualties" → killed=null.
- Include ALL attacks regardless of whether casualties are reported — a foiled attack, a raid, or a clash with unknown casualty numbers is still a valid security incident.
- Set "civilianCasualties" to TRUE whenever soldiers, army officers, police, vigilantes, or civilians were killed/injured/kidnapped/displaced — even if NO non-combatants were harmed. Military personnel ARE victim casualties. Set "civilianCasualties" to false ONLY when the ONLY reported deaths were attackers/insurgents themselves.
- Be specific about locations — always include state AND town/village name.
- Distinguish carefully between different armed groups.

${OUTPUT_SCHEMA_PROMPT}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let attacks: RawAttackData[] = JSON.parse(cleanedText);

    const groundingChunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
    attacks = resolveGroundingUrls(attacks, groundingChunks);

    const windowStart = new Date(fourDaysAgo);
    windowStart.setUTCHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);
    windowEnd.setUTCHours(23, 59, 59, 999);

    return validateAndNormalize(attacks, {
      windowStart,
      windowEnd,
      maxSourceAgeDays: 21,
      label: "Gemini Recent",
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Use Gemini 2.5 Flash with Google Search grounding to find security incidents
 * specifically in the given Nigerian states over the past `lookbackDays` days.
 * Designed for the per-state cron scan to catch incidents the general scan misses.
 */
export async function fetchAttacksForStates(
  states: string[],
  lookbackDays = 7,
): Promise<RawAttackData[]> {
  if (states.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

  const today = new Date();
  const lookbackDate = new Date(today);
  lookbackDate.setDate(today.getDate() - lookbackDays);
  const todayStr = today.toISOString().split("T")[0];
  const lookbackStr = lookbackDate.toISOString().split("T")[0];
  const year = today.getFullYear();

  const stateList = states.join(", ");
  const stateSearchLines = states
    .map(s => `  - "${s} attack ${year}" OR "${s} soldiers killed ${year}" OR "${s} military ambush ${year}" OR "${s} kidnapping ${year}" OR "${s} bandits ${year}" OR "${s} gunmen ${year}" OR "${s} army ${year}" OR "${s} security incident ${year}"`)
    .join("\n");

  const prompt = `You are an intelligence analyst specializing in security incidents in Nigeria.
Current date: ${today.toISOString()}
Search window: ${lookbackStr} to ${todayStr}

TARGET STATES: ${stateList}

YOUR MISSION: Find ALL security incidents — terrorist attacks, bandit attacks, kidnappings, communal clashes, militant activity, cult violence, IED explosions, attacks on military convoys/bases, soldiers/officers killed in ambushes, or attacks by unknown gunmen — that occurred in ONLY these specific Nigerian states between ${lookbackStr} and ${todayStr}.

MANDATORY SEARCH — execute a search for EACH state using BOTH civilian and military-focused keywords:
${stateSearchLines}

MILITARY PRIORITY: Attacks on Nigerian army troops, officers, and bases are as important as civilian attacks. Always search for "[State] soldiers killed", "[State] military ambush", "[State] army casualties", "[State] troops killed", "Operation Hadin Kai [State]" when scanning Northeast states.

IMPORTANT: Search each state individually and explicitly. Do NOT rely only on general Nigeria-wide searches — those miss incidents in lower-profile states. Even if a state appears quiet, verify by searching.

${SOURCE_TIERS_PROMPT}

═══════════════════════════════════════════
DEDUPLICATION
═══════════════════════════════════════════
- Consolidate multiple reports of the SAME incident into one entry with all source URLs combined.
- Use the HIGHEST reported casualty numbers when consolidating.
- RESCUE/FOLLOW-UP ARTICLES: A military rescue announcement or follow-up report describing the outcome of a KNOWN attack (e.g. "troops rescue 50 kidnapped victims", "military confirms attack casualties") is the SAME INCIDENT as the original attack. Consolidate into one entry using the ORIGINAL attack date from the article's narrative, not the article's publication date.
- PAST-WINDOW EVENTS: If an article describes an attack that clearly occurred BEFORE the current search window (e.g. a March attack described in an April press release), do NOT include it as a new incident — it has already been tracked. Only include incidents whose attack date falls within the ${lookbackStr}–${todayStr} search window.

═══════════════════════════════════════════
DATA REQUIREMENTS
═══════════════════════════════════════════
For each incident found, provide:
1. Title: "[Attack type] in [Town], [State]"
2. Detailed description. Where known, include the name and rank/title of any notable individuals (officers, politicians, community leaders) killed or kidnapped.
3. Date (ISO 8601). Use midnight if only date is known.
4. Location: use EXACTLY one of the 37 canonical Nigerian state names:
   Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River,
   Delta, Ebonyi, Edo, Ekiti, Enugu, FCT, Gombe, Imo, Jigawa, Kaduna, Kano,
   Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo,
   Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara
   NEVER append "State". Use "FCT" for Abuja.
5. Armed group: "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN", "Herdsmen", "Cultists", "Unidentified Armed Group"
6. Casualties — VICTIMS ONLY (civilians + security forces):
   - "killed": soldiers, police, vigilantes, or civilians killed — NOT attackers/terrorists/bandits
   - "injured": victims only — NOT attacker casualties
   - "kidnapped": number of people abducted
   - "displaced": number of people forced to flee
   - EXAMPLE: "12 bandits killed, 1 soldier killed, 2 farmers injured" → killed=1, injured=2
   - EXAMPLE: "troops neutralise 7 ISWAP, no friendly casualties" → killed=null, injured=null
   - Use null for any field not reported or unknown.
7. Source URLs (real, working links only)
8. Status: "confirmed" | "unconfirmed" | "developing"
9. Tags (include "military-attack" for incidents targeting soldiers/army)

"civilianCasualties" field: set to TRUE whenever soldiers, army officers, police, vigilantes, or civilians were killed/injured/kidnapped/displaced — even if NO non-combatants were harmed. Set to false ONLY when the ONLY reported deaths were attackers/insurgents themselves. Include ALL attacks even if casualties are unknown or zero — a foiled raid or patrol clash with no confirmed deaths is still a valid incident.

ONLY return incidents in the TARGET STATES listed above. Do not include incidents from other states.
Do NOT fabricate incidents. If none found for a state, simply omit it.

${OUTPUT_SCHEMA_PROMPT}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let attacks: RawAttackData[] = JSON.parse(cleanedText);

    const groundingChunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
    attacks = resolveGroundingUrls(attacks, groundingChunks);
    const windowStart = new Date(lookbackDate);
    windowStart.setUTCHours(0, 0, 0, 0);
    const windowEnd = new Date(today);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);
    windowEnd.setUTCHours(23, 59, 59, 999);

    attacks = await validateAndNormalize(attacks, {
      windowStart,
      windowEnd,
      maxSourceAgeDays: Math.max(21, lookbackDays + 14),
      label: `Gemini States/${stateList}`,
    });

    // Guard: only keep attacks that actually belong to the requested states
    const stateSet = new Set(states.map(s => s.toLowerCase()));
    return attacks.filter(a => stateSet.has(a.location.state.toLowerCase()));
  } catch (error) {
    throw error;
  }
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateOfId?: string; // ID of the existing report it duplicates
  betterReport: "candidate" | "existing"; // Which one should be kept
  reason: string;
}

/**
 * Check if a candidate attack reports the same incident as any existing attacks.
 * Returns decision on which report is better if a duplicate is found.
 */
export async function checkDuplicateAttack(
  candidate: any,
  existingAttacks: any[]
): Promise<DuplicateCheckResult> {
  if (!existingAttacks || existingAttacks.length === 0) {
    return { isDuplicate: false, betterReport: "candidate", reason: "No existing reports to compare against." };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Explicitly disable tools to ensure no external searching occurs
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    tools: []
  });

  const cleanSources = (sources: any[]) => sources?.map(s => ({
    publisher: s.publisher || "Unknown",
    title: s.title || "Unknown"
  })) || [];

  const prompt = `You are a security intelligence analyst specializing in deduplicating incident reports.
Compare the CANDIDATE report against ALL EXISTING reports below. Determine if the CANDIDATE describes the SAME real-world security incident as any existing report.

CRITICAL: Do NOT search the internet. Use ONLY the data provided below.

CANDIDATE REPORT:
${JSON.stringify({
  id: String(candidate._id),
  title: candidate.title,
  date: candidate.date,
  location: candidate.location,
  group: candidate.group,
  casualties: candidate.casualties,
  sources: cleanSources(candidate.sources),
  description: candidate.description
}, null, 2)}

EXISTING REPORTS:
${JSON.stringify(existingAttacks.map(a => ({
  id: String(a._id),
  title: a.title,
  date: a.date,
  location: a.location,
  group: a.group,
  casualties: a.casualties,
  sources: cleanSources(a.sources),
  description: a.description
})), null, 2)}

═══════════ MATCHING RULES ═══════════

Two reports describe the SAME INCIDENT if ALL of these are true:
1. LOCATION MATCH: Same state, AND same or similar town/LGA — OR one description explicitly references the other's location/town name even if the stored location fields differ (follow-up coverage is often filed under a different dateline than the original attack)
2. DATE MATCH: Same date OR within 3 days of each other (follow-up articles, military responses, and rescue operations are often filed 1–3 days after the original attack and reference the same casualties)
3. NATURE MATCH: Same basic type of attack (e.g., both are kidnappings, both are bombings, both involve gunmen attacking a village)

⚠️ KEY INSIGHT — FOLLOW-UP COVERAGE: A military operation, rescue mission, or security response article frequently describes the SAME incident as the original attack report but:
  - Uses the military base / operational area as its location instead of the attack village
  - Is dated when the response happened (1–3 days later) rather than the original attack date
  - Has a different title focused on the response rather than the attack
  If both descriptions mention the same casualty figures (especially kidnapping counts), the same villages/LGAs, or the same perpetrator group in the same state, treat them as the SAME INCIDENT.

Two reports are NOT the same incident if:
- They occurred in different states
- They occurred more than 5 days apart AND descriptions share no overlapping location keywords
- They describe fundamentally different types of events (e.g., kidnapping vs bombing)
- They are in the same state but clearly different towns/villages with no name overlap in either title or description

⚠️ IMPORTANT: When evidence is AMBIGUOUS, ERR ON THE SIDE OF MARKING AS DUPLICATE. It is much worse to have duplicate entries in the database than to miss a genuinely unique incident.

Examples:
- "Bandits kill 15 in Zamfara attack" AND "Gunmen attack Zamfara village, 12 dead" on the same date → SAME INCIDENT (different names for attackers, slight casualty variation)
- "Boko Haram attacks Maiduguri" AND "ISWAP militants hit Maiduguri" on the same date → SAME INCIDENT (group attribution often varies between sources)
- "Bandit attack in Kurfa, Zamfara — 150 kidnapped" AND "Military operation in Tsafe LGA, Zamfara — 150 still missing" 2 days later → SAME INCIDENT (same kidnap count, same state, response to the same original attack)
- "Attack in Kaduna" AND "Attack in Zamfara" on the same date → DIFFERENT INCIDENTS (different states)

IF DUPLICATE FOUND, compare quality:
- Prefer reports from reliable outlets over tweets
- Prefer reports with MORE SPECIFIC details
- Prefer HIGHER casualty counts (later reports are usually more accurate)
- If quality is roughly equal, prefer the existing report

RESPOND WITH JSON ONLY:
{
  "isDuplicate": boolean,
  "duplicateOfId": "string (ID of matching existing report, or null)",
  "betterReport": "candidate" | "existing",
  "reason": "string (brief explanation)"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error checking duplicates with Gemini:", error);
    // Default to assuming unique if AI fails, to be safe
    return { isDuplicate: false, betterReport: "candidate", reason: "AI check failed" };
  }
}

/**
 * Merge two incident reports (existing and new candidate).
 * Strategies:
 * - Casualties: Take the HIGHER number for each field.
 * - Sources: Combine unique sources.
 * - Description: Use AI to merge and update if new info is available.
 */
export async function mergeIncidentStrategies(
  existing: any,
  candidate: RawAttackData
): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

    // 1. Merge Casualties (Target: Max, preserve null when both sides are unknown)
    const mergeCount = (a: number | null | undefined, b: number | null | undefined): number | null => {
        if (a == null && b == null) return null;
        return Math.max(a ?? 0, b ?? 0);
    };
    const mergedCasualties = {
        killed: mergeCount(existing.casualties?.killed, candidate.casualties?.killed),
        injured: mergeCount(existing.casualties?.injured, candidate.casualties?.injured),
        kidnapped: mergeCount(existing.casualties?.kidnapped, candidate.casualties?.kidnapped),
        displaced: mergeCount(existing.casualties?.displaced, candidate.casualties?.displaced),
    };

    // 2. Merge Sources (Unique by URL)
    const sourceMap = new Map();
    [...(existing.sources || []), ...(candidate.sources || [])].forEach((s) => {
        // Normalize URL to prevent slight variations (remove trailing slash)
        const normalizedUrl = s.url.trim().replace(/\/$/, "");
        if (!sourceMap.has(normalizedUrl)) {
            sourceMap.set(normalizedUrl, s);
        }
    });
    const mergedSources = Array.from(sourceMap.values());

    // 3. Merge Description via AI
    let mergedDescription = existing.description;
    try {
        const prompt = `You are an intelligence analyst. Consolidate these two reports of the SAME incident into a single, comprehensive description.

    EXISTING REPORT:
    "${existing.description}"

    NEW REPORT (may have new details):
    "${candidate.description}"

    INSTRUCTIONS:
    - Combine details from both.
    - If the new report has more specific info (exact numbers, names, locations), use it.
    - Keep the tone objective and serious.
    - Result should be a single paragraph.
    - When mentioning casualties, refer only to victims (civilians and security forces). Attacker/insurgent/terrorist deaths may be mentioned in the narrative but must NOT be presented as victim casualties.
    - Return ONLY the merged description text.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text && text.length > 50) {
            mergedDescription = text;
        }
    } catch (e) {
        console.error("Failed to merge descriptions with AI, keeping existing.", e);
    }

    // Return the updated object fields
    return {
        description: mergedDescription,
        casualties: mergedCasualties,
        sources: mergedSources,
        // If status was unconfirmed but new report is confirmed, upgrade it
        status: candidate.status === "confirmed" ? "confirmed" : existing.status,
    };
}
