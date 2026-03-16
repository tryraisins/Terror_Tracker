import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";


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
  const normalizedState = attack.location.state.toLowerCase().trim();
  const normalizedTown = attack.location.town.toLowerCase().trim();
  const normalizedGroup = attack.group.toLowerCase().trim();

  const hashInput = `${dateStr}|${normalizedState}|${normalizedTown}|${normalizedGroup}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

/**
 * Use Gemini 2.5 Flash with Google Search grounding to find recent
 * terrorist attacks in Nigeria.
 */
export async function fetchRecentAttacks(): Promise<RawAttackData[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // Enable Google Search as a tool
    tools: [{ googleSearch: {} } as any],
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  const fourDaysAgo = new Date(today);
  fourDaysAgo.setDate(today.getDate() - 4);

  const prompt = `You are an intelligence analyst specializing in security incidents in Nigeria.
The current date and time is ${today.toISOString()}.

YOUR PRIMARY MISSION: Search for ALL terrorist attacks, insurgent attacks, bandit attacks, militant attacks, and attacks by unknown gunmen in Nigeria.

SEARCH STRATEGY — FOLLOW THIS ORDER:
1. FIRST: Search for any attacks that happened TODAY (${todayStr}). Search each Tier 2 news site individually for today's articles. Check headlines from Premium Times, Punch, Vanguard, Daily Trust, Channels TV, Sahara Reporters, Daily Post, The Cable, HumAngle, and AP/Reuters for today.
2. SECOND: Search for attacks from YESTERDAY (${new Date(today.getTime() - 86400000).toISOString().split("T")[0]}).
3. THIRD: Search for any remaining attacks from the past 4 days (${fourDaysAgo.toISOString().split("T")[0]} to ${todayStr}) that you haven't already found.

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
4. Location: Nigerian state name (without "State" suffix), Local Government Area (LGA), and specific town/village
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
    "state": "string (Nigerian state name, without 'State' suffix)",
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

    // Parse the JSON response
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let attacks: RawAttackData[] = JSON.parse(cleanedText);

    // Fix grounding redirect URLs using actual metadata
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as any;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    
    if (groundingChunks.length > 0) {
      attacks.forEach(attack => {
        attack.sources.forEach(source => {
          if (source.url.includes("grounding-api-redirect") || !source.url.startsWith("http")) {
            // Try to find matching chunk by title
            const match = groundingChunks.find((chunk: any) => 
               chunk.web?.title && source.title && 
               (chunk.web.title.toLowerCase().includes(source.title.toLowerCase()) || 
                source.title.toLowerCase().includes(chunk.web.title.toLowerCase()))
            );
            
            if (match?.web?.uri) {
              source.url = match.web.uri;
            } else {
              // Fallback to Google Search if source is not found
              source.url = `https://www.google.com/search?q=${encodeURIComponent(attack.title + " " + source.publisher)}`;
            }
          }
        });
      });
    }

    // ──────────────────────────────────────────────
    // Source credibility validation (whitelist-based)
    // ──────────────────────────────────────────────

    // Trusted domains — extracted from the Tier 1 & Tier 2 list
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
    ]);

    // Trusted publisher names (case-insensitive partial match)
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
    ];

    // Explicitly banned sources & patterns
    const BANNED_SOURCES = [
      "truth nigeria", "aid to the church in need", "acn international",
      "the journal", "council on foreign relations", "cfr.org", "trust tv",
      "zenit news", "youtube", "blogspot", "wordpress.com", "medium.com",
    ];

    // Extract domain from URL
    function extractDomain(url: string): string {
      try {
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        return hostname;
      } catch {
        return "";
      }
    }

    // Check if a single source is trusted
    function isSourceTrusted(source: { url: string; publisher: string }): boolean {
      // Check if publisher is in banned list
      const pubLower = (source.publisher || "").toLowerCase();
      if (BANNED_SOURCES.some(banned => pubLower.includes(banned))) return false;
      if (source.url && BANNED_SOURCES.some(banned => source.url.toLowerCase().includes(banned))) return false;

      // Check domain against whitelist
      const domain = extractDomain(source.url);
      if (domain && TRUSTED_DOMAINS.has(domain)) return true;
      // Check subdomain (e.g., "www.bbc.com" -> check "bbc.com")
      const parts = domain.split(".");
      if (parts.length > 2) {
        const rootDomain = parts.slice(-2).join(".");
        if (TRUSTED_DOMAINS.has(rootDomain)) return true;
      }

      // Check publisher name against trusted list
      if (pubLower && TRUSTED_PUBLISHERS.some(tp => pubLower.includes(tp.toLowerCase()))) return true;

      // Reject unknown/empty publishers
      if (!source.publisher || pubLower === "unknown" || pubLower.length < 3) return false;

      return false; // Default: untrusted
    }

    // Filter sources per attack, then remove attacks with zero trusted sources
    attacks = attacks.map(attack => ({
      ...attack,
      sources: attack.sources.filter(source => isSourceTrusted(source)),
    })).filter(attack => attack.sources.length > 0);

    // Validate each attack has minimum required fields
    return attacks.filter(
      (attack) =>
        attack.title &&
        attack.description &&
        attack.date &&
        attack.location?.state &&
        attack.group
    );
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
    model: "gemini-2.5-flash",
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
1. LOCATION MATCH: Same state, AND same or similar town/LGA (ignore spelling variations like "Maiduguri" vs "Maiduguri City", "Kafanchan" vs "Kafachan")
2. DATE MATCH: Same date OR within 1 day of each other (reports of the same event often differ by a day)
3. NATURE MATCH: Same basic type of attack (e.g., both are kidnappings, both are bombings, both involve gunmen attacking a village)

Two reports are NOT the same incident if:
- They occurred in different states
- They occurred more than 2 days apart
- They describe fundamentally different types of events (e.g., kidnapping vs bombing)
- They are in the same state but clearly different towns/villages with no name overlap

⚠️ IMPORTANT: When evidence is AMBIGUOUS, ERR ON THE SIDE OF MARKING AS DUPLICATE. It is much worse to have duplicate entries in the database than to miss a genuinely unique incident.

Examples:
- "Bandits kill 15 in Zamfara attack" AND "Gunmen attack Zamfara village, 12 dead" on the same date → SAME INCIDENT (different names for attackers, slight casualty variation)
- "Boko Haram attacks Maiduguri" AND "ISWAP militants hit Maiduguri" on the same date → SAME INCIDENT (group attribution often varies between sources)
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 1. Merge Casualties (Target: Max)
    const mergedCasualties = {
        killed: Math.max(existing.casualties?.killed || 0, candidate.casualties?.killed || 0),
        injured: Math.max(existing.casualties?.injured || 0, candidate.casualties?.injured || 0),
        kidnapped: Math.max(existing.casualties?.kidnapped || 0, candidate.casualties?.kidnapped || 0),
        displaced: Math.max(existing.casualties?.displaced || 0, candidate.casualties?.displaced || 0),
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
