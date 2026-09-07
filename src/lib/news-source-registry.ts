export type RegisteredNewsFeed = {
  publisher: string;
  url: string;
  host: string;
  tier: "core" | "expansion";
  verifiedAt: string;
};

/**
 * These feeds were the PASS surfaces in the 2026-09-07 daily source audit.
 * Keep this list intentionally smaller than the discovery universe: a source
 * must first pass a direct-access canary before it becomes eligible here.
 */
export const VERIFIED_NEWS_FEEDS: readonly RegisteredNewsFeed[] = [
  ["Premium Times", "https://www.premiumtimesng.com/feed", "www.premiumtimesng.com"],
  ["Channels TV", "https://www.channelstv.com/feed/", "www.channelstv.com"],
  ["PUNCH", "https://punchng.com/feed/", "punchng.com"],
  ["Daily Trust", "https://dailytrust.com/feed/", "dailytrust.com"],
  ["Daily Post", "https://dailypost.ng/feed/", "dailypost.ng"],
  ["Sahara Reporters", "https://saharareporters.com/rss.xml", "saharareporters.com"],
  ["Tribune Online", "https://tribuneonlineng.com/feed/", "tribuneonlineng.com"],
  ["Daily Nigerian", "https://dailynigerian.com/feed/", "dailynigerian.com"],
  ["News Central", "https://newscentral.africa/feed/", "newscentral.africa"],
  ["ThisDay", "https://www.thisdaylive.com/feed", "www.thisdaylive.com"],
  ["ICIR", "https://www.icirnigeria.org/feed/", "www.icirnigeria.org"],
  ["Leadership", "https://leadership.ng/feed/", "leadership.ng"],
  ["Blueprint", "https://blueprint.ng/feed/", "blueprint.ng"],
  ["BusinessDay", "https://businessday.ng/feed/", "businessday.ng"],
  ["Ripples Nigeria", "https://www.ripplesnigeria.com/feed/", "www.ripplesnigeria.com"],
  ["Arise News", "https://www.arise.tv/feed/", "www.arise.tv"],
  ["TVC News", "https://www.tvcnews.tv/feed/", "www.tvcnews.tv"],
  ["Sun News", "https://sunnewsonline.com/feed/", "sunnewsonline.com"],
  ["Peoples Gazette", "https://gazettengr.com/feed/", "gazettengr.com"],
  ["Kano Focus", "https://kanofocus.com/feed/", "kanofocus.com"],
  ["SolaceBase", "https://solacebase.com/feed/", "solacebase.com"],
  ["BBC", "https://feeds.bbci.co.uk/news/world/africa/rss.xml", "feeds.bbci.co.uk"],
  ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml", "www.aljazeera.com"],
].map(([publisher, url, host], index) => ({
  publisher,
  url,
  host,
  tier: index < 9 ? "core" : "expansion",
  verifiedAt: "2026-09-07",
}));

/**
 * Hosts excluded after the latest audit. This is an access policy, not a
 * statement that the publishers lack useful reporting. Re-enable a host only
 * after a later direct canary proves accessible, complete coverage.
 */
export const SUPPRESSED_SOURCE_HOSTS: Readonly<Record<string, string>> = {
  "thecable.ng": "UNRESOLVED coverage after access-limited RSS",
  "guardian.ng": "UNRESOLVED complete-window coverage",
  "wikkitimes.com": "UNRESOLVED complete-window coverage",
  "apnews.com": "UNRESOLVED alternate surface coverage",
  "voanews.com": "UNRESOLVED feed coverage",
  "defencehq.mil.ng": "UNRESOLVED official archive coverage",
  "nema.gov.ng": "UNRESOLVED official archive coverage",
  "vanguardngr.com": "FAILED_CHECK access failure",
  "humanglemedia.com": "FAILED_CHECK rate limiting",
  "northeaststarmedia.com": "FAILED_CHECK connection failure",
  "thenationonlineng.net": "FAILED_CHECK access failure",
  "thewhistler.ng": "FAILED_CHECK access failure",
  "reuters.com": "FAILED_CHECK authorization failure",
  "npf.gov.ng": "FAILED_CHECK rate limiting",
  "army.mil.ng": "FAILED_CHECK connection failure",
};

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

export function isSuppressedSourceHost(value: string | null | undefined): boolean {
  if (!value) return false;
  const host = normalizeHost(value.replace(/^https?:\/\//, "").split("/")[0]);
  return Object.keys(SUPPRESSED_SOURCE_HOSTS).some((suppressed) =>
    host === suppressed || host.endsWith(`.${suppressed}`),
  );
}

export function getVerifiedNewsFeeds(): RegisteredNewsFeed[] {
  return VERIFIED_NEWS_FEEDS.map((feed) => ({ ...feed }));
}
