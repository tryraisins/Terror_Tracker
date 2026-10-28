/**
 * Claim-level linkage between a held article and a stored incident record.
 *
 * Identity fields (title, date, LGA, town) only say two reports are about the same
 * neighbourhood on the same day. This module answers the harder question: do the
 * two sets of source articles describe the same episode? It compares claims
 * extracted from the articles on each side, so the answer rests on what the
 * reporting says rather than on the fields used to find the pair.
 *
 * Matching is deliberately narrow, because a false link is the failure that
 * matters: it would attach an article to the wrong attack. A shared facility word
 * ("market"), a weekday, a common given name or a small round toll must not link
 * anything on their own.
 */

export interface TollClaim {
  value: number;
  victims: "killed" | "abducted" | "injured" | "displaced";
  /** Who is credited with the figure, e.g. "police", "residents", "NEMA". */
  attribution?: string;
}

export interface ArticleClaims {
  /** Victims, survivors, eyewitnesses and suspects named in the report. */
  people: string[];
  /** Specific places, e.g. "Bassa market", "Barka Ladi motor park". */
  sites: string[];
  /** Clock times only, e.g. "8pm", "21:30". */
  times: string[];
  tolls: TollClaim[];
  /** Short distinctive phrases that identify the episode in the reporting. */
  distinctive: string[];
}

export const EMPTY_CLAIMS: ArticleClaims = { people: [], sites: [], times: [], tolls: [], distinctive: [] };

const TITLES = new Set([
  "mallam", "alhaji", "alhaja", "mr", "mrs", "miss", "chief", "pastor", "reverend", "rev", "imam",
  "doctor", "dr", "prof", "professor", "senator", "governor", "general", "captain", "inspector", "sp",
  "dsp", "commissioner", "deputy", "comrade", "hon", "sheikh", "sergeant", "superintendent", "major",
  "colonel", "bishop", "engr", "barrister", "emir", "chairman", "spokesperson", "spokesman", "police",
]);

/** Facility words. A site has to be more specific than "the market" to count. */
const GENERIC_SITES = new Set([
  "market", "church", "mosque", "school", "road", "farm", "village", "community", "palace", "camp",
  "hospital", "clinic", "station", "park", "motor", "bridge", "square", "field", "compound", "primary",
  "residence", "house", "home", "street", "area", "ward", "district", "local", "government", "town",
  "settlement", "neighbourhood", "neighborhood", "centre", "center", "hall", "stadium", "garage", "secondary",
  "central", "main", "catholic", "baptist", "anglican", "health", "junction", "mission", "township", "old", "head",
]);

/** Given names common enough that a single shared one proves nothing. */
const COMMON_NAMES = new Set([
  "musa", "ibrahim", "yusuf", "abdullahi", "abubakar", "mohammed", "muhammad", "ahmed", "ali", "umar",
  "john", "peter", "paul", "james", "daniel", "samuel", "david", "joseph", "grace", "mary", "esther",
  "blessing", "comfort", "sunday", "monday", "friday", "sani", "garba", "bala", "sule", "adamu",
  "hassan", "hussein", "isa", "yakubu", "danjuma", "solomon", "emeka", "chinedu", "obinna", "tunde",
  "segun", "ade", "bode", "kola", "nnamdi", "ifeanyi", "olumide", "babatunde", "bello", "aliyu", "usman",
  "emmanuel", "michael", "fatima", "amina", "hauwa", "ezekiel", "dauda", "yakubu", "suleiman", "moses",
  "abigail", "victor", "vincent", "patrick", "anselm", "godwin", "bright", "wisdom", "miracle",
]);

export const normalizeClaim = (value: string) =>
  value.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();

/** Name tokens that could identify a person across two write-ups. */
export function personTokens(name: string): string[] {
  return normalizeClaim(name)
    .split(" ")
    .filter((word) => word.length >= 4 && !TITLES.has(word) && !COMMON_NAMES.has(word) && !/^\d+$/.test(word));
}

/**
 * Specific site tokens only. A word has to be capitalised in the original text to
 * count, because "primary school", "central mosque" and "main market" are facility
 * descriptions rather than names. The stop-list stays as a backstop. Dropping a
 * lower-case real place name is the safe direction.
 */
export function siteTokens(site: string, excluded: string[]): string[] {
  const blocked = new Set(excluded.flatMap((value) => normalizeClaim(value).split(" ")).filter(Boolean));
  return site
    .split(/\s+/)
    .filter((word) => /^[A-Z][\p{L}'-]*$/u.test(word))
    .map(normalizeClaim)
    .filter((word) => word.length >= 4 && !blocked.has(word) && !GENERIC_SITES.has(word) && !/^\d+$/.test(word));
}

/** Titleless name tokens in order, used for an exact full-name match. */
export function personNameKey(name: string): string[] {
  return normalizeClaim(name)
    .split(" ")
    .filter((word) => word.length >= 2 && !TITLES.has(word) && !/^\d+$/.test(word));
}

/** Clock times only. A shared weekday or "morning" adds nothing when the date is equal. */
export function timeTokens(time: string): string[] {
  const normalized = normalizeClaim(time);
  return (normalized.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\b/g) || []).map((value) => value.replace(/\s+/g, ""));
}

export interface LinkageInput {
  candidate: ArticleClaims;
  record: ArticleClaims;
  /** Settlement, LGA and state, which the pair already shares. */
  sharedPlaceNames: string[];
  /** Toll figures either side reports. */
  tollFigures: number[];
}

export interface LinkageResult {
  linked: boolean;
  /** Which signal produced the link, for the audit trail. */
  evidence: string[];
  why?: string;
}

const TOLL_SIGNAL_FLOOR = 5;

/**
 * Linked only when the two sides name the same person, or share a specific site
 * and a matching toll of at least five victims. Site plus clock time is not enough:
 * time phrases in these reports are almost always "morning" or a weekday.
 */
export function claimsLink({ candidate, record, sharedPlaceNames, tollFigures }: LinkageInput): LinkageResult {
  const candidatePeople = new Set(candidate.people.flatMap(personTokens));
  const sharedPeople = [...new Set(record.people.flatMap(personTokens))].filter((token) => candidatePeople.has(token));

  const recordSites = new Set(record.sites.flatMap((site) => siteTokens(site, sharedPlaceNames)));
  const sharedSites = [...new Set(candidate.sites.flatMap((site) => siteTokens(site, sharedPlaceNames)))]
    .filter((token) => recordSites.has(token));

  const figures = new Set(tollFigures.filter((value) => Number.isFinite(value) && value >= TOLL_SIGNAL_FLOOR));
  const sharedTolls = candidate.tolls
    .filter((claim) => claim.value >= TOLL_SIGNAL_FLOOR)
    .filter((claim) => record.tolls.some((other) => other.victims === claim.victims && other.value === claim.value))
    .filter((claim) => figures.has(claim.value));

  // An exact full-name match links even when every word is a common name, because
  // two identical two-part names are not a coincidence.
  const candidateFull = candidate.people.map(personNameKey).filter((key) => key.length >= 2);
  const recordFull = record.people.map(personNameKey).filter((key) => key.length >= 2);
  const fullMatch = candidateFull.find((key) => recordFull.some((other) => other.join(" ") === key.join(" ")));
  if (fullMatch) {
    return { linked: true, evidence: [`person-full:${fullMatch.join(" ")}`] };
  }
  if (sharedPeople.length) {
    return { linked: true, evidence: [`person:${sharedPeople[0]}`] };
  }
  if (sharedSites.length && sharedTolls.length) {
    return {
      linked: true,
      evidence: [`site:${sharedSites[0]}`, `toll:${sharedTolls[0].victims}:${sharedTolls[0].value}`],
    };
  }
  if (sharedSites.length) {
    return { linked: false, evidence: [], why: "shares a specific site but no matching toll, which these reports rarely state consistently" };
  }
  if (sharedTolls.length) {
    return { linked: false, evidence: [], why: "shares a toll but no specific site; counts are copied between outlets" };
  }
  return { linked: false, evidence: [], why: "no shared named person, specific site or matching toll between the two sets of articles" };
}
