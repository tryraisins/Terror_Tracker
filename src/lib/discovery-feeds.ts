import { getVerifiedNewsFeeds, type RegisteredNewsFeed } from "./news-source-registry";

export type DiscoveryFeedArticle = {
  url: string;
  title: string;
  publisher: string;
  publishedAt: Date;
};

export type DiscoveryFeedFailure = {
  publisher: string;
  feedUrl: string;
  error: string;
};

export type DiscoveryFeedResult = {
  articles: DiscoveryFeedArticle[];
  failures: DiscoveryFeedFailure[];
  feedsChecked: number;
};

const FEED_TIMEOUT_MS = Math.max(1_000, Number(process.env.SOURCE_FETCH_TIMEOUT_MS || 8_000));
const FEED_ITEM_LIMIT = Math.max(1, Math.min(50, Number(process.env.SEARCH_FEED_ITEMS_PER_SOURCE || 12)));
const FEED_CONCURRENCY = Math.max(1, Math.min(8, Number(process.env.FREE_SOURCE_CONCURRENCY || 4)));
const USER_AGENT = "NigeriaAttackTracker/1.0 (+registered publisher discovery)";
const INCIDENT_HEADLINE = /\b(?:attack(?:ed|s|ing)?|ambush(?:ed|es|ing)?|kidnap(?:ped|s|ping)?|abduct(?:ed|s|ing|ion|ions)?|kill(?:ed|s|ing)?|injur(?:ed|es|ing|y|ies)?|wound(?:ed|s|ing)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|out)?|gunmen|bandits?|insurgents?|terrorists?|militants?|boko\s+haram|iswap|ied|clash(?:es|ed)?|massacre[ds]?|herdsmen|cultists?)\b/i;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function field(xml: string, tag: string): string {
  return decodeXml(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] || "");
}

function parseFeed(xml: string, feed: RegisteredNewsFeed): DiscoveryFeedArticle[] {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) || [];
  return blocks.flatMap((block) => {
    const href = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
    const url = decodeXml(href || field(block, "link") || field(block, "guid")).trim();
    const title = field(block, "title");
    const publishedAt = new Date(field(block, "pubDate") || field(block, "published") || field(block, "updated"));
    if (!title || !INCIDENT_HEADLINE.test(title) || !/^https?:\/\//i.test(url) || Number.isNaN(publishedAt.getTime())) return [];
    return [{ url, title, publisher: feed.publisher, publishedAt }];
  }).slice(0, FEED_ITEM_LIMIT);
}

function feedUrlKey(value: string): string {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:utm_.+|fbclid|gclid|ref|source)$/i.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

export async function discoverRegisteredFeedArticles(
  lookbackHours: number,
  windowEnd = new Date(),
): Promise<DiscoveryFeedResult> {
  const feeds = getVerifiedNewsFeeds();
  const failures: DiscoveryFeedFailure[] = [];
  const articles: DiscoveryFeedArticle[] = [];
  const minPublishedMs = windowEnd.getTime() - lookbackHours * 3_600_000;
  const maxPublishedMs = windowEnd.getTime() + 2 * 3_600_000;

  for (let index = 0; index < feeds.length; index += FEED_CONCURRENCY) {
    const batch = feeds.slice(index, index + FEED_CONCURRENCY);
    const settled = await Promise.all(batch.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
          headers: { "user-agent": USER_AGENT, accept: "application/rss+xml,application/atom+xml,application/xml,text/xml,*/*" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        if (!/<(?:rss|feed|rdf:RDF)\b/i.test(xml)) throw new Error("Publisher returned a non-feed response");
        return parseFeed(xml, feed).filter(({ publishedAt }) =>
          publishedAt.getTime() >= minPublishedMs && publishedAt.getTime() <= maxPublishedMs,
        );
      } catch (error) {
        failures.push({
          publisher: feed.publisher,
          feedUrl: feed.url,
          error: error instanceof Error ? error.message : String(error),
        });
        return [];
      }
    }));
    articles.push(...settled.flat());
  }

  const byUrl = new Map<string, DiscoveryFeedArticle>();
  for (const article of articles) {
    const key = feedUrlKey(article.url);
    if (key && !byUrl.has(key)) byUrl.set(key, article);
  }
  return { articles: [...byUrl.values()], failures, feedsChecked: feeds.length };
}
