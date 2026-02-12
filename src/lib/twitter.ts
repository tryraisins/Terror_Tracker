import { Scraper, SearchMode } from "@the-convocation/twitter-scraper";

/**
 * Twitter/X accounts to monitor for Nigerian security incidents.
 * These accounts are known for breaking news about attacks in Nigeria.
 */
const MONITORED_ACCOUNTS = [
  "BrantPhilip_",
  "Sazedek",
  "PremiumTimesng",
  "dailyabornnews",
  "channelabornnews",
  "HumabornnReports",
];

/**
 * Keywords that indicate a tweet is about a security incident in Nigeria.
 * Used to filter relevant tweets from the monitored accounts.
 */
const INCIDENT_KEYWORDS = [
  "attack",
  "killed",
  "kidnap",
  "bomb",
  "gunmen",
  "terrorists",
  "bandits",
  "insurgent",
  "boko haram",
  "iswap",
  "ipob",
  "militia",
  "slaughter",
  "massacre",
  "ambush",
  "abduct",
  "execution",
  "militant",
  "troops",
  "soldiers",
  "casualt",
  "death toll",
  "hostage",
  "armed",
  "shoot",
  "explosi",
  "IED",
  "suicide bomb",
  "displaced",
  "village raid",
];

export interface ScrapedTweet {
  id: string;
  text: string;
  username: string;
  displayName: string;
  timestamp: Date;
  url: string;
  likes: number;
  retweets: number;
  isRetweet: boolean;
}

// Singleton scraper instance
let scraperInstance: Scraper | null = null;
let isLoggedIn = false;

/**
 * Get or create the Twitter scraper instance.
 * Handles login with cookie persistence.
 */
async function getScraper(): Promise<Scraper> {
  if (scraperInstance && isLoggedIn) {
    return scraperInstance;
  }

  const scraper = new Scraper();

  const username = process.env.TWITTER_USERNAME;
  const password = process.env.TWITTER_PASSWORD;
  const email = process.env.TWITTER_EMAIL;

  if (!username || !password) {
    throw new Error(
      "TWITTER_USERNAME and TWITTER_PASSWORD must be set in environment variables"
    );
  }

  try {
    // Try to restore cookies from env if available
    const cookiesStr = process.env.TWITTER_COOKIES;
    if (cookiesStr) {
      try {
        const cookies = JSON.parse(cookiesStr);
        await scraper.setCookies(cookies);
        const loggedIn = await scraper.isLoggedIn();
        if (loggedIn) {
          console.log("[TWITTER] Restored session from cookies");
          scraperInstance = scraper;
          isLoggedIn = true;
          return scraper;
        }
      } catch {
        console.log("[TWITTER] Cookie restoration failed, will login fresh");
      }
    }

    // Fresh login
    console.log("[TWITTER] Logging in...");
    await scraper.login(username, password, email);
    isLoggedIn = true;
    scraperInstance = scraper;

    // Log cookies for persistence (you can save these)
    const cookies = await scraper.getCookies();
    console.log(
      "[TWITTER] Login successful. Cookie count:",
      cookies.length
    );

    return scraper;
  } catch (error) {
    console.error("[TWITTER] Login failed:", error);
    throw error;
  }
}

/**
 * Check if a tweet text is relevant to Nigerian security incidents.
 */
function isRelevantTweet(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Must mention Nigeria or a Nigerian location/group
  const nigeriaContext =
    lowerText.includes("nigeria") ||
    lowerText.includes("borno") ||
    lowerText.includes("zamfara") ||
    lowerText.includes("kaduna") ||
    lowerText.includes("benue") ||
    lowerText.includes("plateau") ||
    lowerText.includes("niger state") ||
    lowerText.includes("katsina") ||
    lowerText.includes("adamawa") ||
    lowerText.includes("taraba") ||
    lowerText.includes("nasarawa") ||
    lowerText.includes("boko haram") ||
    lowerText.includes("iswap") ||
    lowerText.includes("ipob") ||
    lowerText.includes("maiduguri") ||
    lowerText.includes("abuja") ||
    lowerText.includes("lagos");

  if (!nigeriaContext) return false;

  // Must contain at least one incident keyword
  return INCIDENT_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );
}

/**
 * Fetch recent tweets from monitored accounts.
 * Returns tweets from the last 72 hours that are relevant to security incidents.
 */
export async function fetchTweetsFromAccounts(): Promise<ScrapedTweet[]> {
  const scraper = await getScraper();
  const tweets: ScrapedTweet[] = [];
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);

  for (const account of MONITORED_ACCOUNTS) {
    try {
      console.log(`[TWITTER] Fetching tweets from @${account}...`);

      let count = 0;
      const maxTweets = 20; // Last 20 tweets per account

      for await (const tweet of scraper.getTweets(account, maxTweets)) {
        if (!tweet.text || !tweet.timeParsed) continue;

        // Skip if older than 72 hours
        if (tweet.timeParsed < cutoff) break;

        // Skip retweets
        if (tweet.isRetweet) continue;

        // Filter for relevance
        if (!isRelevantTweet(tweet.text)) continue;

        tweets.push({
          id: tweet.id || "",
          text: tweet.text,
          username: account,
          displayName: tweet.name || account,
          timestamp: tweet.timeParsed,
          url: `https://x.com/${account}/status/${tweet.id}`,
          likes: tweet.likes || 0,
          retweets: tweet.retweets || 0,
          isRetweet: false,
        });

        count++;
      }

      console.log(
        `[TWITTER] Found ${count} relevant tweets from @${account}`
      );
    } catch (err) {
      console.error(`[TWITTER] Error fetching from @${account}:`, err);
      // Continue with other accounts
    }
  }

  return tweets;
}

/**
 * Search Twitter for security-related tweets about Nigeria.
 * Uses keyword search to find tweets from any account.
 */
export async function searchSecurityTweets(): Promise<ScrapedTweet[]> {
  const scraper = await getScraper();
  const tweets: ScrapedTweet[] = [];
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);

  const searchQueries = [
    "Nigeria attack killed",
    "Nigeria bandits kidnapped",
    "Boko Haram attack",
    "ISWAP Nigeria",
    "gunmen Nigeria killed",
    "Nigeria terrorist attack",
  ];

  for (const query of searchQueries) {
    try {
      console.log(`[TWITTER] Searching: "${query}"...`);
      let count = 0;

      for await (const tweet of scraper.searchTweets(
        query,
        10,
        SearchMode.Latest
      )) {
        if (!tweet.text || !tweet.timeParsed) continue;
        if (tweet.timeParsed < cutoff) continue;
        if (tweet.isRetweet) continue;

        // Deduplicate by ID
        if (tweets.some((t) => t.id === tweet.id)) continue;

        tweets.push({
          id: tweet.id || "",
          text: tweet.text,
          username: tweet.username || "unknown",
          displayName: tweet.name || "Unknown",
          timestamp: tweet.timeParsed,
          url: `https://x.com/${tweet.username}/status/${tweet.id}`,
          likes: tweet.likes || 0,
          retweets: tweet.retweets || 0,
          isRetweet: false,
        });

        count++;
      }

      console.log(`[TWITTER] Found ${count} results for "${query}"`);
    } catch (err) {
      console.error(`[TWITTER] Search error for "${query}":`, err);
    }
  }

  return tweets;
}

/**
 * Fetch all relevant tweets — both from monitored accounts and keyword search.
 * Deduplicates by tweet ID.
 */
export async function fetchAllRelevantTweets(): Promise<ScrapedTweet[]> {
  console.log("[TWITTER] Starting tweet collection...");

  try {
    const [accountTweets, searchTweets] = await Promise.allSettled([
      fetchTweetsFromAccounts(),
      searchSecurityTweets(),
    ]);

    const allTweets: ScrapedTweet[] = [];
    const seenIds = new Set<string>();

    // Merge account tweets
    if (accountTweets.status === "fulfilled") {
      for (const tweet of accountTweets.value) {
        if (!seenIds.has(tweet.id)) {
          seenIds.add(tweet.id);
          allTweets.push(tweet);
        }
      }
    } else {
      console.error(
        "[TWITTER] Account tweets failed:",
        accountTweets.reason
      );
    }

    // Merge search tweets
    if (searchTweets.status === "fulfilled") {
      for (const tweet of searchTweets.value) {
        if (!seenIds.has(tweet.id)) {
          seenIds.add(tweet.id);
          allTweets.push(tweet);
        }
      }
    } else {
      console.error(
        "[TWITTER] Search tweets failed:",
        searchTweets.reason
      );
    }

    // Sort by timestamp (newest first)
    allTweets.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    console.log(
      `[TWITTER] Collection complete: ${allTweets.length} total relevant tweets`
    );
    return allTweets;
  } catch (error) {
    console.error("[TWITTER] Fatal error:", error);
    return [];
  }
}
