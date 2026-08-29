import crypto from "crypto";
import Attack from "./models/Attack";
import SourceArticle from "./models/SourceArticle";
import { normalizeStateName } from "./normalize-state";

export interface RawAttackData {
  title: string;
  description: string;
  date: string;
  location: { state: string; lga: string; town: string };
  group: string;
  casualties: { killed: number | null; injured: number | null; kidnapped: number | null; displaced: number | null };
  sources: { url: string; title: string; publisher: string }[];
  civilianCasualties: boolean;
  status: "confirmed" | "unconfirmed" | "developing";
  tags: string[];
}

type Feed = { publisher: string; url: string };
type FeedItem = { title: string; url: string; publishedAt: Date };
export type FreeCollectionResult = { inspected: number; published: number; merged: number; references: number; rejected: number; errors: number };

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
const configuredConcurrency = Number(process.env.FREE_SOURCE_CONCURRENCY || 4);
const FEED_CONCURRENCY = Number.isFinite(configuredConcurrency)
  ? Math.max(1, Math.min(Math.floor(configuredConcurrency), FEEDS.length))
  : 4;

const STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
const STATE_PATTERN = new RegExp(`\\b(${[...STATES, "Abuja", "Federal Capital Territory"].map(escapeRegex).join("|")})(?:\\s+State)?\\b`, "i");
const EVENT_PATTERN = /\b(attack(?:ed|s|ing)?|ambush(?:ed|es)?|kidnap(?:ped|s|ping)?|abduct(?:ed|s|ing)?|kill(?:ed|s|ing)?|injur(?:ed|es|ing)?|wound(?:ed|s|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|gunmen|bandits?|insurgents?|terrorists?|militants?|ied|explosion|clash(?:es|ed)?|massacre[ds]?)\b/i;
const RETROSPECTIVE_PATTERN = /\b(anniversary|years? ago|in (?:19|20)\d{2}|remember(?:ing)?|recall(?:ed|ing)?|previously|historic(?:al)?|at the time|had been)\b/i;

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

function dateFromText(text: string, publishedAt: Date): Date | null {
  const absolute = text.match(/\b(?:on\s+)?((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,)?\s+(?:20)\d{2}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,)?\s+(?:20)\d{2})\b/i);
  if (absolute) {
    const parsed = new Date(`${absolute[1].replace(/(st|nd|rd|th)/i, "")} UTC`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const relative = text.match(/\b(today|yesterday)\b/i);
  if (relative && EVENT_PATTERN.test(text)) {
    const date = new Date(publishedAt);
    if (relative[1].toLowerCase() === "yesterday") date.setUTCDate(date.getUTCDate() - 1);
    return date;
  }
  return null;
}
function extractState(text: string): string | null { const match = text.match(STATE_PATTERN)?.[1]; return !match ? null : /abuja|federal capital/i.test(match) ? "FCT" : normalizeStateName(match); }
function extractTown(title: string, state: string): string | null {
  const location = title.match(/\b(?:in|at|near)\s+([A-Z][A-Za-z'’-]{2,}(?:\s+[A-Z][A-Za-z'’-]{2,}){0,2})(?:,|\s+in)?/);
  const town = location?.[1]?.trim();
  if (!town || new RegExp(`^${escapeRegex(state)}$`, "i").test(town)) return null;
  return /^(nigeria|community|village|state)$/i.test(town) ? null : town;
}
function extractGroup(text: string): string { if (/boko\s+haram/i.test(text)) return "Boko Haram"; if (/\biswap\b/i.test(text)) return "ISWAP"; if (/\bipob|\besn\b/i.test(text)) return "IPOB/ESN"; if (/\bbandits?\b/i.test(text)) return "Bandits"; if (/\bherdsmen\b/i.test(text)) return "Herdsmen"; if (/\bcultists?\b/i.test(text)) return "Cultists"; return "Unknown Gunmen"; }
function extractCasualtyCount(text: string, terms: string): number | null {
  const people = "(?:people|persons|villagers|residents|farmers|soldiers|police officers?|civilians?|students?|victims?)?";
  const counted = text.match(new RegExp(`\\b(\\d{1,4})\\s+${people}\\s*(?:were\\s+)?(?:${terms})\\b`, "i"));
  if (counted) return Number(counted[1]);
  if (new RegExp(`\\b(?:no|zero|none|without(?:\\s+any)?)\\s+${people}\\s*(?:were\\s+)?(?:${terms})\\b`, "i").test(text)) return 0;
  const impactWasReportedWithoutFigure = new RegExp(`\\b(?:${terms})\\b`, "i").test(text) || /\\b(?:casualties?|victims?)\\s+(?:were\\s+)?(?:unknown|unclear|not known|unconfirmed)\\b/i.test(text);
  return impactWasReportedWithoutFigure ? null : 0;
}
function hashFor(attack: RawAttackData): string { const day = new Date(attack.date).toISOString().slice(0, 10); return crypto.createHash("sha256").update(`${day}|${attack.location.state.toLowerCase()}|${attack.location.town.toLowerCase()}|${attack.group.toLowerCase()}`).digest("hex"); }

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
  const text = `${title}. ${description}. ${articleText(html)}`;
  if (!EVENT_PATTERN.test(text)) { await record(item, publisher, "rejected", "No security-incident language in article text."); return "rejected"; }
  const state = extractState(text); const incidentDate = dateFromText(text, item.publishedAt); const group = extractGroup(text);
  if (!state || !incidentDate) { await record(item, publisher, "rejected", "Missing an explicit incident date or Nigerian state; publication date is never used as the incident date.", incidentDate); return "rejected"; }
  const incidentAgeDays = (Date.now() - incidentDate.getTime()) / 86_400_000;
  if (incidentAgeDays > MAX_INCIDENT_AGE_DAYS || incidentAgeDays < -1 || RETROSPECTIVE_PATTERN.test(text)) {
    if (!await addAsReference(item, publisher, state, incidentDate, group)) await record(item, publisher, "reference", "Retrospective or older incident: evidence only, never a new incident.", incidentDate);
    return "reference";
  }
  const town = extractTown(title, state);
  if (!town) { await record(item, publisher, "rejected", "Precise town/LGA was not deterministically extractable, so article was not auto-published.", incidentDate); return "rejected"; }
  const attack: RawAttackData = { title, description: (description || articleText(html)).slice(0, 5000), date: incidentDate.toISOString(), location: { state, lga: "Unknown", town }, group, casualties: { killed: extractCasualtyCount(text, "killed"), injured: extractCasualtyCount(text, "injured|wounded"), kidnapped: extractCasualtyCount(text, "kidnapped|abducted"), displaced: extractCasualtyCount(text, "displaced|forced to flee") }, civilianCasualties: true, sources: [{ url: item.url, title, publisher }], status: "unconfirmed", tags: ["source-led", group.toLowerCase().replace(/\W+/g, "-")] };
  const hash = hashFor(attack); const existing = await Attack.findOne({ hash });
  if (existing) { if (!existing.sources.some((source: { url: string }) => source.url.replace(/\/$/, "") === item.url.replace(/\/$/, ""))) await Attack.findByIdAndUpdate(existing._id, { $push: { sources: attack.sources[0] } }); await record(item, publisher, "merged", "Same incident fingerprint from another trusted source.", incidentDate, existing._id); return "merged"; }
  const saved = await Attack.create({ ...attack, hash }); await record(item, publisher, "published", "Recent incident date, state, town, event language, and fresh source all passed.", incidentDate, saved._id); return "published";
}

export async function collectFreeIncidents(): Promise<FreeCollectionResult> {
  const result: FreeCollectionResult = { inspected: 0, published: 0, merged: 0, references: 0, rejected: 0, errors: 0 };

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
