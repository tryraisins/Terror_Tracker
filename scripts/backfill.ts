import { config } from "dotenv";
config({ path: ".env.local" });

import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import mongoose from "mongoose";

// Duplicate of required models and libs since tsx with relative imports is easiest.
import Attack from "../src/lib/models/Attack";
import { generateAttackHash, mergeIncidentStrategies } from "../src/lib/gemini";
import { normalizeStateName } from "../src/lib/normalize-state";

// Setup mongoose connection locally in script:
async function connectDB() {
  if (mongoose.connections[0].readyState) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  await mongoose.connect(MONGODB_URI);
}

function sanitizeString(str: string): string {
  if (!str) return "";
  return str
    .replace(/[${}]/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 5000);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDateInput(input: string, label: string): Date {
  const normalized = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${label} must use YYYY-MM-DD format`);
  }

  const date = new Date(`${normalized}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid date`);
  }

  return date;
}

function generateAnchorDates(startDate: Date, endDate: Date): Date[] {
  if (startDate > endDate) {
    throw new Error("Backfill start date must be on or before the end date");
  }

  const anchors: Date[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    anchors.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 4);
  }

  const lastAnchor = anchors[anchors.length - 1];
  if (!lastAnchor || lastAnchor.toISOString().split("T")[0] !== endDate.toISOString().split("T")[0]) {
    anchors.push(new Date(endDate));
  }

  return anchors.sort((a, b) => b.getTime() - a.getTime());
}

function getConfiguredAnchorDates(): Date[] {
  const startArg = process.argv.find((arg) => arg.startsWith("--start="));
  const endArg = process.argv.find((arg) => arg.startsWith("--end="));

  const configuredStart = startArg
    ? startArg.slice("--start=".length)
    : process.env.BACKFILL_START_DATE;
  const configuredEnd = endArg
    ? endArg.slice("--end=".length)
    : process.env.BACKFILL_END_DATE;

  if (configuredStart || configuredEnd) {
    if (!configuredStart || !configuredEnd) {
      throw new Error("Both start and end dates are required when configuring a backfill range");
    }

    return generateAnchorDates(
      parseDateInput(configuredStart, "Backfill start date"),
      parseDateInput(configuredEnd, "Backfill end date")
    );
  }

  return [
    new Date("2026-02-08T12:00:00Z"),
    new Date("2026-02-04T12:00:00Z"),
    new Date("2026-01-31T12:00:00Z"),
    new Date("2026-01-27T12:00:00Z"),
    new Date("2026-01-23T12:00:00Z"),
    new Date("2026-01-19T12:00:00Z"),
    new Date("2026-01-15T12:00:00Z"),
    new Date("2026-01-11T12:00:00Z"),
    new Date("2026-01-07T12:00:00Z"),
    new Date("2026-01-03T12:00:00Z"),
  ];
}

// Custom fetch for specific dates
async function fetchBackfillAttacks(targetDate: Date) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} } as any],
  });

  const todayStr = targetDate.toISOString().split("T")[0];
  const threeDaysAgo = new Date(targetDate);
  threeDaysAgo.setDate(targetDate.getDate() - 3);
  const fourDaysAgo = new Date(targetDate);
  fourDaysAgo.setDate(targetDate.getDate() - 4);
  const yesterdayDate = new Date(targetDate.getTime() - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];
  const fourDaysAgoStr = fourDaysAgo.toISOString().split("T")[0];

  const prompt = `You are an intelligence analyst specializing in security incidents in Nigeria.
The current simulated date and time is ${targetDate.toISOString()}.

YOUR PRIMARY MISSION: Search for ALL terrorist attacks, insurgent attacks, bandit attacks, militant attacks, and attacks by unknown gunmen in Nigeria.

SEARCH STRATEGY — FOLLOW THIS ORDER:
1. FIRST: Search for any attacks that happened TODAY (${todayStr}). Search each Tier 2 news site individually for today's articles.
2. SECOND: Search for attacks from YESTERDAY (${yesterdayStr}).
3. THIRD: Search for any remaining attacks from the past 4 days (${fourDaysAgoStr} to ${todayStr}) that you haven't already found.

Do NOT stop after finding just 1 or 2 incidents. Be thorough — Nigeria typically has multiple security incidents per day across different states. Search multiple news sources independently to ensure comprehensive coverage.

═══════════════════════════════════════════
SOURCE CREDIBILITY TIERS — STRICT RULES
═══════════════════════════════════════════

TIER 1 — PRIMARY INTELLIGENCE (search these FIRST):
- Twitter/X: @BrantPhilip_ (Brant Philip), @Sazedek (Sahara Reporters contributor)
- These accounts frequently break Nigerian security news before mainstream media

TIER 2 — TRUSTED & VERIFIED NEWS OUTLETS (reports MUST come from these):
Nigerian Media:
  Premium Times (premiumtimesng.com), The Cable (thecable.ng), Peoples Gazette (gazettengr.com), Channels TV (channelstv.com), Sahara Reporters (saharareporters.com), Punch Nigeria (punchng.com), Vanguard Nigeria (vanguardngr.com), Daily Trust (dailytrust.com), HumAngle (humanglemedia.com), The Guardian Nigeria (guardian.ng), Daily Post (dailypost.ng), News Central (newscentral.africa), Arise News (arise.tv), TVC News (tvcnews.tv), ThisDay (thisdaylive.com), The Nation (thenationonlineng.net), Leadership (leadership.ng), Sun News (sunnewsonline.com), Tribune Online (tribuneonlineng.com), Blueprint (blueprint.ng), Business Day (businessday.ng), The Whistler (thewhistler.ng), ICIR (icirnigeria.org), Ripples Nigeria (ripplesnigeria.com), Daily Nigerian (dailynigerian.com), PRNigeria (prnigeria.com), Parallel Facts News (parallelfactsnews.com)

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
- If you cannot identify the publisher of a source URL, DO NOT include that source.

═══════════════════════════════════════════
DEDUPLICATION — CRITICAL
═══════════════════════════════════════════
- If multiple news outlets report the SAME incident (same attack, same location, same date), consolidate them into ONE entry with multiple sources.
- Do NOT create separate entries for the same attack just because different outlets covered it.
- Two reports are the SAME incident if they describe the same type of attack, in the same town/LGA, on the same date, even if casualty numbers differ slightly.
- When consolidating, use the HIGHEST reported casualty numbers and combine all source URLs.

═══════════════════════════════════════════
DATA REQUIREMENTS
═══════════════════════════════════════════
For each incident found, provide:
1. A clear, concise title (format: "[Attack type] in [Town], [State]")
2. Detailed description of what happened
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
5. Armed group responsible. Use standardized names: "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN", "Herdsmen", "Unidentified Armed Group"
6. Casualties: count ONLY civilians and security forces (soldiers, police, vigilantes). NEVER count terrorists/attackers/insurgents/bandits. Use null if not reported.
7. Source URLs — direct links to articles or tweets. Every URL must be real and working.
8. Status: "confirmed" (multiple reliable sources), "unconfirmed" (single source), "developing" (ongoing)
9. Tags (e.g., "boko-haram", "northeast", "kidnapping", "iswap", "banditry")

═══════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════
- ONLY include REAL, VERIFIED incidents. Do NOT fabricate or hallucinate any attacks.
- If you cannot find any recent attacks, return an empty array [].
- CASUALTY COUNTING: ONLY count dead/injured civilians and security forces. If an incident ONLY resulted in attacker deaths (e.g., "30 terrorists killed"), DO NOT include it.
- Set "civilianCasualties" to true only if civilians or security forces were killed/injured/kidnapped/displaced.
- Be specific about locations — always include state AND town/village name.
- Distinguish carefully between different armed groups.

Return your response as a valid JSON array. Each element must follow this exact schema:
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

RESPOND ONLY WITH THE JSON ARRAY. No markdown, no explanation, no code fences.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```(json)?\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let attacks = JSON.parse(cleanedText);

    // Source validation ...
    const TRUSTED_DOMAINS = new Set(["premiumtimesng.com", "thecable.ng", "gazettengr.com", "channelstv.com", "saharareporters.com", "punchng.com", "vanguardngr.com", "dailytrust.com", "humanglemedia.com", "guardian.ng", "dailypost.ng", "newscentral.africa", "arise.tv", "tvcnews.tv", "thisdaylive.com", "thenationonlineng.net", "leadership.ng", "sunnewsonline.com", "tribuneonlineng.com", "blueprint.ng", "businessday.ng", "thewhistler.ng", "icirnigeria.org", "ripplesnigeria.com", "dailynigerian.com", "prnigeria.com", "parallelfactsnews.com", "aljazeera.com", "dw.com", "news.sky.com", "bbc.com", "bbc.co.uk", "cnn.com", "france24.com", "voanews.com", "apnews.com", "reuters.com", "acleddata.com", "network.zagazola.org", "en.wikipedia.org", "x.com", "twitter.com"]);
    const TRUSTED_PUBLISHERS = ["Premium Times", "The Cable", "Peoples Gazette", "Channels TV", "Sahara Reporters", "Punch", "Vanguard", "Daily Trust", "HumAngle", "Guardian Nigeria", "The Guardian Nigeria", "Daily Post", "News Central", "Arise News", "TVC News", "ThisDay", "The Nation", "Leadership", "Sun News", "Tribune", "Blueprint", "Business Day", "The Whistler", "ICIR", "Ripples Nigeria", "Daily Nigerian", "PRNigeria", "Parallel Facts", "Parallel Facts News", "Al Jazeera", "Deutsche Welle", "DW", "Sky News", "BBC", "CNN", "France 24", "Voice of America", "VOA", "Associated Press", "AP", "AFP", "Reuters", "ACLED", "Zagazola", "Wikipedia", "Twitter", "X.com", "@BrantPhilip_", "BrantPhilip", "@Sazedek", "Sazedek"];
    const BANNED_SOURCES = ["truth nigeria", "aid to the church in need", "acn international", "the journal", "council on foreign relations", "cfr.org", "trust tv", "zenit news", "youtube", "blogspot", "wordpress.com", "medium.com"];
    
    function extractDomain(url: string) {
        try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
    }
    
    function isSourceTrusted(source: any) {
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

    attacks = attacks.map((attack: any) => ({
      ...attack,
      sources: attack.sources.filter(isSourceTrusted),
    })).filter((attack: any) => attack.sources.length > 0);

    attacks = attacks.map((attack: any) => ({
      ...attack,
      location: {
        ...attack.location,
        state: normalizeStateName(attack.location.state),
      },
    }));

    return attacks.filter(
      (attack: any) =>
        attack.title && attack.description && attack.date && attack.location?.state && attack.group
    );
  } catch (error) {
    throw error;
  }
}

async function runBackfill() {
  await connectDB();
  console.log("[BACKFILL] Connected to Database");

  const anchorDates = getConfiguredAnchorDates();

  console.log(
    `[BACKFILL] Using ${anchorDates.length} anchor date(s): ${anchorDates
      .map((date) => date.toISOString().split("T")[0])
      .join(", ")}`
  );

  for (const date of anchorDates) {
    console.log(`\n===========================================`);
    console.log(`[BACKFILL] Fetching for anchor date: ${date.toISOString().split("T")[0]}`);
    try {
      const rawAttacks = await fetchBackfillAttacks(date);
      console.log(`[BACKFILL] Found ${rawAttacks.length} parsing candidates`);

      if (rawAttacks.length === 0) continue;

      const filteredAttacks = rawAttacks.filter((attack: any) => {
        if (attack.civilianCasualties === false) return false;
        const { killed, injured, kidnapped, displaced } = attack.casualties || {};
        const hasCasualties = (killed && killed > 0) || (injured && injured > 0) || 
                              (kidnapped && kidnapped > 0) || (displaced && displaced > 0);
        if (!hasCasualties && attack.status === "developing") return true;
        return true;
      });

      console.log(`[BACKFILL] After filtering: ${filteredAttacks.length}`);

      let saved = 0, merged = 0, errors = 0;

      for (const rawAttack of filteredAttacks) {
        try {
          const hash = generateAttackHash(rawAttack);
          let existing = await (Attack as any).findOne({ hash });

          if (!existing) {
             const attackDate = new Date(rawAttack.date);
             const windowStart = new Date(attackDate);
             windowStart.setDate(windowStart.getDate() - 2);
             windowStart.setHours(0, 0, 0, 0);
             const windowEnd = new Date(attackDate);
             windowEnd.setDate(windowEnd.getDate() + 2);
             windowEnd.setHours(23, 59, 59, 999);

             const titleWords = rawAttack.title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
             const townWords = (rawAttack.location.town || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w: string) => w.length > 2 && !["near", "and", "the", "from", "area"].includes(w));
             const townRegex = townWords.length > 0 ? new RegExp(townWords.map(escapeRegex).join("|"), "i") : null;

             existing = await (Attack as any).findOne({
               date: { $gte: windowStart, $lte: windowEnd },
               "location.state": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.state)}$`, "i") },
               $or: [
                 { "location.town": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.town)}$`, "i") } },
                 ...(townRegex ? [{
                   "location.town": { $regex: townRegex },
                   "location.lga": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.lga || "Unknown")}$`, "i") },
                 }] : []),
                 {
                   "location.lga": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.lga || "Unknown")}$`, "i") },
                   group: { $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i") },
                 },
                 ...(rawAttack.casualties?.killed && rawAttack.casualties.killed > 0 ? [{
                   "location.lga": { $regex: new RegExp(`^${escapeRegex(rawAttack.location.lga || "Unknown")}$`, "i") },
                   "casualties.killed": { $gte: Math.floor(rawAttack.casualties.killed * 0.5), $lte: Math.ceil(rawAttack.casualties.killed * 1.5) },
                 }] : []),
                 ...(titleWords.length >= 2 ? [{
                   title: { $regex: new RegExp(titleWords.slice(0, 3).join("|"), "i") },
                   group: { $regex: new RegExp(`^${escapeRegex(rawAttack.group)}$`, "i") },
                 }] : []),
               ],
             });
          }

          if (existing) {
             console.log(`[BACKFILL] Duplicate found: "${rawAttack.title}". Merging with existing "${existing.title}"...`);
             try {
                const mergedUpdates = await mergeIncidentStrategies(existing.toObject(), rawAttack);
                await (Attack as any).findByIdAndUpdate(existing._id, mergedUpdates);
                merged++;
             } catch (mergeErr) { }
             continue;
          }

          const attack = new Attack({
            title: sanitizeString(rawAttack.title),
            description: sanitizeString(rawAttack.description),
            date: new Date(rawAttack.date),
            location: {
              state: normalizeStateName(sanitizeString(rawAttack.location.state)),
              lga: sanitizeString(rawAttack.location.lga || "Unknown"),
              town: sanitizeString(rawAttack.location.town || "Unknown"),
            },
            group: sanitizeString(rawAttack.group),
            casualties: {
              killed: rawAttack.casualties?.killed ?? null,
              injured: rawAttack.casualties?.injured ?? null,
              kidnapped: rawAttack.casualties?.kidnapped ?? null,
              displaced: rawAttack.casualties?.displaced ?? null,
            },
            sources: (rawAttack.sources || []).map((s: any) => ({
              url: sanitizeString(s.url),
              title: sanitizeString(s.title || ""),
              publisher: sanitizeString(s.publisher || ""),
            })),
            status: rawAttack.status || "unconfirmed",
            tags: (rawAttack.tags || []).map(sanitizeString),
            hash,
          });

          await attack.save();
          saved++;
          console.log(`[BACKFILL] Saved: ${rawAttack.title}`);
        } catch (err: any) {
             if (err?.code === 11000) merged++;
             else errors++;
        }
      }
      console.log(`[BACKFILL] Checked ${date.toISOString().split("T")[0]}: Saved ${saved}, Merged ${merged}, Errors ${errors}`);

      // Small delay between calls to not overwhelm API
      await new Promise(res => setTimeout(res, 5000));
    } catch (apiErr) {
        console.error(`[BACKFILL] Failed fetching for ${date}:`, apiErr);
    }
  }
  
  console.log(`\n===========================================`);
  console.log(`[BACKFILL] Job fully completed!`);
  process.exit(0);
}

runBackfill();
