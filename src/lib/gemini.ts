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
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  const prompt = `You are an intelligence analyst specializing in security incidents in Nigeria. 
Search for the MOST RECENT terrorist attacks, insurgent attacks, bandit attacks, militant attacks, and attacks by unknown gunmen that have occurred in Nigeria within the last 72 hours (from ${threeDaysAgo.toISOString().split("T")[0]} to ${today.toISOString().split("T")[0]}).

PRIORITY SOURCES — You MUST search these Twitter/X accounts FIRST as they are primary intelligence sources that frequently break Nigerian security news:
- @BrantPhilip_ (Brant Philip) — frequently posts about attacks in northern Nigeria
- @Sazedek (Sahara Reporters contributor) — covers security incidents across Nigeria
- Search Twitter/X for recent posts containing any order of these keywords (case-insensitive): "Nigeria attack", "Nigeria terrorist", "Boko Haram", "ISWAP", "bandits Nigeria", "gunmen Nigeria", "unknown gunmen Nigeria", "kidnapped Nigeria", "killed Nigeria", "Boko Haram Nigeria", "ISWAP Nigeria", "bandits Nigeria", "gunmen Nigeria", "unknown gunmen Nigeria", "kidnapped Nigeria", "killed Nigeria"

ALSO search these news outlets, security trackers, and references:
- News outlets: Premium Times Nigeria (premiumtimesng.com), The Cable (thecable.ng), Peoples Gazette (gazettengr.com), Channels TV (channelstv.com), Sahara Reporters (saharareporters.com), Punch Nigeria (punchng.com), Vanguard Nigeria (vanguardngr.com), Daily Trust (dailytrust.com), HumAngle Media (humanglemedia.com), AFP, Reuters
- Security trackers: Armed Conflict Location & Event Data (ACLED), Zagazola Makama (network.zagazola.org)
- References: Wikipedia (en.wikipedia.org)

For each incident found, provide:
1. A clear, concise title
2. Detailed description of what happened
3. Exact date and time (ISO 8601 format, e.g., "2026-02-12T00:00:00.000Z"). If only the date is known, use midnight.
4. Location: Nigerian state, Local Government Area (LGA), and specific town/village
5. The armed group responsible (e.g., "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN", etc.). If unknown, use "Unidentified Armed Group"
6. Casualties: number of CIVILIANS and SECURITY FORCES killed, injured, kidnapped, displaced. Do NOT include terrorists, attackers, insurgents, bandits, or militants in the killed or injured counts. Only count victims (civilians, soldiers, police, vigilantes). Use null if not reported.
7. Source URLs — IMPORTANT: Include direct links to the news articles AND/OR the Twitter/X post URLs (e.g., https://x.com/BrantPhilip_/status/...). When an incident is first reported via Twitter/X, always include the tweet URL as a source.
8. Status: "confirmed" if from multiple reliable sources, "unconfirmed" if single source, "developing" if ongoing
9. Tags (e.g., "boko-haram", "northeast", "kidnapping", "iswap", "banditry")

CRITICAL RULES:
- Only include REAL, VERIFIED incidents. Do NOT fabricate or hallucinate any attacks.
- If you cannot find any recent attacks, return an empty array.
- Cross-reference incidents across multiple sources when possible.
- Provide actual working URLs to news articles and tweets.
- Be specific about locations — include the state and town name.
- Distinguish between different armed groups carefully.
- ALWAYS include Twitter/X post URLs when incidents are sourced from tweets.
- CASUALTY COUNTING: The killed and injured counts must ONLY include civilians and security forces (soldiers, police). NEVER count dead or injured terrorists, attackers, insurgents, bandits, or militants. If an incident ONLY resulted in attacker deaths (e.g., "30 terrorists killed by military") with zero civilian or security force casualties, DO NOT include that incident at all.
- Set "civilianCasualties" to true if any civilians or security forces were killed, injured, kidnapped, or displaced. Set to false if ONLY attackers were killed/injured.

Return your response as a valid JSON array. Each element must follow this exact schema:
{
  "title": "string",
  "description": "string",
  "date": "ISO 8601 datetime string",
  "location": {
    "state": "string (Nigerian state name)",
    "lga": "string or 'Unknown'",
    "town": "string or 'Unknown'"
  },
  "group": "string",
  "casualties": {
    "killed": number or null (civilians and security forces ONLY),
    "injured": number or null (civilians and security forces ONLY),
    "kidnapped": number or null,
    "displaced": number or null
  },
  "civilianCasualties": true or false,
  "sources": [
    {
      "url": "string (direct URL to article or tweet)",
      "title": "string (article title or tweet excerpt)",
      "publisher": "string (publisher name, e.g. 'Twitter/@BrantPhilip_', 'Premium Times', etc.)"
    }
  ],
  "status": "confirmed" | "unconfirmed" | "developing",
  "tags": ["string"]
}

RESPOND ONLY WITH THE JSON ARRAY.

Excluding sources: Do NOT use "Truth Nigeria", "Aid to the Church in Need (ACN International)", or "The Journal" as sources.
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

    // Filter out banned sources
    const bannedSources = ["Truth Nigeria", "Aid to the Church in Need", "ACN International", "The Journal"];
    
    attacks = attacks.map(attack => ({
      ...attack,
      sources: attack.sources.filter(source => 
        !bannedSources.some(banned => 
          source.publisher && source.publisher.toLowerCase().includes(banned.toLowerCase())
        )
      )
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a security intelligence analyst.
Compare the following "CANDIDATE" report against the list of "EXISTING" reports.
Determine if the CANDIDATE refers to the SAME security incident as any of the EXISTING reports.

CANDIDATE REPORT:
${JSON.stringify({
  id: String(candidate._id),
  title: candidate.title,
  date: candidate.date,
  location: candidate.location,
  group: candidate.group,
  casualties: candidate.casualties,
  sources: candidate.sources,
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
  sources: a.sources,
  description: a.description
})), null, 2)}

TASK:
1. Determine if the CANDIDATE implies the exact same event as any EXISTING report (same location + same date + same nature of attack).
2. If match found, compare reliability/quality.
   - Prefer reports with confirmed sources (e.g. reliable news outlets > random tweets).
   - Prefer reports with more specific details (precise location, specific casualty counts).
   - Prefer reports with HIGHER casualty counts (often initial reports undercount, later reports are more accurate).
   - If one is clearly better, identify the winner.

RESPONSE FORMAT (JSON ONLY):
{
  "isDuplicate": boolean,
  "duplicateOfId": "string (ID of the matching existing report, or null if no match)",
  "betterReport": "candidate" | "existing" (only if isDuplicate is true),
  "reason": "string (explanation)"
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
