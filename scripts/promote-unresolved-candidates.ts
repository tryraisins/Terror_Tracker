import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { mergeCasualtyAssessments, normalizeCasualtyFields, type CasualtyMetadata, type CasualtyValues, type LocationPrecision } from "../src/lib/incident-uncertainty";
import { normalizeStateName } from "../src/lib/normalize-state";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

type Disposition =
  | "READY_INSERT"
  | "READY_UPDATE"
  | "READY_MERGE"
  | "SKIP_DUPLICATE"
  | "BLOCKED"
  | "UNRESOLVED";

type Candidate = {
  _id: mongoose.Types.ObjectId;
  candidateHash: string;
  auditRunId: string;
  headline: string;
  description: string;
  incidentType: "abduction" | "armed_attack" | "IED" | "communal_violence" | "other";
  eventDate: Date | null;
  datePrecision: "exact_day" | "date_range" | "month_only" | "unknown";
  dateRange?: { start?: Date | null; end?: Date | null };
  location: { state: string; lga?: string | null; town?: string | null };
  locationPrecision: "exact_lga_or_town" | LocationPrecision | "state_only";
  group?: string | null;
  casualties?: Partial<CasualtyValues> | null;
  casualtyMeta?: CasualtyMetadata | null;
  sources: SourceRef[];
  reasonCodes?: string[];
  requiredNextEvidence?: string;
  reviewStatus: string;
};

type SourceRef = {
  url: string;
  title: string;
  publisher: string;
  publishedAt?: Date | string | null;
  sourceType?: SourceClassification;
};

type SourceClassification =
  | "official"
  | "trusted_media"
  | "trusted_media_security"
  | "osint_research"
  | "osint_social"
  | "structured_dataset";

type AttackDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  location?: { state?: string; lga?: string; town?: string; precision?: LocationPrecision; notes?: string };
  group?: string;
  casualties?: Partial<CasualtyValues>;
  casualtyMeta?: CasualtyMetadata;
  sources?: SourceRef[];
  status?: string;
  hash?: string;
  _deleted?: boolean;
};

type EvidenceCheck = {
  url: string;
  status: "PASS" | "PARTIAL" | "FAIL" | "BLOCKED";
  sourceType: SourceClassification | "unknown";
  domain: string | null;
  httpStatus?: number;
  finalUrl?: string;
  reason: string;
  matchedTerms: string[];
  textSample?: string;
};

type PromotionPlan = {
  candidateHash: string;
  candidateId: string;
  disposition: Disposition;
  reasons: string[];
  sourceChecks: EvidenceCheck[];
  attack?: PlannedAttack;
  targetAttackId?: string;
  targetAttackTitle?: string;
  duplicateScore?: number;
  casualtyDelta?: Partial<Record<keyof CasualtyValues, { before: number | null; after: number | null }>>;
};

type PlannedAttack = {
  title: string;
  description: string;
  date: string;
  location: { state: string; lga: string; town: string; precision: LocationPrecision; notes: string };
  group: string;
  casualties: CasualtyValues;
  casualtyMeta: CasualtyMetadata;
  sources: SourceRef[];
  status: "confirmed" | "unconfirmed" | "developing";
  tags: string[];
  hash: string;
};

type Manifest = {
  runId: string;
  generatedAt: string;
  mode: "dry-run";
  scope: {
    start: string;
    endInclusive: string;
    timezone: "Africa/Lagos";
    country: "Nigeria";
  };
  sourcePolicy: string[];
  databaseBefore: DatabaseSummary;
  summary: ManifestSummary;
  plans: PromotionPlan[];
};

type ManifestSummary = {
  totalCandidates: number;
  dispositions: Record<Disposition, number>;
  blockedReasons: Record<string, number>;
  sourceAccessByDomain: Record<string, Record<EvidenceCheck["status"], number>>;
  sourceTypes: Record<SourceClassification | "unknown", number>;
  plannedInserts: number;
  plannedUpdates: number;
  plannedMerges: number;
  skippedDuplicates: number;
  unresolved: number;
  casualtyDelta: CasualtyValues;
};

type DatabaseSummary = {
  attacks: { total: number; active: number; softDeleted: number; missingDeletedFlag: number };
  credibleUnresolvedIncidents: { total: number; open: number; resolvedToAttack: number; rejected: number; mergedReference: number };
  incidentCrosswalkEvidence: { total: number; matchedAttack: number; matchedUnresolved: number };
  sourceArticles: { total: number; published: number; merged: number; reference: number; rejected: number };
};

const RUN_PREFIX = "promote-unresolved";
const OUTPUT_ROOT = path.join(process.cwd(), "audit-2026", "promote-unresolved");
const USER_AGENT = "NigeriaAttackTracker/1.0 (+unresolved-promotion)";
const CASUALTY_FIELDS = ["killed", "injured", "kidnapped", "displaced"] as const;
const DATE_WINDOW_MS = 48 * 60 * 60 * 1000;
const DEFAULT_START = "2026-01-01";
const DEFAULT_END = "2026-09-01";

const args = new Set(process.argv.slice(2));
const argValue = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

function nowRunId() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${RUN_PREFIX}-${stamp}`;
}

function sha256(value: unknown) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
}

function clean(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim();
}

function shortText(value: unknown, limit: number) {
  return clean(value).slice(0, limit);
}

function normalizeUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    if ((parsed.protocol === "http:" && parsed.port === "80") || (parsed.protocol === "https:" && parsed.port === "443")) parsed.port = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function domainFromUrl(value: unknown): string | null {
  const url = normalizeUrl(value);
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function lagosDayStart(value: string) {
  return new Date(`${value}T00:00:00.000+01:00`);
}

function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function scopeFilter(startDay: string, endDayInclusive: string) {
  const start = lagosDayStart(startDay);
  const endExclusive = addUtcDays(lagosDayStart(endDayInclusive), 1);
  return { start, endExclusive };
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function candidateInScope(candidate: Candidate, start: Date, endExclusive: Date): boolean {
  const eventDate = toDate(candidate.eventDate);
  if (!eventDate) return true;
  if (eventDate >= start && eventDate < endExclusive) return true;
  const rangeStart = toDate(candidate.dateRange?.start);
  const rangeEnd = toDate(candidate.dateRange?.end);
  return Boolean(rangeStart && rangeEnd && rangeStart < endExclusive && rangeEnd >= start);
}

function sourceClassification(source: SourceRef): SourceClassification | "unknown" {
  if (source.sourceType) return source.sourceType;
  const text = `${source.publisher} ${source.title} ${source.url}`.toLowerCase();
  if (/\b(police|army|defence|defense|air force|naf|dss|nscdc|government|gov\.ng)\b/.test(text)) return "official";
  if (/\b(humangle|zagazola|prnigeria|icir|security)\b/.test(text)) return "trusted_media_security";
  if (/\b(brantphilip|brant philip|x\.com|twitter\.com)\b/.test(text)) return "osint_social";
  if (/\b(acled|wanep|dataset)\b/.test(text)) return "structured_dataset";
  return "trusted_media";
}

function dateKey(value: Date | string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function dayStart(value: Date | string) {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function titleTokens(value: string) {
  const stop = new Set(["the", "and", "with", "over", "from", "after", "again", "fresh", "update", "nigeria", "nigerian", "state"]);
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !stop.has(token));
}

function jaccard(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const aa = new Set(a);
  const bb = new Set(b);
  let intersection = 0;
  for (const token of aa) if (bb.has(token)) intersection += 1;
  return intersection / (aa.size + bb.size - intersection);
}

function directUrlStatus(source: SourceRef) {
  const normalized = normalizeUrl(source.url);
  if (!normalized) return { ok: false, reason: "MISSING_OR_INVALID_URL" };
  const host = new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
  if (/google\.|bing\.|duckduckgo\.|yahoo\.|search\.brave\.|news\.google\.|facebook\.|x\.com$|twitter\.|t\.co$/.test(host)) {
    return { ok: false, reason: "LEAD_OR_SEARCH_RESULT_URL" };
  }
  if (!["official", "trusted_media", "trusted_media_security", "structured_dataset"].includes(sourceClassification(source))) {
    return { ok: false, reason: "UNSUPPORTED_SOURCE_TYPE" };
  }
  return { ok: true, reason: "DIRECT_SOURCE" };
}

function looksLikeNonProductionIncident(candidate: Candidate) {
  const text = `${candidate.headline} ${candidate.description}`.toLowerCase();
  const reasons: string[] = [];
  const noVictimImpact = CASUALTY_FIELDS.every((field) => candidate.casualties?.[field] == null || candidate.casualties?.[field] === 0);

  if (candidate.incidentType === "other") reasons.push("NON_ATTACK_INCIDENT_TYPE");
  if (/\b(strike|lawsuit|threaten(?:ed)? lawsuit|condemn|seeks stronger cooperation|seasonal clashes|awareness|summit|demands? action|dangerous signal|must not become|obsession with|tackling kidnapping|embedded in society|the shame of a country|governor'?s action|unique style|branch seeks|casts? shadow|mother wants officers killed|demands urgent rescue|amnesty demands rescue|orders security forces|hunt for hundreds|shuts? .*market)\b/.test(text)) {
    reasons.push("FOLLOW_UP_OR_NON_ATTACK_STORY");
  }
  if (/\b(customs seizes|contraband|drug(?:s)? contraband|efcc raid|fraud|cybercrime|shooting exercise|illegal mining activities|police brutality|armed robbery attack|hostel attack by army personnel|soldiers allegedly attack|military clash|car(?:t)? away car|robbery by newly recruited army|murdered at her residence|student dies after armed robbery)\b/.test(text)) {
    reasons.push("LAW_ENFORCEMENT_OR_NON_TERROR_STORY");
  }
  if (/\b(false alarm|dismiss(?:es|ed)? (?:false )?(?:alarm|report|reports|rumou?r|claim|claims|fears)|dismisses kidnapping fears|triggers alarm|no (?:student|students|terrorists?|terrorist|kidnapping|attack|kidnapped)|not an assassination attempt|refut(?:e|es|ed)|clarif(?:y|ies|ied)|dispels rumou?r|speaks on report|planned attack|purported terrorist attack|old video|relocation of abducted|inoperative|confirms death of .*student)\b/.test(text)) {
    reasons.push("DENIAL_FALSE_ALARM_OR_UNVERIFIED_THREAT");
  }
  if (/\b(charges? on .*kidnap suspects?|sentences?|death sentence|survivors still|laid to rest|list of kidnapped|parents detail|inside nigeria's growing kidnapping crisis|report:|records highest|announces rescue|frees \d+|rescue(?:s|d)? kidnapped|released?|nab(?:s|bed)? .*suspects?|arrest(?:s|ed)? .*suspects?|captives face forced marriage|execution threat|ransom to free|demand .*ransom to free|displaced persons in fresh .*attack)\b/.test(text)) {
    reasons.push("FOLLOW_UP_WITHOUT_ORIGINAL_EVENT_GRAIN");
  }
  if (/\b(cattle|livestock|rustle livestock|stolen cattle)\b/.test(text) && !/\b(kill(?:ed|s)?|injur(?:ed|es)?|abduct(?:ed|s)?|kidnap(?:ped|s)?)\s+(?:people|persons|residents|farmers|travellers|travelers|students|women|children|soldiers|policemen|officers|vigilantes|worshippers|passengers)\b/.test(text)) {
    reasons.push("ANIMAL_OR_PROPERTY_ONLY_HARM");
  }
  if (/\b(npfl opener|shooting stars beat|inter lagos)\b/.test(text)) {
    reasons.push("SPORTS_OR_NON_SECURITY_STORY");
  }
  if (/\b(niamey|presidential palace|attempted coup|niger authorities tok)\b/.test(text)) {
    reasons.push("NOT_NIGERIA_INCIDENT");
  }
  if (/\b(pdp|apc|app|ypp|inec|nurtw|nuj|adc member|governor's aide|political thugs|party chairman|secretariat|billboards?|pvcs?)\b/.test(text) && !/\b(kill(?:ed|s)?|injur(?:ed|es)?|abduct(?:ed|s)?|kidnap(?:ped|s)?)\s+(?:people|persons|residents|farmers|travellers|travelers|students|women|children|soldiers|policemen|officers|vigilantes|worshippers|passengers)\b/.test(text)) {
    reasons.push("POLITICAL_OR_CIVIL_VIOLENCE_OUTSIDE_TERROR_SCOPE");
  }
  if (/\b(how (?:my|kano)|escaped mob attack|mother wants officers killed|cultist.*killed|cult clash|bomb makers killed|iswap bomb makers killed|vigilantes kill brother of notorious bandit|bandits killed after|several bandits feared killed|several bandits feared dead|police repel kidnap attempt|troops foil attack|kill kidnap kingpin|brother of notorious bandit leader)\b/.test(text)) {
    reasons.push("ATTACKER_FOLLOW_UP_OR_CIVIL_CRIME_STORY");
  }
  if (/\b(arrest(?:s|ed)?|parade(?:s|d)?|raid(?:s|ed)? kidnappers'? camp|recover(?:s|ed)? (?:arms|stolen cattle|weapon|weapons))\b/.test(text) && noVictimImpact) {
    reasons.push("SECURITY_OPERATION_WITHOUT_REPORTED_VICTIM_IMPACT");
  }
  if (/\b(foil(?:s|ed)?|repel(?:s|led)?|neutralis(?:e|ed|es|ing)|neutraliz(?:e|ed|es|ing)|eliminat(?:e|ed|es|ing))\b/.test(text) && noVictimImpact) {
    reasons.push("FOILED_OR_ATTACKER_ONLY_OPERATION");
  }
  return [...new Set(reasons)];
}

function hasEventSpecificAttackSignal(candidate: Candidate) {
  const text = `${candidate.headline} ${candidate.description} ${candidate.sources.map((source) => source.title).join(" ")}`.toLowerCase();
  const actor = /\b(bandits?|terrorists?|gunmen|herdsmen|militia|iswap|boko haram|insurgents?|kidnappers?|cultists?|hoodlums|armed men|suspected fulani militants|unknown assailants?)\b/.test(text);
  const action = /\b(kill(?:ed|s)?|dead|slain|injur(?:e|ed|es)|abduct(?:ed|s)?|kidnap(?:ped|s)?|ambush(?:ed|es)?|attack(?:ed|s)?|invad(?:e|ed|es)|raid(?:ed|s)?|hostage|ied|bomb|explosion|machete attack|set ablaze|flee as)\b/.test(text);
  const victimSignal = /\b(civilians?|residents?|farmers?|travellers?|travelers?|passengers?|worshippers?|students?|women|girls|children|soldiers?|policemen|officers?|vigilantes?|hunters?|pastor|seminarian|headmaster|lecturer|mother|child|toddler|communities?|village|school|church|mosque|market|road|highway)\b/.test(text);
  return (actor && action) || (action && victimSignal);
}

function attackerCasualtyRisk(candidate: Candidate) {
  const text = `${candidate.headline} ${candidate.description}`.toLowerCase();
  const killed = candidate.casualties?.killed ?? null;
  if (killed == null || killed === 0) return false;
  return /\b(troops|army|military|police|air force|naf|operation|airstrike|bombs?|neutralis(?:e|ed|es)|neutraliz(?:e|ed|es)|eliminat(?:e|ed|es)|kill(?:ed|s)? \d+ (?:terrorists?|bandits?|insurgents?|fighters?|kidnappers?))\b/.test(text)
    && !/\b(civilians?|residents?|farmers?|travellers?|travelers?|worshippers?|students?|women|children|soldiers?|policemen|officers?|vigilantes?|hunters?)\b.{0,40}\b(killed|dead|injured|abducted|kidnapped)\b/.test(text);
}

function candidateTerms(candidate: Candidate) {
  return [
    ...titleTokens(candidate.headline).slice(0, 8),
    clean(candidate.location.state).toLowerCase(),
    clean(candidate.location.lga).toLowerCase(),
    clean(candidate.location.town).toLowerCase(),
  ].filter((term) => term && term !== "unknown");
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<{ status: number; finalUrl: string; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
      },
    });
    const text = await response.text();
    return { status: response.status, finalUrl: response.url, text: text.slice(0, 250000) };
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function checkSource(candidate: Candidate, source: SourceRef, timeoutMs: number): Promise<EvidenceCheck> {
  const direct = directUrlStatus(source);
  const url = normalizeUrl(source.url) || clean(source.url);
  const sourceType = sourceClassification(source);
  const domain = domainFromUrl(url);
  if (!direct.ok) {
    return { url, status: "BLOCKED", sourceType, domain, reason: direct.reason, matchedTerms: [] };
  }

  const terms = candidateTerms(candidate);
  const metadataText = `${source.title} ${source.publisher} ${candidate.headline}`;
  const metadataMatches = terms.filter((term) => metadataText.toLowerCase().includes(term)).slice(0, 8);

  try {
    const fetched = await fetchWithTimeout(url, timeoutMs);
    const pageText = stripHtml(fetched.text);
    const lower = pageText.toLowerCase();
    const matchedTerms = terms.filter((term) => lower.includes(term)).slice(0, 12);
    const eventDate = candidate.eventDate ? dateKey(candidate.eventDate) : "";
    const hasDateHint = !eventDate || lower.includes(eventDate.slice(0, 4)) || lower.includes(String(new Date(eventDate).getUTCDate()));
    const status = fetched.status >= 200 && fetched.status < 400 && matchedTerms.length >= Math.min(3, terms.length) && hasDateHint ? "PASS" : "PARTIAL";
    return {
      url,
      status,
      sourceType,
      domain,
      httpStatus: fetched.status,
      finalUrl: fetched.finalUrl,
      reason: status === "PASS" ? "DIRECT_SOURCE_FETCHED_AND_MATCHED" : "DIRECT_SOURCE_FETCHED_PARTIAL_MATCH",
      matchedTerms: matchedTerms.length ? matchedTerms : metadataMatches,
      textSample: shortText(pageText, 500),
    };
  } catch (error) {
    return {
      url,
      status: metadataMatches.length >= Math.min(3, terms.length) ? "PARTIAL" : "FAIL",
      sourceType,
      domain,
      reason: `FETCH_FAILED_METADATA_${metadataMatches.length ? "MATCHED" : "WEAK"}:${error instanceof Error ? error.name : "UNKNOWN"}`,
      matchedTerms: metadataMatches,
    };
  }
}

async function mapConcurrent<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const output: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = index++;
      output[current] = await worker(items[current]);
    }
  });
  await Promise.all(workers);
  return output;
}

function normalizeLocationPrecision(value: Candidate["locationPrecision"]): LocationPrecision {
  if (value === "exact_lga_or_town") return "exact";
  if (value === "state_only") return "approximate_state";
  return value;
}

function precisionRank(value?: string) {
  switch (value) {
    case "exact": return 4;
    case "surrounding_area": return 3;
    case "approximate_lga": return 2;
    case "approximate_state": return 1;
    default: return 0;
  }
}

function buildLocationNotes(candidate: Candidate, precision: LocationPrecision) {
  const base = clean(candidate.requiredNextEvidence);
  if (precision === "exact") return "";
  const place = [
    clean(candidate.location.town) && clean(candidate.location.town) !== "Unknown" ? clean(candidate.location.town) : "",
    clean(candidate.location.lga) && clean(candidate.location.lga) !== "Unknown" ? `${clean(candidate.location.lga)} LGA` : "",
    clean(candidate.location.state),
  ].filter(Boolean).join(", ");
  const note = `Promoted with ${precision} precision from unresolved evidence; source supports ${place || "state-level location"} but not a more precise public location.`;
  return shortText(base ? `${note} ${base}` : note, 500);
}

function cleanSources(sources: SourceRef[]) {
  const seen = new Set<string>();
  const cleaned: SourceRef[] = [];
  for (const source of sources) {
    const url = normalizeUrl(source.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    cleaned.push({
      url,
      title: shortText(source.title, 500) || "Direct incident source",
      publisher: shortText(source.publisher, 200) || "Unknown publisher",
    });
  }
  return cleaned;
}

function parseNumberWord(value: string): number | null {
  const normalized = value.toLowerCase();
  if (/^\d+$/.test(normalized)) return Number(normalized);
  const words: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  };
  return words[normalized] ?? null;
}

function casualtyFromText(field: keyof CasualtyValues, text: string) {
  const lower = text.toLowerCase();
  const num = "(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)";
  if (field === "killed") {
    const compound = lower.match(new RegExp(`\\b${num}\\s+(?:soldiers?|policemen|officers?|vigilantes?|people|persons|residents|farmers),?\\s+${num}\\s+(?:soldiers?|policemen|officers?|vigilantes?|people|persons|residents|farmers)\\s+(?:were\\s+)?(?:killed|dead|slain)\\b`));
    if (compound) {
      const first = parseNumberWord(compound[1]);
      const second = parseNumberWord(compound[2]);
      if (first != null && second != null) return first + second;
    }
  }
  const patterns: Record<keyof CasualtyValues, RegExp[]> = {
    killed: [
      new RegExp(`\\b(?:at least\\s+)?${num}\\s+(?:people\\s+|persons\\s+|residents\\s+|farmers\\s+|travellers\\s+|travelers\\s+|soldiers\\s+|policemen\\s+|officers\\s+|vigilantes\\s+|worshippers\\s+)?(?:were\\s+)?(?:killed|dead|slain)\\b`),
      new RegExp(`\\b(?:kill(?:ed|s)?|slay(?:s|ed)?)\\s+(?:at least\\s+)?${num}\\b`),
    ],
    injured: [
      new RegExp(`\\b${num}\\s+(?:people\\s+|persons\\s+|residents\\s+|farmers\\s+|travellers\\s+|travelers\\s+|soldiers\\s+|policemen\\s+|officers\\s+|vigilantes\\s+)?(?:were\\s+)?injured\\b`),
      new RegExp(`\\binjur(?:e|ed|es)\\s+${num}\\b`),
    ],
    kidnapped: [
      new RegExp(`\\b(?:kidnap(?:ped|s)?|abduct(?:ed|s)?)\\s+${num}\\b`),
      new RegExp(`\\b${num}\\s+(?:people\\s+|persons\\s+|residents\\s+|students\\s+|women\\s+|girls\\s+|children\\s+|travellers\\s+|travelers\\s+)?(?:were\\s+)?(?:kidnapped|abducted)\\b`),
    ],
    displaced: [
      new RegExp(`\\b${num}\\s+(?:people\\s+|persons\\s+|residents\\s+|families\\s+)?(?:were\\s+)?displaced\\b`),
      new RegExp(`\\bdisplac(?:e|ed|es)\\s+${num}\\b`),
    ],
  };
  for (const pattern of patterns[field]) {
    const match = lower.match(pattern);
    if (!match) continue;
    const captured = match[1] ?? match[2];
    const parsed = parseNumberWord(captured);
    if (parsed != null) return parsed;
  }
  return null;
}

function casualtyFieldSignal(field: keyof CasualtyValues, text: string) {
  const lower = text.toLowerCase();
  const signals: Record<keyof CasualtyValues, RegExp> = {
    killed: /\b(kill(?:ed|s)?|dead|death|deaths|slain|massacre|beheaded|murdered|fatal|feared dead)\b/,
    injured: /\b(injur(?:ed|e|es|ies)|wounded|hospitali[sz]ed)\b/,
    kidnapped: /\b(kidnap(?:ped|s|ping)?|abduct(?:ed|s|ion)?|hostage|missing|captives?)\b/,
    displaced: /\b(displaced|flee|fled|sack(?:ed)?|burn(?:ed|t)? houses|raze(?:d)?)\b/,
  };
  return signals[field].test(lower);
}

function sourceSupportedCasualtyInputs(candidate: Candidate, text: string) {
  const casualties = { ...(candidate.casualties || {}) } as Partial<CasualtyValues>;
  const casualtyMeta = { ...(candidate.casualtyMeta || {}) } as CasualtyMetadata;
  for (const field of CASUALTY_FIELDS) {
    const value = casualties[field];
    if (value == null || value === 0) continue;
    const meta = casualtyMeta[field];
    const evidenceText = `${text} ${meta?.sourceText || ""} ${meta?.note || ""}`;
    if (casualtyFieldSignal(field, evidenceText)) continue;
    casualties[field] = null;
    casualtyMeta[field] = {
      precision: "unknown",
      note: "Candidate casualty value was not counted because the reviewed direct source metadata did not support this victim-impact field.",
    };
  }
  return { casualties, casualtyMeta };
}

function buildCasualties(candidate: Candidate) {
  const text = `${candidate.headline} ${candidate.sources.map((s) => s.title).join(" ")}`;
  const supportedInputs = sourceSupportedCasualtyInputs(candidate, text);
  const fromCandidate = normalizeCasualtyFields(supportedInputs.casualties, supportedInputs.casualtyMeta);
  const casualties: CasualtyValues = { ...fromCandidate.casualties };
  const casualtyMeta: CasualtyMetadata = { ...fromCandidate.casualtyMeta };

  for (const field of CASUALTY_FIELDS) {
    const parsed = casualtyFromText(field, text);
    if (parsed == null) continue;
    const current = casualties[field];
    const currentMeta = casualtyMeta[field];
    const parsedMeta = {
      precision: /\bat least|feared|scores|many\b/i.test(text) ? "estimate" as const : "exact" as const,
      min: parsed,
      max: /\bat least|feared|scores|many\b/i.test(text) ? null : parsed,
      estimate: parsed,
      sourceText: shortText(candidate.headline, 300),
      note: "Deterministically parsed from direct source headline/title during unresolved promotion review.",
    };
    if (current != null && current !== parsed && !/Candidate extractor value retained/i.test(currentMeta?.note || "")) {
      const min = Math.min(current, parsed);
      const max = Math.max(current, parsed);
      casualties[field] = Math.round((min + max) / 2);
      casualtyMeta[field] = {
        precision: "range",
        min,
        max,
        estimate: casualties[field],
        sourceText: shortText(candidate.headline, 300),
        note: "Conflicting candidate and direct source title counts are preserved as a range.",
      };
      continue;
    }
    if (current != null && current !== parsed && /Candidate extractor value retained/i.test(currentMeta?.note || "")) {
      casualties[field] = parsed;
      casualtyMeta[field] = parsedMeta;
      continue;
    }
    if (current != null) continue;
    casualties[field] = parsed;
    casualtyMeta[field] = parsedMeta;
  }

  for (const field of CASUALTY_FIELDS) {
    if (!casualtyMeta[field]) {
      casualtyMeta[field] = {
        precision: casualties[field] === 0 ? "not_reported" : casualties[field] == null ? "unknown" : "exact",
        min: casualties[field] ?? null,
        max: casualties[field] ?? null,
        estimate: casualties[field] ?? null,
      };
    }
  }

  return normalizeCasualtyFields(casualties, casualtyMeta);
}

function buildPlannedAttack(candidate: Candidate): PlannedAttack {
  const precision = normalizeLocationPrecision(candidate.locationPrecision);
  const impact = buildCasualties(candidate);
  const date = candidate.eventDate ? dayStart(candidate.eventDate).toISOString() : "";
  const state = normalizeStateName(candidate.location.state);
  const lga = clean(candidate.location.lga, "Unknown") || "Unknown";
  const town = clean(candidate.location.town, "Unknown") || "Unknown";
  const sourceUrls = cleanSources(candidate.sources).map((source) => source.url).sort();
  const hash = sha256({ date: dateKey(date), state, lga: lga.toLowerCase(), town: town.toLowerCase(), precision, headline: candidate.headline.toLowerCase(), sourceUrls });
  return {
    title: shortText(candidate.headline, 500),
    description: shortText(candidate.description || candidate.headline, 5000),
    date,
    location: {
      state,
      lga,
      town,
      precision,
      notes: buildLocationNotes(candidate, precision),
    },
    group: shortText(candidate.group, 200) || "Unknown",
    casualties: impact.casualties,
    casualtyMeta: impact.casualtyMeta,
    sources: cleanSources(candidate.sources),
    status: "unconfirmed",
    tags: ["promoted-unresolved", `candidate:${candidate.candidateHash}`, `incident-type:${candidate.incidentType}`],
    hash,
  };
}

function sourceOverlap(a: SourceRef[] = [], b: SourceRef[] = []) {
  const aa = new Set(a.map((s) => normalizeUrl(s.url)).filter(Boolean));
  return b.some((s) => aa.has(normalizeUrl(s.url)));
}

function duplicateScore(candidate: Candidate, planned: PlannedAttack, attack: AttackDoc) {
  const attackDate = attack.date ? dayStart(attack.date).getTime() : 0;
  const candidateDate = dayStart(planned.date).getTime();
  if (!attackDate || Math.abs(attackDate - candidateDate) > DATE_WINDOW_MS) return 0;
  const attackState = normalizeStateName(attack.location?.state || "");
  if (attackState !== planned.location.state) return 0;
  if (sourceOverlap(attack.sources, planned.sources)) return 1;

  let score = 0.35;
  const location = attack.location || {};
  const sameTown = clean(location.town).toLowerCase() !== "unknown" && clean(location.town).toLowerCase() === planned.location.town.toLowerCase();
  const sameLga = clean(location.lga).toLowerCase() !== "unknown" && clean(location.lga).toLowerCase() === planned.location.lga.toLowerCase();
  if (sameTown) score += 0.25;
  else if (sameLga) score += 0.18;

  const tokenScore = jaccard(titleTokens(candidate.headline), titleTokens(attack.title || ""));
  score += tokenScore * 0.4;

  const killedA = attack.casualties?.killed ?? null;
  const kidnappedA = attack.casualties?.kidnapped ?? null;
  if (killedA != null && planned.casualties.killed != null && killedA === planned.casualties.killed) score += 0.08;
  if (kidnappedA != null && planned.casualties.kidnapped != null && kidnappedA === planned.casualties.kidnapped) score += 0.08;

  return Math.min(1, score);
}

function casualtyDelta(before: Partial<CasualtyValues> | undefined, after: CasualtyValues) {
  const delta: PromotionPlan["casualtyDelta"] = {};
  for (const field of CASUALTY_FIELDS) {
    const oldValue = before?.[field] ?? null;
    const newValue = after[field] ?? null;
    if (oldValue !== newValue) delta[field] = { before: oldValue, after: newValue };
  }
  return delta;
}

function mergeAttackPlan(existing: AttackDoc, planned: PlannedAttack): { merged: PlannedAttack; changed: boolean } {
  const mergedImpact = mergeCasualtyAssessments(existing.casualties, existing.casualtyMeta, planned.casualties, planned.casualtyMeta);
  const mergedSources = cleanSources([...(existing.sources || []), ...planned.sources]);
  const existingPrecision = existing.location?.precision || "unknown";
  const useIncomingLocation = precisionRank(planned.location.precision) > precisionRank(existingPrecision);
  const merged: PlannedAttack = {
    ...planned,
    title: existing.title || planned.title,
    description: existing.description || planned.description,
    location: useIncomingLocation ? planned.location : {
      state: normalizeStateName(existing.location?.state || planned.location.state),
      lga: existing.location?.lga || planned.location.lga,
      town: existing.location?.town || planned.location.town,
      precision: (existing.location?.precision as LocationPrecision) || planned.location.precision,
      notes: existing.location?.notes || planned.location.notes,
    },
    casualties: mergedImpact.casualties,
    casualtyMeta: mergedImpact.casualtyMeta,
    sources: mergedSources,
    status: mergedImpact.hasConflict ? "developing" : (existing.status === "confirmed" ? "confirmed" : "unconfirmed"),
    tags: Array.from(new Set([...(Array.isArray((existing as any).tags) ? (existing as any).tags : []), ...planned.tags])),
    hash: existing.hash || planned.hash,
  };

  const changed = stableStringify({
    location: merged.location,
    casualties: merged.casualties,
    casualtyMeta: merged.casualtyMeta,
    sources: merged.sources,
    tags: merged.tags,
    status: merged.status,
  }) !== stableStringify({
    location: existing.location,
    casualties: normalizeCasualtyFields(existing.casualties, existing.casualtyMeta).casualties,
    casualtyMeta: normalizeCasualtyFields(existing.casualties, existing.casualtyMeta).casualtyMeta,
    sources: cleanSources(existing.sources || []),
    tags: Array.isArray((existing as any).tags) ? (existing as any).tags : [],
    status: existing.status || "unconfirmed",
  });

  return { merged, changed };
}

async function databaseSummary(db: mongoose.mongo.Db): Promise<DatabaseSummary> {
  const attacks = db.collection("attacks");
  const unresolved = db.collection("credible_unresolved_incidents");
  const crosswalk = db.collection("incident_crosswalk_evidence");
  const sourceArticles = db.collection("sourcearticles");
  const [
    attackTotal,
    attackSoftDeleted,
    attackMissingDeleted,
    unresolvedTotal,
    unresolvedOpen,
    unresolvedResolved,
    unresolvedRejected,
    unresolvedMerged,
    crosswalkTotal,
    matchedAttack,
    matchedUnresolved,
    sourceArticleTotal,
    sourceArticlePublished,
    sourceArticleMerged,
    sourceArticleReference,
    sourceArticleRejected,
  ] = await Promise.all([
    attacks.countDocuments({}),
    attacks.countDocuments({ _deleted: true }),
    attacks.countDocuments({ _deleted: { $exists: false } }),
    unresolved.countDocuments({}),
    unresolved.countDocuments({ reviewStatus: "open" }),
    unresolved.countDocuments({ reviewStatus: "resolved_to_attack" }),
    unresolved.countDocuments({ reviewStatus: "rejected" }),
    unresolved.countDocuments({ reviewStatus: "merged_reference" }),
    crosswalk.countDocuments({}),
    crosswalk.countDocuments({ coverageStatus: "MATCHED_ATTACK" }),
    crosswalk.countDocuments({ coverageStatus: "MATCHED_UNRESOLVED" }),
    sourceArticles.countDocuments({}),
    sourceArticles.countDocuments({ outcome: "published" }),
    sourceArticles.countDocuments({ outcome: "merged" }),
    sourceArticles.countDocuments({ outcome: "reference" }),
    sourceArticles.countDocuments({ outcome: "rejected" }),
  ]);
  return {
    attacks: {
      total: attackTotal,
      active: attackTotal - attackSoftDeleted,
      softDeleted: attackSoftDeleted,
      missingDeletedFlag: attackMissingDeleted,
    },
    credibleUnresolvedIncidents: {
      total: unresolvedTotal,
      open: unresolvedOpen,
      resolvedToAttack: unresolvedResolved,
      rejected: unresolvedRejected,
      mergedReference: unresolvedMerged,
    },
    incidentCrosswalkEvidence: {
      total: crosswalkTotal,
      matchedAttack,
      matchedUnresolved,
    },
    sourceArticles: {
      total: sourceArticleTotal,
      published: sourceArticlePublished,
      merged: sourceArticleMerged,
      reference: sourceArticleReference,
      rejected: sourceArticleRejected,
    },
  };
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeJsonl(filePath: string, rows: unknown[]) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
}

async function snapshot(db: mongoose.mongo.Db, runId: string) {
  const dir = path.join(OUTPUT_ROOT, runId, "snapshots");
  const collections = ["attacks", "credible_unresolved_incidents", "incident_crosswalk_evidence", "sourcearticles"];
  const files: Record<string, string> = {};
  for (const collectionName of collections) {
    const rows = await db.collection(collectionName).find({}).sort({ _id: 1 }).toArray();
    const filePath = path.join(dir, `${collectionName}.jsonl`);
    await writeJsonl(filePath, rows);
    files[collectionName] = filePath;
  }
  const summary = await databaseSummary(db);
  await writeJson(path.join(dir, "summary.json"), { runId, generatedAt: new Date().toISOString(), files, summary });
  return { dir, files, summary };
}

async function buildManifest(db: mongoose.mongo.Db, runId: string, fetchConcurrency: number, timeoutMs: number): Promise<Manifest> {
  const startDay = argValue("--start", DEFAULT_START)!;
  const endDay = argValue("--end", DEFAULT_END)!;
  const { start, endExclusive } = scopeFilter(startDay, endDay);
  const candidates = (await db.collection<Candidate>("credible_unresolved_incidents")
    .find({ reviewStatus: "open" })
    .sort({ eventDate: 1, candidateHash: 1 })
    .toArray())
    .filter((candidate) => candidateInScope(candidate, start, endExclusive));
  const attacks = await db.collection<AttackDoc>("attacks")
    .find({ _deleted: { $ne: true }, date: { $gte: start, $lt: endExclusive } })
    .sort({ date: 1, _id: 1 })
    .toArray();

  const reviewedPlans = await mapConcurrent(candidates, fetchConcurrency, async (candidate) => {
    const sourceChecks = await mapConcurrent(candidate.sources || [], Math.min(3, fetchConcurrency), (source) => checkSource(candidate, source, timeoutMs));
    return reviewCandidate(candidate, attacks, sourceChecks);
  });
  const plans = reconcileManifestDuplicates(reviewedPlans);

  const summary = summarize(plans);
  return {
    runId,
    generatedAt: new Date().toISOString(),
    mode: "dry-run",
    scope: {
      start: start.toISOString(),
      endInclusive: lagosDayStart(endDay).toISOString(),
      timezone: "Africa/Lagos",
      country: "Nigeria",
    },
    sourcePolicy: [
      "No Vertex, Gemini, or model-generated discovery was used.",
      "Lead-only/search-result URLs are blocked from production promotion.",
      "Production inserts require exact incident date, supported location precision, and at least direct event-specific source metadata or fetched page match.",
      "Attacker-only/security-operation casualties are not counted as victim casualties.",
      "Conflicting casualty values are represented through casualtyMeta ranges via mergeCasualtyAssessments.",
    ],
    databaseBefore: await databaseSummary(db),
    summary,
    plans,
  };
}

function sameDateState(a: PlannedAttack, b: PlannedAttack) {
  return dateKey(a.date) === dateKey(b.date) && normalizeStateName(a.location.state) === normalizeStateName(b.location.state);
}

function isSamePlannedIncident(a: PlannedAttack, b: PlannedAttack) {
  if (!sameDateState(a, b)) return false;
  if (sourceOverlap(a.sources, b.sources)) return true;
  const aTown = a.location.town.toLowerCase();
  const bTown = b.location.town.toLowerCase();
  const aLga = a.location.lga.toLowerCase();
  const bLga = b.location.lga.toLowerCase();
  const tokenScore = jaccard(titleTokens(a.title), titleTokens(b.title));
  if (aTown !== "unknown" && aTown === bTown && tokenScore >= 0.2) return true;
  if (aLga !== "unknown" && aLga === bLga && tokenScore >= 0.28) return true;
  const combined = `${a.title} ${b.title} ${a.location.lga} ${b.location.lga}`.toLowerCase();
  if (/\bborgu\b/.test(combined) && /\b(mosque|worshippers?|abduct|kidnap|captives?)\b/.test(combined)) return true;
  return false;
}

function reconcileManifestDuplicates(plans: PromotionPlan[]) {
  const accepted: PromotionPlan[] = [];
  const output: PromotionPlan[] = [];
  for (const plan of plans) {
    if (plan.disposition !== "READY_INSERT" || !plan.attack) {
      output.push(plan);
      if (plan.disposition.startsWith("READY") && plan.attack) accepted.push(plan);
      continue;
    }
    const duplicate = accepted.find((existing) => existing.attack && isSamePlannedIncident(existing.attack, plan.attack!));
    if (duplicate) {
      output.push({
        ...plan,
        disposition: "SKIP_DUPLICATE",
        reasons: ["DUPLICATE_WITH_READY_OR_EXISTING_MANIFEST_RECORD"],
        targetAttackId: duplicate.targetAttackId,
        targetAttackTitle: duplicate.attack?.title,
        duplicateScore: 1,
        casualtyDelta: undefined,
      });
      continue;
    }
    output.push(plan);
    accepted.push(plan);
  }
  return output;
}

function reviewCandidate(candidate: Candidate, attacks: AttackDoc[], sourceChecks: EvidenceCheck[]): PromotionPlan {
  const reasons: string[] = [];
  const directSources = (candidate.sources || []).filter((source) => directUrlStatus(source).ok);
  const sourceOk = sourceChecks.some((check) => check.status === "PASS" || check.status === "PARTIAL");
  const nonProductionReasons = looksLikeNonProductionIncident(candidate);
  const precision = normalizeLocationPrecision(candidate.locationPrecision);

  if (candidate.datePrecision !== "exact_day" || !candidate.eventDate) reasons.push("ORIGINAL_INCIDENT_DATE_NOT_EXACT_DAY");
  if (!["exact", "surrounding_area", "approximate_lga", "approximate_state"].includes(precision)) reasons.push("LOCATION_PRECISION_NOT_SUPPORTED");
  if (!directSources.length) reasons.push("NO_DIRECT_SOURCE_URL");
  if (!sourceOk) reasons.push("DIRECT_SOURCE_NOT_CHECKED_OR_NOT_EVENT_SPECIFIC");
  if (!hasEventSpecificAttackSignal(candidate)) reasons.push("NO_EVENT_SPECIFIC_ATTACK_SIGNAL");
  if (nonProductionReasons.length) reasons.push(...nonProductionReasons);
  if (attackerCasualtyRisk(candidate)) reasons.push("KILLED_COUNT_MAY_BE_ATTACKER_DEATHS");

  if (reasons.length) {
    const disposition: Disposition = reasons.some((reason) => reason.includes("DATE") || reason.includes("SOURCE") || reason.includes("LOCATION") || reason.includes("ATTACKER")) ? "BLOCKED" : "UNRESOLVED";
    return { candidateHash: candidate.candidateHash, candidateId: String(candidate._id), disposition, reasons: [...new Set(reasons)], sourceChecks };
  }

  const planned = buildPlannedAttack(candidate);
  const scored = attacks
    .map((attack) => ({ attack, score: duplicateScore(candidate, planned, attack) }))
    .filter((item) => item.score >= 0.66)
    .sort((a, b) => b.score - a.score);

  if (scored.length) {
    const best = scored[0];
    if (sourceOverlap(best.attack.sources, planned.sources)) {
      return {
        candidateHash: candidate.candidateHash,
        candidateId: String(candidate._id),
        disposition: "SKIP_DUPLICATE",
        reasons: ["SOURCE_URL_ALREADY_LINKED_TO_EXISTING_ATTACK"],
        sourceChecks,
        targetAttackId: String(best.attack._id),
        targetAttackTitle: best.attack.title,
        duplicateScore: best.score,
      };
    }
    const merged = mergeAttackPlan(best.attack, planned);
    return {
      candidateHash: candidate.candidateHash,
      candidateId: String(candidate._id),
      disposition: merged.changed ? "READY_MERGE" : "SKIP_DUPLICATE",
      reasons: merged.changed ? ["DUPLICATE_ATTACK_FOUND_READY_TO_MERGE_SOURCES_OR_METADATA"] : ["DUPLICATE_ATTACK_FOUND_NO_FIELD_CHANGES"],
      sourceChecks,
      attack: merged.merged,
      targetAttackId: String(best.attack._id),
      targetAttackTitle: best.attack.title,
      duplicateScore: best.score,
      casualtyDelta: casualtyDelta(best.attack.casualties, merged.merged.casualties),
    };
  }

  return {
    candidateHash: candidate.candidateHash,
    candidateId: String(candidate._id),
    disposition: "READY_INSERT",
    reasons: ["EVENT_SPECIFIC_DIRECT_EVIDENCE_READY_FOR_PUBLIC_ATTACK"],
    sourceChecks,
    attack: planned,
    casualtyDelta: casualtyDelta(undefined, planned.casualties),
  };
}

function zeroCasualties(): CasualtyValues {
  return { killed: 0, injured: 0, kidnapped: 0, displaced: 0 };
}

function summarize(plans: PromotionPlan[]): ManifestSummary {
  const dispositions = {
    READY_INSERT: 0,
    READY_UPDATE: 0,
    READY_MERGE: 0,
    SKIP_DUPLICATE: 0,
    BLOCKED: 0,
    UNRESOLVED: 0,
  } satisfies Record<Disposition, number>;
  const blockedReasons: Record<string, number> = {};
  const sourceAccessByDomain: Record<string, Record<EvidenceCheck["status"], number>> = {};
  const sourceTypes = {
    official: 0,
    trusted_media: 0,
    trusted_media_security: 0,
    osint_research: 0,
    osint_social: 0,
    structured_dataset: 0,
    unknown: 0,
  } satisfies Record<SourceClassification | "unknown", number>;
  const casualtyDelta = zeroCasualties();
  for (const plan of plans) {
    dispositions[plan.disposition] += 1;
    if (plan.disposition === "BLOCKED" || plan.disposition === "UNRESOLVED") {
      for (const reason of plan.reasons) blockedReasons[reason] = (blockedReasons[reason] || 0) + 1;
    }
    if (plan.disposition.startsWith("READY") && plan.casualtyDelta) {
      for (const field of CASUALTY_FIELDS) {
        const delta = plan.casualtyDelta[field];
        if (delta) casualtyDelta[field] = (casualtyDelta[field] || 0) + (delta.after || 0) - (delta.before || 0);
      }
    }
    for (const check of plan.sourceChecks) {
      const domain = check.domain || "unknown";
      sourceAccessByDomain[domain] ||= { PASS: 0, PARTIAL: 0, FAIL: 0, BLOCKED: 0 };
      sourceAccessByDomain[domain][check.status] += 1;
      sourceTypes[check.sourceType] += 1;
    }
  }
  return {
    totalCandidates: plans.length,
    dispositions,
    blockedReasons,
    sourceAccessByDomain,
    sourceTypes,
    plannedInserts: dispositions.READY_INSERT,
    plannedUpdates: dispositions.READY_UPDATE,
    plannedMerges: dispositions.READY_MERGE,
    skippedDuplicates: dispositions.SKIP_DUPLICATE,
    unresolved: dispositions.UNRESOLVED,
    casualtyDelta,
  };
}

function updatePayload(planned: PlannedAttack) {
  return {
    title: planned.title,
    description: planned.description,
    date: new Date(planned.date),
    location: planned.location,
    group: planned.group,
    casualties: planned.casualties,
    casualtyMeta: planned.casualtyMeta,
    sources: planned.sources,
    status: planned.status,
    tags: planned.tags,
    hash: planned.hash,
    _deleted: false,
    updatedAt: new Date(),
  };
}

function comparableExistingAttack(doc: any) {
  const normalizedImpact = normalizeCasualtyFields(doc.casualties, doc.casualtyMeta);
  return {
    title: doc.title,
    description: doc.description,
    date: new Date(doc.date).toISOString(),
    location: doc.location,
    group: doc.group,
    casualties: normalizedImpact.casualties,
    casualtyMeta: normalizedImpact.casualtyMeta,
    sources: cleanSources(doc.sources || []),
    status: doc.status || "unconfirmed",
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    hash: doc.hash,
    _deleted: doc._deleted ?? false,
  };
}

function comparablePlannedAttack(planned: PlannedAttack) {
  const normalizedImpact = normalizeCasualtyFields(planned.casualties, planned.casualtyMeta);
  return {
    title: planned.title,
    description: planned.description,
    date: new Date(planned.date).toISOString(),
    location: planned.location,
    group: planned.group,
    casualties: normalizedImpact.casualties,
    casualtyMeta: normalizedImpact.casualtyMeta,
    sources: cleanSources(planned.sources || []),
    status: planned.status,
    tags: planned.tags,
    hash: planned.hash,
    _deleted: false,
  };
}

async function applyManifest(db: mongoose.mongo.Db, manifest: Manifest, verifyOnly = false) {
  const attacks = db.collection("attacks");
  const unresolved = db.collection("credible_unresolved_incidents");
  const crosswalk = db.collection("incident_crosswalk_evidence");
  const results: Array<Record<string, unknown>> = [];
  let inserted = 0;
  let modified = 0;
  let matched = 0;

  for (const plan of manifest.plans) {
    if (!plan.disposition.startsWith("READY") || !plan.attack) continue;
    const now = new Date();
    if (plan.disposition === "READY_INSERT") {
      const existing = await attacks.findOne({ hash: plan.attack.hash });
      if (existing) {
        matched += 1;
        results.push({ candidateHash: plan.candidateHash, disposition: plan.disposition, action: "NO_OP_HASH_EXISTS", attackId: existing._id });
      } else if (!verifyOnly) {
        const doc = { ...updatePayload(plan.attack), createdAt: now, updatedAt: now };
        const result = await attacks.insertOne(doc);
        inserted += 1;
        modified += 1;
        await unresolved.updateOne({ candidateHash: plan.candidateHash, reviewStatus: "open" }, { $set: { reviewStatus: "resolved_to_attack", updatedAt: now } });
        await crosswalk.updateMany({ candidateHashes: plan.candidateHash }, { $addToSet: { attackIds: result.insertedId }, $set: { coverageStatus: "MATCHED_ATTACK", updatedAt: now } });
        results.push({ candidateHash: plan.candidateHash, disposition: plan.disposition, action: "INSERTED", attackId: result.insertedId });
      }
      continue;
    }

    if (!plan.targetAttackId || !mongoose.Types.ObjectId.isValid(plan.targetAttackId)) {
      results.push({ candidateHash: plan.candidateHash, disposition: plan.disposition, action: "BLOCKED_INVALID_TARGET" });
      continue;
    }

    const targetId = new mongoose.Types.ObjectId(plan.targetAttackId);
    const before = await attacks.findOne({ _id: targetId, _deleted: { $ne: true } });
    if (!before) {
      results.push({ candidateHash: plan.candidateHash, disposition: plan.disposition, action: "BLOCKED_TARGET_NOT_FOUND" });
      continue;
    }
    const payload = updatePayload(plan.attack);
    const comparableBefore = stableStringify(comparableExistingAttack(before));
    const comparableAfter = stableStringify(comparablePlannedAttack(plan.attack));
    if (comparableBefore === comparableAfter) {
      matched += 1;
      results.push({ candidateHash: plan.candidateHash, disposition: plan.disposition, action: "NO_OP_ALREADY_APPLIED", attackId: targetId });
    } else if (!verifyOnly) {
      const result = await attacks.updateOne({ _id: targetId }, { $set: payload });
      modified += result.modifiedCount;
      matched += result.matchedCount;
      await unresolved.updateOne({ candidateHash: plan.candidateHash, reviewStatus: "open" }, { $set: { reviewStatus: "merged_reference", updatedAt: now } });
      await crosswalk.updateMany({ candidateHashes: plan.candidateHash }, { $addToSet: { attackIds: targetId }, $set: { coverageStatus: "MATCHED_ATTACK", updatedAt: now } });
      results.push({ candidateHash: plan.candidateHash, disposition: plan.disposition, action: result.modifiedCount ? "UPDATED_TARGET" : "NO_OP_UPDATE", attackId: targetId });
    }
  }

  return { inserted, modified, matched, results };
}

async function readManifest(filePath: string): Promise<Manifest> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as Manifest;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required in .env.local; no database work was performed.");
  const runId = argValue("--run-id", nowRunId())!;
  const outputDir = path.join(OUTPUT_ROOT, runId);
  const manifestPath = argValue("--manifest", path.join(outputDir, "promotion-manifest.json"))!;
  const fetchConcurrency = Number(argValue("--fetch-concurrency", "6"));
  const timeoutMs = Number(argValue("--timeout-ms", "12000"));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, socketTimeoutMS: 45000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection did not expose a database handle.");

  try {
    if (args.has("--snapshot")) {
      const result = await snapshot(db, runId);
      console.log(JSON.stringify({ phase: "snapshot", status: "PASS", runId, outputDir: result.dir, summary: result.summary }, null, 2));
    }

    if (args.has("--dry-run")) {
      const manifest = await buildManifest(db, runId, fetchConcurrency, timeoutMs);
      await writeJson(manifestPath, manifest);
      await writeJson(path.join(outputDir, "promotion-summary.json"), manifest.summary);
      console.log(JSON.stringify({ phase: "dry-run", status: "PASS", runId, manifestPath, summary: manifest.summary }, null, 2));
    }

    if (args.has("--apply")) {
      const manifest = await readManifest(manifestPath);
      const before = await databaseSummary(db);
      const result = await applyManifest(db, manifest, false);
      const after = await databaseSummary(db);
      const applyPath = path.join(path.dirname(manifestPath), args.has("--idempotency-pass") ? "apply-idempotency-result.json" : "apply-result.json");
      await writeJson(applyPath, { runId: manifest.runId, generatedAt: new Date().toISOString(), before, after, ...result });
      console.log(JSON.stringify({ phase: args.has("--idempotency-pass") ? "idempotency-apply" : "apply", status: "PASS", outputPath: applyPath, inserted: result.inserted, modified: result.modified, matched: result.matched }, null, 2));
    }

    if (!args.has("--snapshot") && !args.has("--dry-run") && !args.has("--apply")) {
      console.log("Usage: npx tsx scripts/promote-unresolved-candidates.ts --snapshot --dry-run [--apply] [--manifest path] [--run-id id]");
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "FAIL", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
