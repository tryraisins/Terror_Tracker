/**
 * historical-gap-scan.ts
 *
 * Back-fills the database with security incidents the regular cron missed,
 * focusing on:
 *   (a) Attacks on non-civilians (soldiers, police, army officers)
 *   (b) Attacks with no reported / unknown casualties
 *   (c) Any general attack that wasn't ingested (the no-casualty and
 *       civilianCasualties filters were removed after these months ran)
 *
 * Covers: January, February, March, and April 2026.
 * Strategy: for each month the scan is broken into ≤14-day windows; within
 *   each window the 6 geographic state groups are queried in parallel.
 *
 * Run:
 *   npx tsx scripts/historical-gap-scan.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import os from "os";
import path from "path";
import mongoose from "mongoose";

import Attack from "../src/lib/models/Attack";
import {
  RawAttackData,
  generateAttackHash,
  isUsableEvidenceUrl,
  mergeIncidentStrategies,
} from "../src/lib/gemini";
import { normalizeStateName } from "../src/lib/normalize-state";

// ─────────────────────────────────────────────
// Google Gen AI setup
// ─────────────────────────────────────────────

function ensureCredentials(): void {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!json || process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  const tmpPath = path.join(os.tmpdir(), "gcp-credentials.json");
  if (!fs.existsSync(tmpPath)) fs.writeFileSync(tmpPath, json, { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
}

function createAI(): GoogleGenAI {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not configured");
  ensureCredentials();
  return new GoogleGenAI({
    vertexai: true,
    project,
    location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
  });
}

// ─────────────────────────────────────────────
// DB
// ─────────────────────────────────────────────

async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set in .env.local");
  await mongoose.connect(uri);
}

// ─────────────────────────────────────────────
// State groups (mirrors scheduled-state-scan-background.mts)
// ─────────────────────────────────────────────

const STATE_GROUPS: Record<string, string[]> = {
  Northeast:    ["Borno", "Yobe", "Adamawa", "Gombe", "Bauchi", "Taraba"],
  Northwest:    ["Kaduna", "Kano", "Katsina", "Zamfara", "Sokoto", "Kebbi", "Jigawa"],
  NorthCentral: ["Plateau", "Benue", "Niger", "Kwara", "FCT", "Kogi", "Nasarawa"],
  Southwest:    ["Lagos", "Ogun", "Ondo", "Ekiti", "Osun", "Oyo"],
  SouthSouth:   ["Rivers", "Delta", "Edo", "Bayelsa", "Akwa Ibom", "Cross River"],
  Southeast:    ["Anambra", "Imo", "Abia", "Enugu", "Ebonyi"],
};

// ─────────────────────────────────────────────
// Source trust helpers (mirror gemini.ts)
// ─────────────────────────────────────────────

const TRUSTED_DOMAINS = new Set([
  "premiumtimesng.com", "thecable.ng", "gazettengr.com", "channelstv.com",
  "saharareporters.com", "punchng.com", "vanguardngr.com", "dailytrust.com",
  "humanglemedia.com", "guardian.ng", "dailypost.ng", "newscentral.africa",
  "arise.tv", "tvcnews.tv", "thisdaylive.com", "thenationonlineng.net",
  "leadership.ng", "sunnewsonline.com", "tribuneonlineng.com", "blueprint.ng",
  "businessday.ng", "thewhistler.ng", "icirnigeria.org", "ripplesnigeria.com",
  "dailynigerian.com", "prnigeria.com", "parallelfactsnews.com",
  // International wire services only — regional/Western outlets removed (never uniquely contribute)
  "aljazeera.com", "bbc.com", "bbc.co.uk", "apnews.com", "reuters.com",
  "acleddata.com", "network.zagazola.org", "en.wikipedia.org",
  "x.com", "twitter.com",
]);

const TRUSTED_PUBLISHERS = [
  "Premium Times", "The Cable", "Peoples Gazette", "Channels TV", "Sahara Reporters",
  "Punch", "Vanguard", "Daily Trust", "HumAngle", "Guardian Nigeria", "The Guardian Nigeria",
  "Daily Post", "News Central", "Arise News", "TVC News", "ThisDay", "The Nation",
  "Leadership", "Sun News", "Tribune", "Blueprint", "Business Day", "The Whistler",
  "ICIR", "Ripples Nigeria", "Daily Nigerian", "PRNigeria", "Parallel Facts", "Parallel Facts News",
  // International wire services only — CNN, DW, Sky News, VOA, France 24, AFP removed
  "Al Jazeera", "BBC", "Associated Press", "AP", "Reuters",
  "ACLED", "Zagazola", "Wikipedia", "Twitter", "X.com",
  "@BrantPhilip_", "BrantPhilip", "@Sazedek", "Sazedek",
];

const BANNED_SOURCES = [
  "truth nigeria", "aid to the church in need", "acn international",
  "the journal", "council on foreign relations", "cfr.org",
  "trust tv", "trusttv",
  "zenit news", "youtube", "blogspot", "wordpress.com", "medium.com",
  "allafrica", "reliefweb",
  "presstv", "press tv",
  "ahram online", "al-ahram", "eastleigh voice", "graphic online",
  "japan today", "japan times", "straits times",
];

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function isSourceTrusted(source: { url: string; publisher: string }): boolean {
  const pubLower = (source.publisher || "").toLowerCase();
  if (BANNED_SOURCES.some(b => pubLower.includes(b))) return false;
  if (source.url && BANNED_SOURCES.some(b => source.url.toLowerCase().includes(b))) return false;
  const domain = extractDomain(source.url);
  if (domain && TRUSTED_DOMAINS.has(domain)) return true;
  const parts = domain.split(".");
  if (parts.length > 2 && TRUSTED_DOMAINS.has(parts.slice(-2).join("."))) return true;
  if (pubLower && TRUSTED_PUBLISHERS.some(tp => pubLower.includes(tp.toLowerCase()))) return true;
  if (!source.publisher || pubLower === "unknown" || pubLower.length < 3) return false;
  return false;
}

// ─────────────────────────────────────────────
// Grounding URL resolution (mirrors gemini.ts resolveGroundingUrls)
// ─────────────────────────────────────────────

function normalizeText(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string, minLength = 4): string[] {
  const stopwords = new Set([
    "attack", "attacks", "kills", "kill", "killed", "gunmen", "bandits",
    "terrorists", "terrorist", "unknown", "armed", "group", "groups", "incident",
    "state", "community", "village", "security", "forces", "troops", "police",
    "soldiers", "residents", "people", "breaking", "news", "report", "nigeria", "nigerian",
  ]);
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => t.length >= minLength && !stopwords.has(t));
}

function resolveGroundingUrls(attacks: RawAttackData[], chunks: any[]): RawAttackData[] {
  if (chunks.length === 0) return attacks;

  return attacks.map(attack => ({
    ...attack,
    sources: attack.sources.map(source => {
      // If it already has a real URL, keep it
      if (!source.url.includes("grounding-api-redirect") && source.url.startsWith("http")) {
        return source;
      }

      // Score each grounding chunk against this source
      const sourceTitleTokens = new Set(tokenize(source.title, 3));
      const attackTokens = new Set([
        ...tokenize(attack.title, 4),
        ...tokenize(attack.location.state, 3),
        ...tokenize(attack.location.town, 3),
        ...tokenize(attack.group, 4),
      ]);

      const ranked = chunks
        .filter((c: any) => c?.web?.uri && c?.web?.title)
        .map((c: any) => {
          const chunkTokens = tokenize(c.web.title, 3);
          const titleOverlap = chunkTokens.filter(t => sourceTitleTokens.has(t)).length;
          const attackOverlap = chunkTokens.filter(t => attackTokens.has(t)).length;
          return { uri: c.web.uri, score: titleOverlap * 2 + attackOverlap };
        })
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      return { ...source, url: best && best.score >= 2 ? best.uri : "" };
    }),
  }));
}

// ─────────────────────────────────────────────
// Robust JSON extractor (handles Gemini prose wrapping)
// ─────────────────────────────────────────────

function extractJsonArray(text: string): RawAttackData[] {
  // Strip code fences
  let cleaned = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();

  // If the whole thing is valid JSON, use it
  try { return JSON.parse(cleaned); } catch { /* fall through */ }

  // Try to find the first [...] block
  const start = cleaned.indexOf("[");
  const end   = cleaned.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
  }

  // Gemini returned prose with no JSON array (e.g., "I found no incidents...")
  return [];
}

// ─────────────────────────────────────────────
// Sanitise / escape helpers
// ─────────────────────────────────────────────

function sanitize(str: string): string {
  if (!str) return "";
  return str.replace(/[${}]/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 5000);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────
// Prompt templates (reuse from gemini.ts patterns)
// ─────────────────────────────────────────────

const SOURCE_TIERS_PROMPT = `═══════════════════════════════════════════
SOURCE CREDIBILITY TIERS — STRICT RULES
═══════════════════════════════════════════

TIER 1 — PRIMARY INTELLIGENCE (search these FIRST):
- Twitter/X: @BrantPhilip_ (Brant Philip), @Sazedek (Sahara Reporters contributor)
- These accounts frequently break Nigerian security news before mainstream media

TIER 2 — TRUSTED & VERIFIED NEWS OUTLETS:
Nigerian Media:
  Premium Times, The Cable, Peoples Gazette, Channels TV, Sahara Reporters, Punch Nigeria,
  Vanguard Nigeria, Daily Trust, HumAngle, The Guardian Nigeria, Daily Post, News Central,
  Arise News, TVC News, ThisDay, The Nation, Leadership, Sun News, Tribune Online, Blueprint,
  Business Day, The Whistler, ICIR, Ripples Nigeria, Daily Nigerian, PRNigeria, Parallel Facts News

International Wire Services (major events only):
  Al Jazeera, BBC, Associated Press/AP, Reuters

Security Trackers:
  ACLED (acleddata.com), Zagazola Makama (network.zagazola.org)

Reference: Wikipedia (en.wikipedia.org)

TIER 3 — BANNED SOURCES (NEVER USE):
  "Truth Nigeria", "Trust TV", "TrustTV", "Aid to the Church in Need", "ACN International",
  "The Journal", "Council on Foreign Relations", "cfr.org", "ZENIT News",
  YouTube channels, AllAfrica.com, ReliefWeb, Press TV, allAfrica aggregators,
  blogs, WordPress sites, unknown regional outlets outside Nigeria.

⚠️ STRICT SOURCE ENFORCEMENT:
- Every incident MUST have at least one Tier 1 or Tier 2 source.
- Use EXACT publisher names (e.g. "Premium Times", "Channels TV"). Do NOT invent names.`;

const OUTPUT_SCHEMA = `Return your response as a valid JSON array. Each element:
{
  "title": "string",
  "description": "string",
  "date": "ISO 8601 datetime string",
  "location": { "state": "string", "lga": "string or Unknown", "town": "string or Unknown" },
  "group": "string",
  "casualties": { "killed": number|null, "injured": number|null, "kidnapped": number|null, "displaced": number|null },
  "civilianCasualties": true|false,
  "sources": [{ "url": "string", "title": "string", "publisher": "string" }],
  "status": "confirmed"|"unconfirmed"|"developing",
  "tags": ["string"]
}
RESPOND ONLY WITH THE JSON ARRAY. No markdown, no explanation, no code fences.`;

// ─────────────────────────────────────────────
// Gemini call
// ─────────────────────────────────────────────

async function fetchGapAttacks(
  states: string[],
  windowStart: Date,
  windowEnd: Date,
): Promise<RawAttackData[]> {
  const ai = createAI();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const startStr  = windowStart.toISOString().split("T")[0];
  const endStr    = windowEnd.toISOString().split("T")[0];
  const stateList = states.join(", ");
  const year      = windowStart.getFullYear();
  const monthStr  = startStr.slice(0, 7); // e.g. "2026-01"

  const stateSearchLines = states.map(s => [
    `"${s} attack ${year}"`,
    `"${s} soldiers killed ${year}"`,
    `"${s} military ambush ${year}"`,
    `"${s} kidnapping ${year}"`,
    `"${s} bandits ${year}"`,
    `"${s} gunmen ${year}"`,
    `"${s} IED ${year}"`,
    `"${s} security ${year}"`,
  ].join(" OR ")).map(line => `  - ${line}`).join("\n");

  const prompt = `You are a senior intelligence analyst conducting a HISTORICAL RECORDS review.
Today's actual date is ${new Date().toISOString().split("T")[0]}.
You must find incidents that occurred between ${startStr} and ${endStr} (inclusive).

TARGET STATES: ${stateList}

YOUR MISSION: Find ALL security incidents in these states during ${startStr} – ${endStr}, with special emphasis on:

1. ATTACKS ON SECURITY FORCES (non-civilian targets):
   - ISWAP/Boko Haram ambushes on military convoys or bases
   - IED explosions targeting military vehicles or patrols
   - Soldiers, army officers, or police killed/injured in combat
   - Attacks on police stations or army barracks
   - High-ranking officers killed in operations

2. ATTACKS WITH NO OR UNKNOWN CASUALTIES:
   - Raids or attacks where the casualty toll is unclear or unconfirmed
   - IED blasts with no immediately confirmed deaths
   - Kidnappings where the number of abductees is not yet reported
   - Communal clashes with "unconfirmed" casualties
   - Foiled attacks that were still reported as security incidents

3. ALL OTHER ATTACKS: kidnappings, bandit raids, village attacks, communal clashes,
   cult violence — include everything from the TARGET STATES in the date window.

MANDATORY SEARCH — execute for EACH state:
${stateSearchLines}

Also search:
  - "Nigeria soldiers killed ${monthStr}"
  - "Nigerian army ambush ${monthStr}"
  - "Operation Hadin Kai ${monthStr}"
  - "ISWAP attack ${monthStr}"
  - "Boko Haram attack ${monthStr}"
  - "Nigeria security incident ${monthStr}"

${SOURCE_TIERS_PROMPT}

═══════════════════════════════════════════
DEDUPLICATION
═══════════════════════════════════════════
- Consolidate multiple reports of the SAME incident into ONE entry with all sources combined.
- Use the HIGHEST reported casualty numbers when consolidating.

═══════════════════════════════════════════
DATA REQUIREMENTS
═══════════════════════════════════════════
1. Title: "[Attack type] in [Town], [State]"
2. Detailed description (attacker group, method, any known outcomes)
3. Date (ISO 8601). Use midnight UTC if only date is known: "YYYY-MM-DDT00:00:00.000Z"
   CRITICAL: The date MUST be within ${startStr} and ${endStr}.
4. Location — use EXACTLY one of these canonical state names:
   Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River,
   Delta, Ebonyi, Edo, Ekiti, Enugu, FCT, Gombe, Imo, Jigawa, Kaduna, Kano,
   Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo,
   Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara
   NEVER append "State". Use "FCT" for Abuja.
5. Armed group: "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN",
   "Herdsmen", "Cultists", "Unidentified Armed Group"
6. Casualties — count ONLY victims (civilians + security forces). NOT attackers. null if unknown.
7. "civilianCasualties": set TRUE whenever soldiers, officers, police, vigilantes, OR civilians
   were killed/injured/kidnapped/displaced. Set FALSE ONLY when the ONLY deaths were attackers.
   For incidents with no confirmed casualties, set TRUE if civilians or security forces were targeted.
8. Source URLs (real, working links)
9. Status: "confirmed" | "unconfirmed" | "developing"
10. Tags — include "military-attack" for army/police targets, "no-casualties" if zero/null.

ONLY return incidents from TARGET STATES dated between ${startStr} and ${endStr}.
Do NOT fabricate incidents. Return [] if genuinely nothing found.

${OUTPUT_SCHEMA}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });
  const text = response.text ?? "";

  // Resolve grounding redirect URLs using Gemini's metadata chunks
  const groundingChunks: any[] =
    (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];

  let raw = extractJsonArray(text);

  // Resolve grounding redirect URLs → real article URLs
  raw = resolveGroundingUrls(raw, groundingChunks);

  // Source trust filter (publisher / domain check — no HTTP fetching for historical articles)
  raw = raw
    .map(a => ({ ...a, sources: (a.sources || []).filter(isSourceTrusted) }))
    .filter(a => a.sources.length > 0);

  // Basic field completeness
  raw = raw.filter(a => a.title && a.description && a.date && a.location?.state && a.group);

  // Normalize state names
  raw = raw.map(a => ({
    ...a,
    location: { ...a.location, state: normalizeStateName(a.location.state) },
  }));

  // Date-window guard (allow ±1 day for timezone ambiguity)
  const wsMs = windowStart.getTime() - 86400000;
  const weMs = windowEnd.getTime()   + 86400000;
  raw = raw.filter(a => {
    const d = new Date(a.date).getTime();
    return !isNaN(d) && d >= wsMs && d <= weMs;
  });

  // State guard
  const stateSet = new Set(states.map(s => s.toLowerCase()));
  raw = raw.filter(a => stateSet.has(a.location.state.toLowerCase()));

  // URL usability filter — require a real, non-empty, usable URL on every source.
  // Empty strings from failed grounding resolution must be dropped here, not at the DB layer.
  raw = raw.map(a => ({
    ...a,
    sources: a.sources.filter(s => s.url && s.url.trim() !== "" && isUsableEvidenceUrl(s.url)),
  })).filter(a => a.sources.length > 0);

  return raw;
}

// ─────────────────────────────────────────────
// Ingest (mirrors ingest-attacks.ts logic exactly)
// ─────────────────────────────────────────────

const TITLE_STOPWORDS = new Set([
  "attack", "attacks", "kill", "kills", "killed", "gunmen", "armed",
  "village", "bandits", "dead", "soldiers", "police", "troops",
  "people", "residents", "suspected", "abducted", "kidnapped",
  "shooting", "open", "fire", "shot", "farmers", "worshippers",
]);

async function ingest(rawAttacks: RawAttackData[], label: string) {
  let saved = 0, merged = 0, errors = 0;

  for (const raw of rawAttacks) {
    try {
      const hash = generateAttackHash(raw);
      let existing = await Attack.findOne({ hash });

      if (!existing) {
        const attackDate = new Date(raw.date);
        const wStart = new Date(attackDate);
        wStart.setDate(wStart.getDate() - 2);
        wStart.setHours(0, 0, 0, 0);
        const wEnd = new Date(attackDate);
        wEnd.setDate(wEnd.getDate() + 2);
        wEnd.setHours(23, 59, 59, 999);

        const titleWords = raw.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(w => w.length > 3 && !TITLE_STOPWORDS.has(w))
          .slice(0, 5);

        const townWords = (raw.location.town || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(w => w.length > 2 && !["near", "and", "the", "from", "area"].includes(w));
        const townRegex = townWords.length > 0
          ? new RegExp(townWords.map(escapeRegex).join("|"), "i")
          : null;

        existing = await Attack.findOne({
          date: { $gte: wStart, $lte: wEnd },
          "location.state": { $regex: new RegExp(`^${escapeRegex(raw.location.state)}$`, "i") },
          $or: [
            { "location.town": { $regex: new RegExp(`^${escapeRegex(raw.location.town)}$`, "i") } },
            ...(townRegex ? [{
              "location.town": { $regex: townRegex },
              "location.lga": { $regex: new RegExp(`^${escapeRegex(raw.location.lga || "Unknown")}$`, "i") },
            }] : []),
            {
              "location.lga": { $regex: new RegExp(`^${escapeRegex(raw.location.lga || "Unknown")}$`, "i") },
              group: { $regex: new RegExp(`^${escapeRegex(raw.group)}$`, "i") },
            },
            ...(raw.casualties?.killed && raw.casualties.killed > 0 ? [{
              "location.lga": { $regex: new RegExp(`^${escapeRegex(raw.location.lga || "Unknown")}$`, "i") },
              "casualties.killed": {
                $gte: Math.floor(raw.casualties.killed * 0.5),
                $lte: Math.ceil(raw.casualties.killed * 1.5),
              },
            }] : []),
            ...(titleWords.length >= 2 ? [{
              title: {
                $regex: new RegExp(
                  titleWords.slice(0, 3).map(w => `(?=.*${escapeRegex(w)})`).join(""),
                  "i",
                ),
              },
              group: { $regex: new RegExp(`^${escapeRegex(raw.group)}$`, "i") },
            }] : []),
          ],
        });
      }

      if (existing) {
        console.log(`    [${label}] Duplicate → merging: "${raw.title}"`);
        try {
          const updates = await mergeIncidentStrategies(existing.toObject(), raw);
          await Attack.findByIdAndUpdate(existing._id, updates);
          merged++;
        } catch { /* merge errors are non-fatal */ }
        continue;
      }

      const attack = new Attack({
        title: sanitize(raw.title),
        description: sanitize(raw.description),
        date: new Date(raw.date),
        location: {
          state: normalizeStateName(sanitize(raw.location.state)),
          lga: sanitize(raw.location.lga || "Unknown"),
          town: sanitize(raw.location.town || "Unknown"),
        },
        group: sanitize(raw.group),
        casualties: {
          killed: raw.casualties?.killed ?? null,
          injured: raw.casualties?.injured ?? null,
          kidnapped: raw.casualties?.kidnapped ?? null,
          displaced: raw.casualties?.displaced ?? null,
        },
        sources: (raw.sources || []).map(s => ({
          url: sanitize(s.url),
          title: sanitize(s.title || ""),
          publisher: sanitize(s.publisher || ""),
        })),
        status: raw.status || "unconfirmed",
        tags: (raw.tags || []).map(sanitize),
        hash,
      });

      await attack.save();
      saved++;
      console.log(`    [${label}] Saved: ${raw.title}`);
    } catch (err: any) {
      if (err?.code === 11000) {
        merged++;
      } else {
        errors++;
        console.error(`    [${label}] Error:`, err?.message || err);
      }
    }
  }

  return { saved, merged, errors };
}

// ─────────────────────────────────────────────
// Date-window generator (14-day chunks per month)
// ─────────────────────────────────────────────

function buildWindows(year: number, month: number, chunkDays = 14) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay  = new Date(Date.UTC(year, month, 0));
  const today    = new Date();
  const cap      = lastDay > today ? today : lastDay;

  const windows: { start: Date; end: Date }[] = [];
  const cursor = new Date(firstDay);

  while (cursor <= cap) {
    const wEnd = new Date(cursor);
    wEnd.setUTCDate(wEnd.getUTCDate() + chunkDays - 1);
    if (wEnd > cap) wEnd.setTime(cap.getTime());
    windows.push({ start: new Date(cursor), end: new Date(wEnd) });
    cursor.setUTCDate(cursor.getUTCDate() + chunkDays);
  }

  return windows;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

// 96-hour day-by-day scan: Apr 14–18 2026 (5 days × 6 state groups = 30 targeted calls)
const MONTHS: never[] = [];
const CUSTOM_WINDOWS = [
  { start: new Date("2026-04-14T00:00:00Z"), end: new Date("2026-04-14T23:59:59Z") },
  { start: new Date("2026-04-15T00:00:00Z"), end: new Date("2026-04-15T23:59:59Z") },
  { start: new Date("2026-04-16T00:00:00Z"), end: new Date("2026-04-16T23:59:59Z") },
  { start: new Date("2026-04-17T00:00:00Z"), end: new Date("2026-04-17T23:59:59Z") },
  { start: new Date("2026-04-18T00:00:00Z"), end: new Date("2026-04-18T23:59:59Z") },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  await connectDB();
  console.log("✓ Connected to MongoDB\n");

  let grand = { saved: 0, merged: 0, errors: 0 };

  // Build the full list of windows: monthly chunks + any custom windows
  const allWindows: { label: string; start: Date; end: Date }[] = [];

  for (const { label, year, month } of MONTHS) {
    for (const w of buildWindows(year, month)) {
      allWindows.push({ label, ...w });
    }
  }

  for (const w of CUSTOM_WINDOWS) {
    const label = `${w.start.toISOString().split("T")[0]} → ${w.end.toISOString().split("T")[0]}`;
    allWindows.push({ label, ...w });
  }

  for (const { label, start, end } of allWindows) {
    const windowLabel = `${start.toISOString().split("T")[0]} → ${end.toISOString().split("T")[0]}`;
    console.log(`\n${"═".repeat(60)}`);
    console.log(`SCAN: ${label}`);
    console.log(`${"═".repeat(60)}`);
    console.log(`  Window: ${windowLabel}`);

    // Run all 6 state groups in parallel for this window
    const groupResults = await Promise.allSettled(
      Object.entries(STATE_GROUPS).map(async ([region, states]) => {
        const callLabel = `${label}/${region}`;
        try {
          const raw = await fetchGapAttacks(states, start, end);
          console.log(`  [${region}] Gemini returned ${raw.length} candidate(s)`);
          if (raw.length === 0) return { region, saved: 0, merged: 0, errors: 0 };
          return { region, ...(await ingest(raw, callLabel)) };
        } catch (err: any) {
          console.error(`  [${region}] Failed:`, err?.message || err);
          return { region, saved: 0, merged: 0, errors: 1 };
        }
      }),
    );

      for (const r of groupResults) {
        if (r.status === "fulfilled") {
          const { region, saved, merged, errors } = r.value;
          grand.saved  += saved;
          grand.merged += merged;
          grand.errors += errors;
          if (saved > 0 || merged > 0) {
            console.log(`  [${region}] saved: ${saved}, merged: ${merged}, errors: ${errors}`);
          }
        } else {
          grand.errors++;
          console.error("  Group promise rejected:", r.reason);
        }
      }

    // Brief pause between windows to respect API rate limits
    await delay(4000);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`HISTORICAL GAP SCAN COMPLETE`);
  console.log(`Total saved : ${grand.saved}`);
  console.log(`Total merged: ${grand.merged}`);
  console.log(`Total errors: ${grand.errors}`);
  console.log(`${"═".repeat(60)}\n`);

  process.exit(0);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
