/**
 * Claim-level linkage between a held article and a stored incident record.
 *
 * Identity fields (title, date, LGA, town) only say two reports are about the
 * same neighbourhood on the same day. This module answers the harder question:
 * do the two sets of source articles describe the same episode? It compares
 * claims extracted from the articles on each side, so the answer rests on what
 * the reporting actually says rather than on the fields used to find the pair.
 *
 * The comparison is deliberately deterministic and conservative. The model only
 * extracts claims; it never decides linkage. That keeps the decision auditable:
 * every link names the shared person, site or combination that produced it.
 */

export interface TollClaim {
  value: number;
  victims: "killed" | "abducted" | "injured" | "displaced";
  /** Who is credited with the figure, e.g. "police", "residents", "NEMA". */
  attribution?: string;
}

export interface ArticleClaims {
  /** Named individuals, without titles. */
  people: string[];
  /** Specific places, e.g. "Bassa market", "Barka Ladi motor park". */
  sites: string[];
  /** Time-of-day or day phrases, e.g. "early hours of Friday", "around 8pm". */
  times: string[];
  tolls: TollClaim[];
  /** Short distinctive phrases that identify the episode in the reporting. */
  distinctive: string[];
}

export const EMPTY_CLAIMS: ArticleClaims = { people: [], sites: [], times: [], tolls: [], distinctive: [] };

const TITLES = new Set([
  "mallam", "alhaji", "alhaja", "mr", "mrs", "miss", "chief", "pastor", "reverend", "imam", "doctor",
  "dr", "prof", "professor", "senator", "governor", "general", "captain", "inspector", "sp", "dsp",
]);


export const normalizeClaim = (value: string) =>
  value.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();

/** Surname-style tokens: the part that identifies a person across two write-ups. */
export function personTokens(name: string): string[] {
  return normalizeClaim(name)
    .split(" ")
    .filter((word) => word.length >= 4 && !TITLES.has(word) && !/^\d+$/.test(word));
}

export function siteTokens(site: string, excluded: string[]): string[] {
  const blocked = new Set(excluded.flatMap((value) => normalizeClaim(value).split(" ")).filter(Boolean));
  return normalizeClaim(site)
    .split(" ")
    .filter((word) => word.length >= 4 && !blocked.has(word) && !/^\d+$/.test(word));
}

export function timeTokens(time: string): string[] {
  return normalizeClaim(time)
    .split(" ")
    .filter((word) => word.length >= 4 && !/^\d+$/.test(word));
}

export interface LinkageInput {
  candidate: ArticleClaims;
  record: ArticleClaims;
  /** Settlement, LGA and state, which the pair already shares. */
  sharedPlaceNames: string[];
  /** Toll figures either side reports, used to recognise a matching count. */
  tollFigures: number[];
}

export interface LinkageResult {
  linked: boolean;
  /** Which signal produced the link, for the audit trail. */
  evidence: string[];
  why?: string;
}

/**
 * Linked when the two sides name the same person, or when they share a specific
 * site and at least one more independent detail (a time or matching toll). A
 * shared toll alone is not enough: casualty counts are copied between outlets all
 * the time, and a shared site alone is the neighbourhood they already share.
 */
export function claimsLink({ candidate, record, sharedPlaceNames, tollFigures }: LinkageInput): LinkageResult {
  const candidatePeople = new Set(candidate.people.flatMap(personTokens));
  const sharedPeople = [...new Set(record.people.flatMap(personTokens))].filter((token) => candidatePeople.has(token));

  const recordSites = new Set(record.sites.flatMap((site) => siteTokens(site, sharedPlaceNames)));
  const sharedSites = [...new Set(candidate.sites.flatMap((site) => siteTokens(site, sharedPlaceNames)))]
    .filter((token) => recordSites.has(token));

  const recordTimes = new Set(record.times.flatMap(timeTokens));
  const sharedTimes = [...new Set(candidate.times.flatMap(timeTokens))].filter((token) => recordTimes.has(token));

  const figures = new Set(tollFigures.filter((value) => Number.isFinite(value) && value > 0));
  const sharedTolls = candidate.tolls
    .filter((claim) => record.tolls.some((other) => other.victims === claim.victims && other.value === claim.value))
    .filter((claim) => figures.has(claim.value));

  if (sharedPeople.length) {
    return { linked: true, evidence: [`person:${sharedPeople[0]}`] };
  }
  if (sharedSites.length && (sharedTimes.length || sharedTolls.length)) {
    const evidence = [`site:${sharedSites[0]}`];
    if (sharedTimes.length) evidence.push(`time:${sharedTimes[0]}`);
    if (sharedTolls.length) evidence.push(`toll:${sharedTolls[0].victims}:${sharedTolls[0].value}`);
    return { linked: true, evidence };
  }
  if (sharedSites.length) {
    return { linked: false, evidence: [], why: "shares a site but no time or toll, which is the neighbourhood they already share" };
  }
  return { linked: false, evidence: [], why: "no shared person, site, time or toll between the two sets of articles" };
}
