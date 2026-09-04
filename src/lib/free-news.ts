import crypto from "crypto";
import Attack from "./models/Attack";
import SourceArticle from "./models/SourceArticle";
import {
  type CasualtyCountMetadata,
  type CasualtyMetadata,
  type LocationPrecision,
  normalizeCasualtyFields,
} from "./incident-uncertainty";
import { normalizeStateName, VALID_STATE_NAMES } from "./normalize-state";
import { screenIncidentCandidate } from "./incident-scope";

export interface RawAttackData {
  title: string;
  description: string;
  date: string;
  location: { state: string; lga: string; town: string; precision?: LocationPrecision; notes?: string };
  group: string;
  casualties: { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };
  casualtyMeta?: CasualtyMetadata;
  sources: { url: string; title: string; publisher: string }[];
  civilianCasualties: boolean;
  status: "confirmed" | "unconfirmed" | "developing";
  tags: string[];
}

type Feed = { publisher: string; url: string };
type FeedItem = { title: string; url: string; publishedAt: Date };
export type FreeCollectionResult = { inspected: number; published: number; merged: number; references: number; rejected: number; errors: number; disabled: boolean };

const FEEDS: Feed[] = [
  { publisher: "Premium Times", url: "https://www.premiumtimesng.com/feed" },
  { publisher: "The Cable", url: "https://www.thecable.ng/feed/" },
  { publisher: "Channels TV", url: "https://www.channelstv.com/feed/" },
  { publisher: "Punch", url: "https://punchng.com/feed/" },
  { publisher: "Vanguard", url: "https://www.vanguardngr.com/feed/" },
  { publisher: "Daily Trust", url: "https://dailytrust.com/feed/" },
  { publisher: "HumAngle", url: "https://humanglemedia.com/feed/" },
  { publisher: "The Guardian Nigeria", url: "https://guardian.ng/feed/" },
  { publisher: "Daily Post", url: "https://dailypost.ng/feed/" },
  { publisher: "Sahara Reporters", url: "https://saharareporters.com/rss.xml" },
  // These outlets add regional and security reporting that does not always
  // reach the larger national feeds above.
  { publisher: "Tribune Online", url: "https://tribuneonlineng.com/feed/" },
  { publisher: "PRNigeria", url: "https://prnigeria.com/feed/" },
  { publisher: "Daily Nigerian", url: "https://dailynigerian.com/feed/" },
  { publisher: "News Central", url: "https://newscentral.africa/feed/" },
];

const MAX_ARTICLE_AGE_HOURS = Number(process.env.FREE_SOURCE_MAX_ARTICLE_AGE_HOURS || 72);
const MAX_INCIDENT_AGE_DAYS = Number(process.env.FREE_SOURCE_MAX_INCIDENT_AGE_DAYS || 3);
const FETCH_TIMEOUT_MS = Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 8000);
const MAX_ITEMS_PER_FEED = Number(process.env.FREE_SOURCE_MAX_ITEMS_PER_FEED || 12);
const FREE_SOURCE_INGEST_ENABLED = process.env.FREE_SOURCE_INGEST_ENABLED === "true";
const configuredConcurrency = Number(process.env.FREE_SOURCE_CONCURRENCY || 4);
const FEED_CONCURRENCY = Number.isFinite(configuredConcurrency)
  ? Math.max(1, Math.min(Math.floor(configuredConcurrency), FEEDS.length))
  : 4;

const STATES = [...VALID_STATE_NAMES];
const STATE_TERMS = [...STATES, "Abuja", "Federal Capital Territory"].sort((a, b) => b.length - a.length);
const STATE_PATTERN = new RegExp(`\\b(${STATE_TERMS.map(escapeRegex).join("|")})(\\s+State)?\\b`, "gi");
const AMBIGUOUS_STATE_NAMES = new Set(["Cross River", "Delta", "Niger", "Plateau", "Rivers"]);
const SECURITY_INCIDENT_PATTERN = /\b(attack(?:ed|s|ing)?|ambush(?:ed|es)?|kidnap(?:ped|s|ping)?|abduct(?:ed|s|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|gunmen|bandits?|insurgents?|terrorists?|militants?|boko\s+haram|iswap|ied|clash(?:es|ed)?|massacre[ds]?|herdsmen|cultists?)\b/i;
const NON_SECURITY_DISASTER_PATTERN = /\b(floods?|landslides?|earthquakes?|storms?|typhoons?|hurricanes?|crash(?:es)?|accidents?|stampedes?|building collapses?|fire outbreaks?|disease outbreaks?|cholera)\b/i;
const RETROSPECTIVE_PATTERN = /\b(anniversary|years? ago|in (?:19|20)\d{2}|remember(?:ing)?|recall(?:ed|ing)?|previously|historic(?:al)?|at the time|had been)\b/i;
const NIGERIAN_LOCATION_CONTEXT_PATTERN = /\b(Nigeria|Nigerian|State|Police Command|LGA|Local Government Area|Local Govt\.?|Council Area|governor|residents?)\b/i;
const ROUNDUP_HEADLINE_PATTERN = /\b(?:nigerian newspapers?|10 things? you need to know|top stories|morning headlines?|daily briefing|news roundup|latest news)\b/i;
const DIRECT_EVENT_HEADLINE_PATTERN = /\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|shot|kidnap(?:ped|ping)?|abduct(?:ed|ing)?|bomb(?:ed|ing)?|explod(?:ed|ing)|clash(?:ed|es|ing)?|massacre[ds]?|hostage|captive)\b/i;
const VICTIM_OUTCOME_HEADLINE_PATTERN = /\b(?:killed|injured|wounded)\b[\s\S]{0,70}\b(?:civilian|villager|resident|farmer|soldier|troop|police|officer|people|victim|worshipper|student|child|driver|commuter)\b|\b(?:civilian|villager|resident|farmer|soldier|troop|police|officer|people|victim|worshipper|student|child|driver|commuter)\b[\s\S]{0,70}\b(?:killed|injured|wounded)\b/i;
const SECURITY_OPERATION_HEADLINE_PATTERN = /^\s*(?:troops?|army|soldiers?|police|military|joint\s+task\s+force|jtf|operation\s+[A-Z]+)\b[\s\S]{0,120}\b(?:raid(?:ed|s|ing)?|ambush(?:ed|es|ing)?|overpower(?:ed|s|ing)?|kill(?:ed|s|ing)?|neutraliz(?:e|ed|es|ing)|recover(?:ed|s|ing)?|arrest(?:ed|s|ing)?|rescue(?:d|s|ing)?)\b/i;
const HOSTILE_ATTACK_ON_SECURITY_HEADLINE_PATTERN = /\b(?:bandits?|terrorists?|gunmen|insurgents?|militants?)\b[\s\S]{0,80}\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|bomb(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|target(?:ed|s|ing)?)\b[\s\S]{0,80}\b(?:troops?|soldiers?|army|police|officers?|convoy|base|barracks?|station)\b/i;
const ABSOLUTE_DATE_PATTERN = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+20\d{2}\b|\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,)?\s+20\d{2}\b/i;

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function decodeHtml(value: string): string { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function field(xml: string, tag: string): string { return decodeHtml(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || ""); }

function parseFeed(xml: string): FeedItem[] {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) || [];
  return blocks.map(block => {
    const href = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
    const url = href || field(block, "link") || field(block, "guid");
    return { title: field(block, "title"), url: url.trim(), publishedAt: new Date(field(block, "pubDate") || field(block, "published") || field(block, "updated")) };
  }).filter(item => item.title && /^https?:\/\//i.test(item.url) && !Number.isNaN(item.publishedAt.getTime()));
}

function meta(html: string, name: string): string {
  const escaped = escapeRegex(name);
  const direct = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const reversed = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
  return decodeHtml(html.match(direct)?.[1] || html.match(reversed)?.[1] || "");
}
function articleText(html: string): string { return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => decodeHtml(match[1])).filter(text => text.length >= 40).slice(0, 18).join(" ").slice(0, 8000); }
function articleLead(html: string): string { return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => decodeHtml(match[1])).filter(text => text.length >= 40).slice(0, 4).join(" ").slice(0, 2800); }

function sourceLedAdmissionRejection(title: string, lead: string): string | null {
  if (ROUNDUP_HEADLINE_PATTERN.test(title)) return "roundup or newspaper-summary headline, not a specific incident";

  const hasEventHeadline = DIRECT_EVENT_HEADLINE_PATTERN.test(title) || VICTIM_OUTCOME_HEADLINE_PATTERN.test(title);
  if (!hasEventHeadline) return "headline is not specific to an original armed/security incident";

  // A rescue/release headline is follow-up evidence unless its lead supplies
  // the original event date. Otherwise the feed publication date would create
  // a false new incident.
  if (/\b(?:rescue|rescued|release|released|freed|recovered|recovery)\b/i.test(title) && !ABSOLUTE_DATE_PATTERN.test(lead)) {
    return "rescue or release headline does not identify the original incident date";
  }

  // A security-force operation is not itself a public incident. Keep it out
  // unless the headline describes hostile harm to security personnel, or the
  // rescue branch above has established that this is tied to an original event.
  if (SECURITY_OPERATION_HEADLINE_PATTERN.test(title) &&
      !VICTIM_OUTCOME_HEADLINE_PATTERN.test(title) &&
      !HOSTILE_ATTACK_ON_SECURITY_HEADLINE_PATTERN.test(title)) {
    return "security-force operation or operational result without a qualifying victim attack";
  }

  return null;
}

export function isFreeSourceIngestionEnabled(): boolean {
  return FREE_SOURCE_INGEST_ENABLED;
}

function dateFromText(text: string, publishedAt: Date): Date | null {
  const absolute = text.match(/\b(?:on\s+)?((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+(?:20)\d{2}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,)?\s+(?:20)\d{2})\b/i);
  if (absolute) {
    const parsed = new Date(`${absolute[1].replace(/(st|nd|rd|th)/i, "")} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const relative = text.match(/\b(today|yesterday)\b/i);
  if (relative && hasSecurityIncidentSignal(text)) {
    const date = new Date(publishedAt);
    if (relative[1].toLowerCase() === "yesterday") date.setUTCDate(date.getUTCDate() - 1);
    return date;
  }
  return null;
}
function hasSecurityIncidentSignal(text: string): boolean {
  if (!SECURITY_INCIDENT_PATTERN.test(text)) return false;
  return !NON_SECURITY_DISASTER_PATTERN.test(text) || /\b(attack|ambush|kidnap|abduct|raid|shoot|gunmen|bandits?|insurgents?|terrorists?|militants?|boko\s+haram|iswap|ied|clash|massacre|herdsmen|cultists?)\b/i.test(text);
}

function extractState(text: string): string | null {
  for (const match of text.matchAll(STATE_PATTERN)) {
    const raw = match[1];
    const normalized = /abuja|federal capital/i.test(raw) ? "FCT" : normalizeStateName(raw);
    if (!STATES.includes(normalized as (typeof STATES)[number])) continue;
    if (isSupportedStateMention(text, match.index ?? 0, raw, Boolean(match[2]), normalized)) {
      return normalized;
    }
  }
  return null;
}

function isSupportedStateMention(text: string, index: number, raw: string, hasStateSuffix: boolean, normalized: string): boolean {
  if (normalized === "FCT" || hasStateSuffix || !AMBIGUOUS_STATE_NAMES.has(normalized)) return true;
  if (raw !== normalized) return false;
  const context = text.slice(Math.max(0, index - 80), index + raw.length + 80);
  return NIGERIAN_LOCATION_CONTEXT_PATTERN.test(context);
}
function extractTown(title: string, state: string): string | null {
  const location = title.match(/\b(?:in|at|near)\s+([A-Z][A-Za-z'’-]{2,}(?:\s+[A-Z][A-Za-z'’-]{2,}){0,2})(?:,|\s+in)?/);
  const town = location?.[1]?.trim();
  if (!town || new RegExp(`^${escapeRegex(state)}$`, "i").test(town)) return null;
  return /^(nigeria|community|village|state)$/i.test(town) ? null : town;
}
function extractGroup(text: string): string { if (/boko\s+haram/i.test(text)) return "Boko Haram"; if (/\biswap\b/i.test(text)) return "ISWAP"; if (/\bipob|\besn\b/i.test(text)) return "IPOB/ESN"; if (/\bbandits?\b/i.test(text)) return "Bandits"; if (/\bherdsmen\b/i.test(text)) return "Herdsmen"; if (/\bcultists?\b/i.test(text)) return "Cultists"; return "Unknown Gunmen"; }
function hashFor(attack: RawAttackData): string {
  const day = new Date(attack.date).toISOString().slice(0, 10);
  const town = attack.location.town?.toLowerCase() || "";
  const lga = attack.location.lga?.toLowerCase() || "";
  const fallback = attack.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(token => token.length > 3).slice(0, 6).join("-");
  const locationKey = town && town !== "unknown" ? town : lga && lga !== "unknown" ? lga : fallback || "unknown-location";
  return crypto.createHash("sha256").update(`${day}|${attack.location.state.toLowerCase()}|${attack.location.precision || "exact"}|${locationKey}|${attack.group.toLowerCase()}`).digest("hex");
}

function extractLga(text: string): string | null {
  const match = text.match(/\b([A-Z][A-Za-z'’-]{2,}(?:\s+[A-Z][A-Za-z'’-]{2,}){0,2})\s+(?:Local Government Area|LGA|Local Govt\.?|Council Area)\b/);
  const lga = match?.[1]?.trim();
  return !lga || /^(the|a|an|in|of)$/i.test(lga) ? null : lga;
}

function extractLocation(title: string, text: string, state: string): RawAttackData["location"] {
  const town = extractTown(title, state);
  const lga = extractLga(text);
  if (town) {
    const near = /\bnear\b/i.test(title);
    return {
      state,
      lga: lga || "Unknown",
      town,
      precision: near ? "surrounding_area" : "exact",
      notes: near ? "Source describes the incident as near the named place." : "",
    };
  }
  if (lga) {
    return {
      state,
      lga,
      town: "Unknown",
      precision: "approximate_lga",
      notes: "Source identifies the LGA but not the precise settlement.",
    };
  }
  return {
    state,
    lga: "Unknown",
    town: "Unknown",
    precision: "approximate_state",
    notes: "Source identifies the state but not the LGA or town.",
  };
}

function extractCasualtyAssessment(text: string, terms: string): CasualtyCountMetadata {
  const people = "(?:people|persons|villagers|residents|farmers|soldiers|police officers?|civilians?|students?|children|worshippers?|victims?)?";
  const counted = text.match(new RegExp(`\\b(?:(about|around|approximately|over|more\\s+than|at\\s+least|nearly)\\s+)?(\\d{1,4})\\s+${people}\\s*(?:were\\s+)?(?:${terms})\\b`, "i"));
  if (counted) {
    const value = Number(counted[2]);
    const qualifier = counted[1]?.replace(/\s+/g, " ").toLowerCase();
    if (qualifier) {
      const min = /over|more than|at least/.test(qualifier) ? value : Math.max(0, Math.floor(value * 0.9));
      const max = /nearly/.test(qualifier) ? value : /about|around|approximately/.test(qualifier) ? Math.ceil(value * 1.1) : null;
      return { precision: "estimate", min, max, estimate: value, sourceText: counted[0] };
    }
    return { precision: "exact", min: value, max: value, estimate: value, sourceText: counted[0] };
  }
  const verbFirst = text.match(new RegExp(`\\b(?:${terms})\\s+(?:(about|around|approximately|over|more\\s+than|at\\s+least|nearly)\\s+)?(\\d{1,4})\\s+${people}`, "i"));
  if (verbFirst) {
    const value = Number(verbFirst[2]);
    const qualifier = verbFirst[1]?.replace(/\s+/g, " ").toLowerCase();
    if (qualifier) {
      const min = /over|more than|at least/.test(qualifier) ? value : Math.max(0, Math.floor(value * 0.9));
      const max = /nearly/.test(qualifier) ? value : /about|around|approximately/.test(qualifier) ? Math.ceil(value * 1.1) : null;
      return { precision: "estimate", min, max, estimate: value, sourceText: verbFirst[0] };
    }
    return { precision: "exact", min: value, max: value, estimate: value, sourceText: verbFirst[0] };
  }
  const range = text.match(new RegExp(`\\b(\\d{1,4})\\s*(?:-|to)\\s*(\\d{1,4})\\s+${people}\\s*(?:were\\s+)?(?:${terms})\\b`, "i"));
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return { precision: "range", min: Math.min(first, second), max: Math.max(first, second), estimate: Math.round((first + second) / 2), sourceText: range[0] };
  }
  const vague = text.match(new RegExp(`\\b(hundreds|dozens|scores)\\s+of\\s+${people}\\s*(?:were\\s+)?(?:${terms})\\b`, "i"));
  if (vague) {
    const word = vague[1].toLowerCase();
    const estimate = word === "hundreds" ? 200 : word === "scores" ? 40 : 24;
    return { precision: "estimate", min: word === "hundreds" ? 100 : word === "scores" ? 20 : 12, max: null, estimate, sourceText: vague[0] };
  }
  if (new RegExp(`\\b(?:no|zero|none|without(?:\\s+any)?)\\s+${people}\\s*(?:were\\s+)?(?:${terms})\\b`, "i").test(text)) {
    return { precision: "not_reported", min: 0, max: 0, estimate: 0 };
  }
  const impactWasReportedWithoutFigure = new RegExp(`\\b(?:${terms})\\b`, "i").test(text) || /\b(?:casualties?|victims?)\s+(?:were\s+)?(?:unknown|unclear|not known|unconfirmed)\b/i.test(text);
  return impactWasReportedWithoutFigure ? { precision: "unknown" } : { precision: "not_reported", min: 0, max: 0, estimate: 0 };
}

async function record(item: FeedItem, publisher: string, outcome: "published" | "merged" | "reference" | "rejected", reason: string, incidentDate?: Date | null, attackId?: unknown): Promise<void> {
  await SourceArticle.updateOne({ url: item.url }, { $setOnInsert: { url: item.url, publisher, title: item.title, publishedAt: item.publishedAt, outcome, reason, incidentDate: incidentDate || null, attackId: attackId || null } }, { upsert: true });
}
async function addAsReference(item: FeedItem, publisher: string, state: string, incidentDate: Date, group: string): Promise<boolean> {
  // Never attach an old article to a generic "Unknown Gunmen" record: the
  // date/state combination alone is not strong enough evidence of identity.
  if (group === "Unknown Gunmen") return false;
  const start = new Date(incidentDate); start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(incidentDate); end.setUTCDate(end.getUTCDate() + 1);
  const matches = await Attack.find({ _deleted: { $ne: true }, "location.state": state, group, date: { $gte: start, $lte: end } }).limit(2);
  if (matches.length !== 1) return false;
  if (!matches[0].sources.some((source: { url: string }) => source.url.replace(/\/$/, "") === item.url.replace(/\/$/, ""))) await Attack.findByIdAndUpdate(matches[0]._id, { $push: { sources: { url: item.url, title: item.title, publisher } } });
  await record(item, publisher, "reference", "Recent article referenced an already-recorded older incident.", incidentDate, matches[0]._id);
  return true;
}

async function processItem(item: FeedItem, publisher: string): Promise<"published" | "merged" | "reference" | "rejected"> {
  if (await SourceArticle.exists({ url: item.url })) return "rejected";
  const articleAgeHours = (Date.now() - item.publishedAt.getTime()) / 3_600_000;
  if (articleAgeHours < -2 || articleAgeHours > MAX_ARTICLE_AGE_HOURS) { await record(item, publisher, "rejected", "Article publication time is outside the fresh-source window."); return "rejected"; }
  const response = await fetch(item.url, { redirect: "follow", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { "user-agent": "NigeriaAttackTracker/1.0 (+source-led OSINT collector)" } });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) { await record(item, publisher, "rejected", "Article could not be fetched as HTML."); return "rejected"; }
  const html = await response.text();
  const title = meta(html, "og:title") || item.title;
  const description = meta(html, "description") || meta(html, "og:description");
  const lead = `${title}. ${description}. ${articleLead(html)}`.slice(0, 6000);
  const text = `${lead}. ${articleText(html)}`;
  const headlineRejection = sourceLedAdmissionRejection(title, lead);
  if (headlineRejection) { await record(item, publisher, "rejected", `Source-led admission gate: ${headlineRejection}.`); return "rejected"; }
  if (!hasSecurityIncidentSignal(lead)) { await record(item, publisher, "rejected", "No armed/security-incident language in the article headline and lead."); return "rejected"; }
  const scopeRejection = screenIncidentCandidate({ title, description: lead, group: extractGroup(lead) });
  if (scopeRejection) { await record(item, publisher, "rejected", `Non-incident scope gate: ${scopeRejection}.`); return "rejected"; }
  const state = extractState(lead); const incidentDate = dateFromText(lead, item.publishedAt); const group = extractGroup(lead);
  if (!state || !incidentDate) { await record(item, publisher, "rejected", "Missing an explicit incident date or Nigerian state; publication date is never used as the incident date.", incidentDate); return "rejected"; }
  const incidentAgeDays = (Date.now() - incidentDate.getTime()) / 86_400_000;
  if (incidentAgeDays > MAX_INCIDENT_AGE_DAYS || incidentAgeDays < -1 || RETROSPECTIVE_PATTERN.test(text)) {
    if (!await addAsReference(item, publisher, state, incidentDate, group)) await record(item, publisher, "reference", "Retrospective or older incident: evidence only, never a new incident.", incidentDate);
    return "reference";
  }
  const location = extractLocation(title, lead, state);
  const casualtyMeta: CasualtyMetadata = {
    killed: extractCasualtyAssessment(lead, "killed"),
    injured: extractCasualtyAssessment(lead, "injured|wounded"),
    kidnapped: extractCasualtyAssessment(lead, "kidnapped|abducted"),
    displaced: extractCasualtyAssessment(lead, "displaced|forced to flee"),
  };
  const normalizedImpact = normalizeCasualtyFields({}, casualtyMeta);
  const tags = ["source-led", group.toLowerCase().replace(/\W+/g, "-")];
  if (location.precision && location.precision !== "exact") tags.push("approximate-location");
  if (Object.values(casualtyMeta).some((meta) => meta?.precision === "estimate" || meta?.precision === "range")) tags.push("casualty-uncertainty");
  const attack: RawAttackData = { title, description: (description || articleLead(html) || articleText(html)).slice(0, 5000), date: incidentDate.toISOString(), location, group, casualties: normalizedImpact.casualties, casualtyMeta: normalizedImpact.casualtyMeta, civilianCasualties: true, sources: [{ url: item.url, title, publisher }], status: Object.values(casualtyMeta).some((meta) => meta?.precision === "range" || meta?.precision === "unknown") || location.precision !== "exact" ? "developing" : "unconfirmed", tags };
  const hash = hashFor(attack); const existing = await Attack.findOne({ hash });
  if (existing) { if (!existing.sources.some((source: { url: string }) => source.url.replace(/\/$/, "") === item.url.replace(/\/$/, ""))) await Attack.findByIdAndUpdate(existing._id, { $push: { sources: attack.sources[0] } }); await record(item, publisher, "merged", "Same incident fingerprint from another trusted source.", incidentDate, existing._id); return "merged"; }
  const saved = await Attack.create({ ...attack, hash }); await record(item, publisher, "published", "Recent incident date, state or LGA/location evidence, event language, and fresh source all passed.", incidentDate, saved._id); return "published";
}

export async function collectFreeIncidents(): Promise<FreeCollectionResult> {
  const result: FreeCollectionResult = { inspected: 0, published: 0, merged: 0, references: 0, rejected: 0, errors: 0, disabled: false };

  if (!FREE_SOURCE_INGEST_ENABLED) {
    console.warn("[Free Collector] Paused: set FREE_SOURCE_INGEST_ENABLED=true only after the source-led gate has been reviewed.");
    return { ...result, disabled: true };
  }

  // Fetch feeds concurrently, then keep article processing bounded. The former
  // sequential loop could spend most of a 60-second function window waiting on
  // feeds and never reach lower-priority outlets.
  const discovered = await Promise.all(FEEDS.map(async (feed) => {
    try {
      const response = await fetch(feed.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { "user-agent": "NigeriaAttackTracker/1.0 (+source-led OSINT collector)" } });
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);
      return parseFeed(await response.text())
        .slice(0, MAX_ITEMS_PER_FEED)
        .map((item) => ({ item, publisher: feed.publisher }));
    } catch (error) { result.errors++; console.error(`[Free Collector] Failed feed ${feed.publisher}:`, error); }
    return [] as Array<{ item: FeedItem; publisher: string }>;
  }));

  const seenUrls = new Set<string>();
  const articles = discovered.flat().filter(({ item }) => {
    const url = item.url.replace(/\/$/, "");
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });

  for (let index = 0; index < articles.length; index += FEED_CONCURRENCY) {
    await Promise.all(articles.slice(index, index + FEED_CONCURRENCY).map(async ({ item, publisher }) => {
      if (await SourceArticle.exists({ url: item.url })) return;
      result.inspected++;
      try {
        const outcome = await processItem(item, publisher);
        if (outcome === "published") result.published++;
        else if (outcome === "merged") result.merged++;
        else if (outcome === "reference") result.references++;
        else result.rejected++;
      } catch (error) {
        result.errors++;
        console.error(`[Free Collector] Failed article ${item.url}:`, error);
      }
    }));
  }
  return result;
}
