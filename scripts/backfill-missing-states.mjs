/**
 * One-time backfill: Gombe, Nasarawa, Bayelsa — Jan 1 to Apr 6 2026
 *
 * Strategy: 4 monthly Gemini calls (all 3 states per call) → save to MongoDB.
 * Respects the existing hash-based + fuzzy dedup so nothing is double-saved.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(ROOT, ".env.local");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, "")];
    })
);
Object.assign(process.env, envVars);

const { GoogleGenerativeAI } = await import("@google/generative-ai");
const mongoose = (await import("mongoose")).default;

// ── Constants ─────────────────────────────────────────────────────────────────
const STATES = ["Gombe", "Nasarawa", "Bayelsa"];
const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Monthly chunks: Jan–Mar full months + Apr 1-6
const CHUNKS = [
  { label: "January 2026",  from: "2026-01-01", to: "2026-01-31" },
  { label: "February 2026", from: "2026-02-01", to: "2026-02-28" },
  { label: "March 2026",    from: "2026-03-01", to: "2026-03-31" },
  { label: "April 1–6 2026",from: "2026-04-01", to: "2026-04-06" },
];

const TRUSTED_DOMAINS = new Set([
  "premiumtimesng.com","thecable.ng","gazettengr.com","channelstv.com",
  "saharareporters.com","punchng.com","vanguardngr.com","dailytrust.com",
  "humanglemedia.com","guardian.ng","dailypost.ng","newscentral.africa",
  "arise.tv","tvcnews.tv","thisdaylive.com","thenationonlineng.net",
  "leadership.ng","sunnewsonline.com","tribuneonlineng.com","blueprint.ng",
  "businessday.ng","thewhistler.ng","icirnigeria.org","ripplesnigeria.com",
  "dailynigerian.com","prnigeria.com","parallelfactsnews.com","crispng.com",
  "aljazeera.com","dw.com","news.sky.com","bbc.com","bbc.co.uk",
  "cnn.com","france24.com","voanews.com","apnews.com","reuters.com",
  "acleddata.com","network.zagazola.org","zagazola.org","en.wikipedia.org",
  "x.com","twitter.com",
]);

const TRUSTED_PUBLISHERS = [
  "Premium Times","The Cable","Peoples Gazette","Channels TV","Sahara Reporters",
  "Punch","Vanguard","Daily Trust","HumAngle","Guardian Nigeria","The Guardian Nigeria",
  "Daily Post","News Central","Arise News","TVC News","ThisDay","The Nation",
  "Leadership","Sun News","Tribune","Blueprint","Business Day","The Whistler",
  "ICIR","Ripples Nigeria","Daily Nigerian","PRNigeria","Parallel Facts","Parallel Facts News",
  "Al Jazeera","Deutsche Welle","DW","Sky News","BBC","CNN","France 24",
  "Voice of America","VOA","Associated Press","AP","AFP","Reuters",
  "ACLED","Zagazola","Wikipedia","Twitter","X.com",
];

const BANNED = [
  "truth nigeria","aid to the church in need","acn international",
  "the journal","council on foreign relations","cfr.org","trust tv",
  "zenit news","youtube","blogspot","wordpress.com","medium.com",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function isTrusted(source) {
  const pub = (source.publisher || "").toLowerCase();
  if (BANNED.some(b => pub.includes(b))) return false;
  if (source.url && BANNED.some(b => source.url.toLowerCase().includes(b))) return false;
  const dom = extractDomain(source.url);
  if (TRUSTED_DOMAINS.has(dom)) return true;
  const parts = dom.split(".");
  if (parts.length > 2 && TRUSTED_DOMAINS.has(parts.slice(-2).join("."))) return true;
  if (pub && TRUSTED_PUBLISHERS.some(tp => pub.includes(tp.toLowerCase()))) return true;
  return false;
}

function sanitize(str) {
  if (!str) return "";
  return str.replace(/[${}]/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, 5000);
}

/** Coerce casualty field: return integer if numeric, else null */
function sanitizeCasualty(val) {
  if (val === null || val === undefined) return null;
  const n = typeof val === "string" ? parseInt(val, 10) : Number(val);
  return Number.isFinite(n) ? n : null;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeState(raw) {
  if (!raw) return "Unknown";
  let s = raw.trim().replace(/\s+state$/i, "").trim();
  const aliases = { "nassarawa": "Nasarawa", "nassarawa state": "Nasarawa", "federal capital territory": "FCT", "abuja": "FCT" };
  if (aliases[s.toLowerCase()]) return aliases[s.toLowerCase()];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateHash(attack) {
  const dateStr = new Date(attack.date).toISOString().split("T")[0];
  const state = normalizeState(attack.location.state).toLowerCase();
  const town = (attack.location.town || "").toLowerCase().trim();
  const group = (attack.group || "").toLowerCase().trim();
  return crypto.createHash("sha256").update(`${dateStr}|${state}|${town}|${group}`).digest("hex");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── MongoDB Attack model ──────────────────────────────────────────────────────
const AttackSchema = new mongoose.Schema({
  title: String, description: String, date: Date,
  location: { state: String, lga: String, town: String, coordinates: { lat: Number, lng: Number } },
  group: String,
  casualties: { killed: Number, injured: Number, kidnapped: Number, displaced: Number },
  sources: [{ url: String, title: String, publisher: String }],
  status: { type: String, enum: ["confirmed","unconfirmed","developing"], default: "unconfirmed" },
  tags: [String],
  hash: { type: String, unique: true },
  _deleted: { type: Boolean, default: false },
  _deletedReason: String,
}, { timestamps: true });

const Attack = mongoose.models.Attack || mongoose.model("Attack", AttackSchema);

// ── Gemini search ─────────────────────────────────────────────────────────────
async function searchStatesForPeriod(states, fromDate, toDate, label) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    tools: [{ googleSearch: {} }],
  });

  const stateList = states.join(", ");
  const year = new Date(fromDate).getFullYear();
  const searchLines = states.map(s =>
    `  • "${s} attack ${year}" OR "${s} kidnapping ${year}" OR "${s} bandits ${year}" OR "${s} gunmen ${year}" OR "${s} security ${year}"`
  ).join("\n");

  const prompt = `You are an intelligence analyst reconstructing a historical security incident database for Nigeria.

TASK: Find ALL documented security incidents (terrorist attacks, bandit attacks, kidnappings, communal clashes, cult violence, IED explosions, militant activity) that occurred in the following Nigerian states between ${fromDate} and ${toDate}:

TARGET STATES: ${stateList}

This is a HISTORICAL BACKFILL — search for news articles published about events that occurred within ${fromDate} to ${toDate}. You may search for articles published after the event date as long as they report on events within the date range.

MANDATORY SEARCHES — execute each of these individually:
${searchLines}

Also search:
${states.map(s => `  • site:prnigeria.com "${s}" ${year}\n  • site:dailypost.ng "${s}" ${year}\n  • site:vanguardngr.com "${s}" ${year}`).join("\n")}

TRUSTED SOURCES ONLY:
Premium Times, The Cable, Channels TV, Sahara Reporters, Punch Nigeria, Vanguard Nigeria, Daily Trust, HumAngle, The Guardian Nigeria, Daily Post, PRNigeria, Peoples Gazette, Ripples Nigeria, Daily Nigerian, Parallel Facts News, News Central, Arise News, TVC News, ThisDay, The Nation, Leadership, Sun News, Tribune Online, Blueprint, ICIR, The Whistler, Business Day, Al Jazeera, BBC, CNN, Reuters, AP, VOA, France 24, DW, ACLED, Zagazola Makama, Twitter/@BrantPhilip_, Twitter/@Sazedek.

DO NOT include incidents from sources not on this list. DO NOT fabricate incidents.

DEDUPLICATION: Combine multiple reports of the same incident into ONE entry with all sources listed.

CASUALTIES: Count only civilians and security forces (police, army, vigilantes). NOT attackers. Use null if unknown.

LOCATION: Use exact canonical state names: Gombe, Nasarawa, Bayelsa. Include LGA and town.

GROUP: Use: "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN", "Herdsmen", "Cultists", "Unidentified Armed Group"

ONLY return incidents from the TARGET STATES listed above and ONLY from the date range ${fromDate} to ${toDate}.

Return a JSON array (no markdown, no explanation):
[{
  "title": "[Attack type] in [Town], [State]",
  "description": "string",
  "date": "ISO 8601 (use midnight if time unknown)",
  "location": { "state": "Gombe|Nasarawa|Bayelsa", "lga": "string", "town": "string" },
  "group": "string",
  "casualties": { "killed": number|null, "injured": number|null, "kidnapped": number|null, "displaced": number|null },
  "civilianCasualties": true|false,
  "sources": [{ "url": "string", "title": "string", "publisher": "string" }],
  "status": "confirmed"|"unconfirmed"|"developing",
  "tags": ["string"]
}]`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let attacks = JSON.parse(cleaned);

  // Resolve grounding URLs
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  if (groundingChunks.length > 0) {
    attacks = attacks.map(attack => ({
      ...attack,
      sources: attack.sources.map(source => {
        if (!source.url?.includes("grounding-api-redirect") && source.url?.startsWith("http")) return source;
        const match = groundingChunks.find(chunk =>
          chunk.web?.title && source.title &&
          (chunk.web.title.toLowerCase().includes(source.title.toLowerCase()) ||
           source.title.toLowerCase().includes(chunk.web.title.toLowerCase()))
        );
        return { ...source, url: match?.web?.uri || `https://www.google.com/search?q=${encodeURIComponent(attack.title)}` };
      }),
    }));
  }

  // Filter trusted sources
  attacks = attacks
    .map(a => ({ ...a, sources: (a.sources || []).filter(isTrusted) }))
    .filter(a => a.sources.length > 0);

  // Normalize states and keep only target states
  const stateSet = new Set(states.map(s => s.toLowerCase()));
  attacks = attacks
    .map(a => ({ ...a, location: { ...a.location, state: normalizeState(a.location.state) } }))
    .filter(a => stateSet.has(a.location.state.toLowerCase()))
    .filter(a => a.title && a.description && a.date && a.location?.state && a.group);

  console.log(`  [${label}] Gemini found ${attacks.length} incident(s) after filtering`);
  return attacks;
}

// ── Save / merge ──────────────────────────────────────────────────────────────
const TITLE_STOPWORDS = new Set([
  "attack","attacks","kill","kills","killed","gunmen","armed","village",
  "bandits","dead","soldiers","police","troops","people","residents",
  "suspected","abducted","kidnapped","shooting","open","fire","shot",
]);

async function saveAttacks(attacks, label) {
  let saved = 0, merged = 0, skipped = 0;

  for (const raw of attacks) {
    const hash = generateHash(raw);

    // Hash dedup
    let existing = await Attack.findOne({ hash });

    // Fuzzy dedup if no hash match
    if (!existing) {
      const d = new Date(raw.date);
      const wStart = new Date(d); wStart.setDate(d.getDate() - 2); wStart.setHours(0,0,0,0);
      const wEnd   = new Date(d); wEnd.setDate(d.getDate() + 2);   wEnd.setHours(23,59,59,999);

      const titleWords = raw.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
        .filter(w => w.length > 3 && !TITLE_STOPWORDS.has(w)).slice(0, 5);

      const townWords = (raw.location.town || "").toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
        .filter(w => w.length > 2 && !["near","and","the","from","area"].includes(w));
      const townRegex = townWords.length > 0
        ? new RegExp(townWords.map(escapeRegex).join("|"), "i") : null;

      existing = await Attack.findOne({
        date: { $gte: wStart, $lte: wEnd },
        "location.state": { $regex: new RegExp(`^${escapeRegex(raw.location.state)}$`, "i") },
        $or: [
          { "location.town": { $regex: new RegExp(`^${escapeRegex(raw.location.town || "")}$`, "i") } },
          ...(townRegex ? [{ "location.town": { $regex: townRegex }, "location.lga": { $regex: new RegExp(`^${escapeRegex(raw.location.lga || "Unknown")}$`, "i") } }] : []),
          { "location.lga": { $regex: new RegExp(`^${escapeRegex(raw.location.lga || "Unknown")}$`, "i") }, group: { $regex: new RegExp(`^${escapeRegex(raw.group)}$`, "i") } },
          ...(raw.casualties?.killed > 0 ? [{
            "location.lga": { $regex: new RegExp(`^${escapeRegex(raw.location.lga || "Unknown")}$`, "i") },
            "casualties.killed": { $gte: Math.floor(raw.casualties.killed * 0.5), $lte: Math.ceil(raw.casualties.killed * 1.5) },
          }] : []),
          ...(titleWords.length >= 2 ? [{
            title: { $regex: new RegExp(titleWords.slice(0,3).map(w => `(?=.*${escapeRegex(w)})`).join(""), "i") },
            group: { $regex: new RegExp(`^${escapeRegex(raw.group)}$`, "i") },
          }] : []),
        ],
      });
    }

    if (existing) {
      // Merge sources
      const sourceMap = new Map();
      [...(existing.sources || []), ...(raw.sources || [])].forEach(s => {
        const key = s.url.trim().replace(/\/$/, "");
        if (!sourceMap.has(key)) sourceMap.set(key, s);
      });
      // Merge casualties (take max)
      const mergedCas = {
        killed:    Math.max(existing.casualties?.killed    ?? 0, sanitizeCasualty(raw.casualties?.killed)    ?? 0) || null,
        injured:   Math.max(existing.casualties?.injured   ?? 0, sanitizeCasualty(raw.casualties?.injured)   ?? 0) || null,
        kidnapped: Math.max(existing.casualties?.kidnapped ?? 0, sanitizeCasualty(raw.casualties?.kidnapped) ?? 0) || null,
        displaced: Math.max(existing.casualties?.displaced ?? 0, sanitizeCasualty(raw.casualties?.displaced) ?? 0) || null,
      };
      await Attack.findByIdAndUpdate(existing._id, {
        sources: Array.from(sourceMap.values()),
        casualties: mergedCas,
        ...(raw.status === "confirmed" ? { status: "confirmed" } : {}),
      });
      console.log(`    MERGED  : ${raw.title}`);
      merged++;
      continue;
    }

    try {
      await Attack.create({
        title:       sanitize(raw.title),
        description: sanitize(raw.description),
        date:        new Date(raw.date),
        location: {
          state: sanitize(normalizeState(raw.location.state)),
          lga:   sanitize(raw.location.lga   || "Unknown"),
          town:  sanitize(raw.location.town  || "Unknown"),
        },
        group:    sanitize(raw.group),
        casualties: {
          killed:    sanitizeCasualty(raw.casualties?.killed),
          injured:   sanitizeCasualty(raw.casualties?.injured),
          kidnapped: sanitizeCasualty(raw.casualties?.kidnapped),
          displaced: sanitizeCasualty(raw.casualties?.displaced),
        },
        sources: (raw.sources || []).map(s => ({
          url:       sanitize(s.url),
          title:     sanitize(s.title     || ""),
          publisher: sanitize(s.publisher || ""),
        })),
        status: raw.status || "unconfirmed",
        tags:   (raw.tags || []).map(sanitize),
        hash,
      });
      console.log(`    SAVED   : ${raw.title}`);
      saved++;
    } catch (err) {
      if (err.code === 11000) {
        console.log(`    SKIP(dup): ${raw.title}`);
        skipped++;
      } else {
        console.error(`    ERROR   : ${raw.title} —`, err.message);
      }
    }
  }

  return { saved, merged, skipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("BACKFILL: Gombe, Nasarawa, Bayelsa — Jan 1 to Apr 6 2026");
console.log("=".repeat(60));

await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB\n");

let totalSaved = 0, totalMerged = 0, totalSkipped = 0;

for (const chunk of CHUNKS) {
  console.log(`\n── ${chunk.label} ──────────────────────────────`);

  try {
    const attacks = await searchStatesForPeriod(
      STATES, chunk.from, chunk.to, chunk.label,
    );

    if (attacks.length === 0) {
      console.log("  No incidents found for this period.");
    } else {
      const { saved, merged, skipped } = await saveAttacks(attacks, chunk.label);
      totalSaved   += saved;
      totalMerged  += merged;
      totalSkipped += skipped;
    }
  } catch (err) {
    console.error(`  ERROR during ${chunk.label}:`, err.message);
  }

  // Pause between Gemini calls to avoid rate limiting
  if (chunk !== CHUNKS[CHUNKS.length - 1]) {
    console.log("  Waiting 8s before next chunk...");
    await sleep(8000);
  }
}

console.log("\n" + "=".repeat(60));
console.log(`BACKFILL COMPLETE`);
console.log(`  Saved  : ${totalSaved}`);
console.log(`  Merged : ${totalMerged}`);
console.log(`  Skipped: ${totalSkipped}`);
console.log("=".repeat(60));

await mongoose.disconnect();
