/**
 * Shared place-name identity rules for Nigerian incident locations.
 *
 * Publishers and models spell the same place differently. "Kaura Namoda" and
 * "Kauran Namoda" are the same LGA; "Karim Lamido" appears as "Kalim-Lamido";
 * "Gamboru Ngala" is written as the LGA "Ngala". Exact string comparison
 * either splits one event into several records or merges distinct places, and
 * the ingest gates and the duplicate audit must agree on one rule set.
 *
 * Two levels are exposed deliberately:
 *
 * - `placesEquivalent` is strict enough to merge without a model. It accepts
 *   compound spacing and one-character spelling variants, nothing looser.
 * - `placesPlausiblySame` decides only whether a pair is worth a semantic
 *   (model) comparison. It never merges or blocks anything by itself.
 *
 * Similar-looking but genuinely different names must stay apart: Hong/Song,
 * Kajuru/Kauru and Ibadan South East/West are all rejected, because a
 * single-token comparison requires a shared prefix and multi-token
 * comparisons require an unchanged anchor token.
 */

const GENERIC_PLACE_WORDS = /\b(?:town|village|community|area|settlement|the)\b/g;
const IGNORED_PLACE_WORDS = new Set(["near", "of", "in", "at"]);
const UNKNOWN_PLACE = /^(?:unknown|unspecified|unstated|not stated|not specified|n\/?a|none)?$/i;

function cleanPlace(value: string): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(GENERIC_PLACE_WORDS, " ")
    .toLowerCase()
    .trim();
}

/** Normalized, sorted, de-duplicated place tokens. Numeric tokens are kept
 * because they identify subdivisions: "Garki Area 1" and "Garki Area 2" are
 * different places. */
export function normalizePlaceTokens(value: string): string[] {
  const cleaned = cleanPlace(value).replace(/[^a-z0-9\s]/g, " ");
  return [...new Set(cleaned.split(/\s+/).filter((part) => (part.length > 1 || /^\d+$/.test(part)) && !IGNORED_PLACE_WORDS.has(part)))].sort();
}

/** Space and punctuation free form, so "Gamboru Ngala" equals "Gamboru-Ngala". */
export function placeKey(value: string): string {
  return cleanPlace(value).replace(/[^a-z0-9]/g, "");
}

/** True when the field carries no usable place name. */
export function isUnknownPlace(value: string | null | undefined): boolean {
  const raw = String(value || "").trim();
  if (!raw || UNKNOWN_PLACE.test(raw)) return true;
  const tokens = normalizePlaceTokens(raw);
  return tokens.length === 0 || tokens.every((token) => UNKNOWN_PLACE.test(token));
}

function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let index = 0;
  while (index < limit && a[index] === b[index]) index++;
  return index;
}

/** One insertion, deletion or substitution, and nothing more. */
function isOneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Spelling variant of a single place word. A shared prefix and a minimum
 * length keep Hong/Song and Kajuru/Kauru apart while accepting Kaura/Kauran,
 * Binari/Binnari and, with a shorter prefix, anchored pairs such as
 * Karim-Lamido/Kalim-Lamido.
 */
function isPlaceWordVariant(a: string, b: string, minPrefix = 3): boolean {
  if (a === b) return false;
  if (Math.min(a.length, b.length) < 5) return false;
  if (commonPrefixLength(a, b) < minPrefix) return false;
  return isOneEditApart(a, b);
}

function tokensEquivalent(left: string[], right: string[]): boolean {
  if (!left.length || !right.length) return false;
  if (Math.abs(left.length - right.length) > 1) return false;
  const shared = left.filter((token) => right.includes(token)).length;
  return shared / Math.max(left.length, right.length) >= 0.8;
}

/**
 * Exactly one token differs as a spelling variant, every other token is
 * identical, and at least one anchor token is shared.
 */
function hasSingleVariantWord(left: string[], right: string[], minPrefix = 3): boolean {
  if (left.length < 2 || left.length !== right.length) return false;
  const unmatchedLeft = left.filter((token) => !right.includes(token));
  const unmatchedRight = right.filter((token) => !left.includes(token));
  if (unmatchedLeft.length !== 1 || unmatchedRight.length !== 1) return false;
  return isPlaceWordVariant(unmatchedLeft[0], unmatchedRight[0], minPrefix);
}

/** Every token of the shorter name appears in the longer one. */
function isContainedPlace(left: string[], right: string[]): boolean {
  if (!left.length || !right.length) return false;
  const [shorter, longer] = left.length <= right.length ? [left, right] : [right, left];
  return shorter.every((token) => longer.includes(token));
}

/**
 * Strict equivalence, safe to merge on: identical after normalizing spacing,
 * punctuation and generic words, a single spelling variant, or near-total
 * token agreement.
 */
export function placesEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  if (isUnknownPlace(a) || isUnknownPlace(b)) return false;
  const keyA = placeKey(a as string);
  const keyB = placeKey(b as string);
  if (keyA && keyA === keyB) return true;
  const left = normalizePlaceTokens(a as string);
  const right = normalizePlaceTokens(b as string);
  if (tokensEquivalent(left, right)) return true;
  return hasSingleVariantWord(left, right);
}

/**
 * Tolerant comparison used only to decide whether a pair deserves a semantic
 * check. Adds containment ("Ngala" against "Gamboru Ngala") and single-token
 * spelling variants on top of the strict rules.
 */
export function placesPlausiblySame(a: string | null | undefined, b: string | null | undefined): boolean {
  if (placesEquivalent(a, b)) return true;
  if (isUnknownPlace(a) || isUnknownPlace(b)) return false;
  const left = normalizePlaceTokens(a as string);
  const right = normalizePlaceTokens(b as string);
  if (left.length === 1 && right.length === 1) return isPlaceWordVariant(left[0], right[0]);
  if (isContainedPlace(left, right)) return true;
  // An anchored variant needs only a two-character prefix, because the
  // unchanged token already fixes the place. Karim-Lamido/Kalim-Lamido and
  // Kajuru/Kauru both land here and are left to the semantic check.
  return hasSingleVariantWord(left, right, 2);
}

/**
 * Specific settlement comparison for the deterministic merge gate. Both sides
 * must carry a real town name; unknown values never match.
 */
export function sameSpecificLocation(a: string | null | undefined, b: string | null | undefined): boolean {
  return placesEquivalent(a, b);
}

/**
 * LGA comparison. Unknown or absent values on either side are treated as
 * compatible because the settlement comparison carries the identity in that
 * case.
 */
export function lgaCompatible(a: string | null | undefined, b: string | null | undefined): boolean {
  if (isUnknownPlace(a) || isUnknownPlace(b)) return true;
  return placesPlausiblySame(a, b);
}

/** LGA comparison that requires both sides to name a place. */
export function sameLga(a: string | null | undefined, b: string | null | undefined): boolean {
  if (isUnknownPlace(a) || isUnknownPlace(b)) return false;
  return placesEquivalent(a, b);
}
