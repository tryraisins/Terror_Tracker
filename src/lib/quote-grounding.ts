/**
 * Grounding rules for an auto-resolved duplicate lead.
 *
 * The candidate article is the reason the pair matched in the first place, so a
 * sentence from that article naming the settlement and one of the two tolls is
 * nearly always present and proves very little on its own. These rules therefore
 * require something stronger: the quoted sentence must also carry a distinctive
 * detail that appears in the STORED record's own evidence (a named person, a
 * specific site, a time of day), and that detail must not be one the candidate
 * already shares through the fields used to match it.
 *
 * They are a filter, not proof. A research-grade linkage test would need the
 * stored record's source articles and a claim-level comparison; until then, every
 * accepted quote is written to the disposition note and the artifact so the
 * decision can be read and reversed.
 */

const STOPWORDS = new Set([
  "about", "after", "again", "against", "allege", "alleged", "also", "among", "another", "area", "around",
  "attack", "attacked", "authorities", "bandit", "bandits", "because", "before", "being", "between", "bodies",
  "body", "community", "confirmed", "could", "dead", "death", "deaths", "during", "early", "eight", "eighteen",
  "eleven", "fifteen", "fifty", "five", "forty", "four", "fourteen", "from", "gunmen", "have", "hospital",
  "hundred", "injured", "into", "killed", "killing", "local", "market", "morning", "night", "nine", "nineteen",
  "other", "people", "police", "reported", "residents", "said", "search", "seven", "seventeen", "several",
  "shooting", "six", "sixteen", "some", "source", "state", "still", "their", "there", "these", "they", "thirteen",
  "thirty", "this", "those", "three", "through", "told", "twelve", "twenty", "under", "village", "villagers",
  "were", "when", "where", "which", "while", "with", "would", "wounded", "years", "yesterday",
]);

export const normalizeForQuote = (value: string) =>
  value.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

const TENS = new Set([20, 30, 40, 50, 60, 70, 80, 90]);
const VICTIM_NOUNS = new Set([
  "killed", "dead", "died", "death", "deaths", "bodies", "body", "corpses", "corpse", "casualties",
  "abducted", "kidnapped", "injured", "wounded", "displaced", "victims", "persons", "people",
  "villagers", "worshippers", "residents", "farmers", "traders", "students", "children", "travellers",
]);

/** Numbers as written, so "1,200" and "twenty-five" are single values. */
export function numbersIn(text: string): Set<number> {
  const found = new Set<number>();
  const lower = text.toLowerCase();
  for (const match of lower.match(/\d[\d,]*/g) || []) {
    const value = Number(match.replace(/,/g, ""));
    if (Number.isFinite(value)) found.add(value);
  }
  for (const match of lower.match(/\b(?:[a-z]+-)?[a-z]+\b/g) || []) {
    if (NUMBER_WORDS[match] !== undefined) found.add(NUMBER_WORDS[match]);
  }
  // Hyphenated compounds: "twenty-five" is 25, not 20 and 5.
  for (const match of lower.match(/\b([a-z]+)-([a-z]+)\b/g) || []) {
    const [a, b] = match.split("-");
    if (TENS.has(NUMBER_WORDS[a]) && NUMBER_WORDS[b] !== undefined && NUMBER_WORDS[b] < 10) {
      found.add(NUMBER_WORDS[a] + NUMBER_WORDS[b]);
    }
  }
  return found;
}

/** Distinctive words from the stored record's own evidence, for anchoring. */
export function anchorCandidates(recordEvidenceText: string, exclude: string[]): Set<string> {
  const blocked = new Set([...STOPWORDS, ...exclude.flatMap((value) => normalizeForQuote(value).split(" "))]);
  const words = new Set<string>();
  for (const word of normalizeForQuote(recordEvidenceText).split(" ")) {
    if (word.length < 5 || blocked.has(word) || /^\d+$/.test(word)) continue;
    words.add(word);
  }
  return words;
}

/**
 * Find a sentence that states a toll next to a victim noun.
 *
 * Used to rescue a figure whose model-supplied quote was paraphrased: the number
 * is usually still in the article, attached to a different sentence than the model
 * reproduced. Returns the sentence when found, so it can serve as sourceText.
 */
export function findTollSentence(articleText: string, value: number, victims: "killed" | "abducted" | "injured" | "displaced"): string | null {
  const nouns = TOLL_NOUNS[victims];
  const sentences = articleText.split(/(?<=[.!?])\s+|\n+/);
  for (const sentence of sentences) {
    if (!numbersIn(sentence).has(value)) continue;
    const words = normalizeForQuote(sentence).split(" ");
    if (!words.some((word) => nouns.has(word))) continue;
    return sentence.trim().slice(0, 300);
  }
  return null;
}

export const TOLL_NOUNS: Record<"killed" | "abducted" | "injured" | "displaced", Set<string>> = {
  killed: new Set(["killed", "dead", "died", "death", "deaths", "bodies", "body", "corpses", "corpse", "casualties"]),
  abducted: new Set(["abducted", "kidnapped", "kidnap", "missing", "hostages"]),
  injured: new Set(["injured", "wounded", "hospital", "hospitalised", "hospitalized"]),
  displaced: new Set(["displaced", "shelter", "camp", "fled"]),
};

export interface GroundingInput {
  quote: string;
  articleText: string;
  place: string;
  tollFigures: number[];
  recordEvidenceText: string;
  /** Fields the pair already shares, so their words cannot count as an anchor. */
  sharedFields: string[];
}

export interface GroundingResult {
  ok: boolean;
  why?: string;
  anchor?: string;
}

/**
 * A quote counts only when it is one sentence of the body, long enough to carry
 * information, names the settlement, states one of the two records' tolls next to
 * a victim word, and shares a distinctive detail with the stored record.
 */
export function groundingCheck({ quote, articleText, place, tollFigures, recordEvidenceText, sharedFields }: GroundingInput): GroundingResult {
  const normalizedQuote = normalizeForQuote(quote);
  if (normalizedQuote.length < 60) return { ok: false, why: `quote too short (${normalizedQuote.length} chars)` };

  const segments = articleText
    .split(/(?<=[.!?])\s+|\n+/)
    .map(normalizeForQuote)
    .filter((segment) => segment.length > 0);
  const containing = segments.find((segment) => segment.includes(normalizedQuote));
  if (!containing) return { ok: false, why: "quote is not a single sentence of the article body" };

  const wanted = normalizeForQuote(place);
  if (wanted.length < 3) return { ok: false, why: "record has no usable settlement name to anchor the quote" };
  if (!` ${normalizedQuote} `.includes(` ${wanted} `)) return { ok: false, why: "quote does not name the settlement" };

  const figures = new Set(tollFigures.filter((value) => Number.isFinite(value) && value > 0));
  if (!figures.size) return { ok: false, why: "neither record states a toll to anchor the quote" };
  const tokens = normalizedQuote.split(" ");
  const statesToll = tokens.some((token, index) => {
    const window = tokens.slice(Math.max(0, index - 3), index + 4);
    if (!window.some((word) => VICTIM_NOUNS.has(word))) return false;
    return [...numbersIn(window.join(" "))].some((value) => figures.has(value));
  });
  if (!statesToll) return { ok: false, why: "quote does not state either record's toll next to a victim count" };

  // The article produced the candidate, so quoting it is weak on its own. Require a
  // distinctive detail that belongs to the STORED record and is not merely a field
  // the two already share.
  const anchors = anchorCandidates(recordEvidenceText, [place, ...sharedFields]);
  const shared = [...anchors].find((word) => ` ${normalizedQuote} `.includes(` ${word} `));
  if (!shared) return { ok: false, why: "quote shares no distinctive detail with the stored record" };

  return { ok: true, anchor: shared };
}

/**
 * Does this quote actually state the count, for this victim category?
 *
 * A verbatim quote proves nothing on its own: "three killed, seven abducted" is in
 * the article, and it will happily ground a model figure of seven killed. The number
 * and the category word have to sit in the same clause.
 */
export function countQuoteSupports(quote: string, value: number, victims: "killed" | "abducted" | "injured" | "displaced"): boolean {
  if (!quote || !Number.isFinite(value)) return false;
  // Commas inside a number ("1,200") are not clause breaks.
  const clauses = quote.split(/(?<!\d),(?!\d)|[;:.()]|\band\b|\bwhile\b|\bwith\b/gi);
  return clauses.some((clause) => {
    if (!numbersIn(clause).has(value)) return false;
    const words = normalizeForQuote(clause).split(" ").filter(Boolean);
    return words.some((word) => TOLL_NOUNS[victims].has(word));
  });
}
/**
 * Sentence spans of a text, used to give a quote a position rather than an identity
 * by wording. Two events quoting the same sentence must collide even when they quote
 * different fragments of it, and two sentences that happen to read the same must not.
 */
export function sentenceSpans(text: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  const boundary = /[.!?](?:\s|$)|\n+/g;
  let start = 0;
  while (boundary.exec(text) !== null) {
    spans.push({ start, end: boundary.lastIndex });
    start = boundary.lastIndex;
  }
  if (start < text.length) spans.push({ start, end: text.length });
  return spans;
}

/** The start offset of the sentence that contains `index`, or -1. */
export function sentenceStartAt(spans: Array<{ start: number; end: number }>, index: number): number {
  if (index < 0) return -1;
  const span = spans.find((candidate) => index >= candidate.start && index < candidate.end);
  return span ? span.start : -1;
}