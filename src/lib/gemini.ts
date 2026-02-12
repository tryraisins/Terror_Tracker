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
Search for the MOST RECENT terrorist attacks, insurgent attacks, bandit attacks, and militant attacks that have occurred in Nigeria within the last 72 hours (from ${threeDaysAgo.toISOString().split("T")[0]} to ${today.toISOString().split("T")[0]}).

PRIORITY SOURCES — You MUST search these Twitter/X accounts FIRST as they are primary intelligence sources that frequently break Nigerian security news:
- @BrantPhilip_ (Brant Philip) — frequently posts about attacks in northern Nigeria
- @Sazedek (Sahara Reporters contributor) — covers security incidents across Nigeria  
- @HumsReports (HumAngle Reports) — conflict journalism in Nigeria
- @PremiumTimesng (Premium Times Nigeria) — investigative journalism
- @dailyabornnews (Daily Trust) — northern Nigeria coverage
- @channabornnews (Channels Television) — nationwide coverage
- Search Twitter/X for recent posts containing: "Nigeria attack", "Nigeria terrorist", "Boko Haram", "ISWAP", "bandits Nigeria", "gunmen Nigeria", "kidnapped Nigeria", "killed Nigeria"

ALSO search these news outlets and security trackers:
- News outlets: Premium Times Nigeria (premiumtimesng.com), The Cable (thecable.ng), Channels TV (channelstv.com), Sahara Reporters (saharareporters.com), Punch Nigeria (punchng.com), Vanguard Nigeria (vanguardngr.com), Daily Trust (dailytrust.com), HumAngle Media (humanglemedia.com), AFP, Reuters
- Security trackers: Armed Conflict Location & Event Data (ACLED), Nigeria Security Tracker (Council on Foreign Relations)

For each incident found, provide:
1. A clear, concise title
2. Detailed description of what happened
3. Exact date and time (ISO 8601 format, e.g., "2026-02-12T00:00:00.000Z"). If only the date is known, use midnight.
4. Location: Nigerian state, Local Government Area (LGA), and specific town/village
5. The armed group responsible (e.g., "Boko Haram", "ISWAP", "Bandits", "Unknown Gunmen", "IPOB/ESN", etc.). If unknown, use "Unidentified Armed Group"
6. Casualties: number killed, injured, kidnapped, displaced. Use null if not reported.
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
    "killed": number or null,
    "injured": number or null,
    "kidnapped": number or null,
    "displaced": number or null
  },
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

Respond ONLY with the JSON array, no other text. If no incidents are found, respond with [].`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const attacks: RawAttackData[] = JSON.parse(cleanedText);

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
    console.error("Error fetching attacks from Gemini:", error);
    throw error;
  }
}
