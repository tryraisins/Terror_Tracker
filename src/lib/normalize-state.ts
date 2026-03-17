/**
 * Nigerian state name normalization utilities.
 * Ensures consistent state names across ingestion, deduplication, and queries.
 */

const CANONICAL_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type NigerianState = (typeof CANONICAL_STATES)[number];

/** Lowercase lookup map for fast matching */
const STATE_LOOKUP = new Map<string, string>(
  CANONICAL_STATES.map((s) => [s.toLowerCase(), s]),
);

/** Extra aliases that map to canonical names */
const ALIASES: Record<string, string> = {
  "federal capital territory": "FCT",
  "abuja": "FCT",
  "fct": "FCT",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
  "nassarawa": "Nasarawa",
};

/**
 * Normalize a raw state string to its canonical form.
 *
 * Handles:
 * - Trailing " State" suffix ("Borno State" → "Borno")
 * - FCT variants ("Federal Capital Territory", "Abuja" → "FCT")
 * - Multi-state strings ("Borno and Yobe", "Borno/Yobe") → first state
 * - Case insensitivity
 */
export function normalizeStateName(raw: string): string {
  if (!raw) return "Unknown";

  let s = raw.trim();

  // Split multi-state entries and take the first (primary) state
  if (/[\/;]/.test(s) || /\band\b/i.test(s)) {
    const parts = s.split(/[\/;]|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      s = parts[0];
    }
  }

  // Strip trailing " State"
  s = s.replace(/\s+state$/i, "").trim();

  // Check aliases first (case-insensitive)
  const aliasMatch = ALIASES[s.toLowerCase()];
  if (aliasMatch) return aliasMatch;

  // Check canonical list (case-insensitive)
  const canonical = STATE_LOOKUP.get(s.toLowerCase());
  if (canonical) return canonical;

  // Fuzzy fallback: try matching after stripping hyphens/extra spaces
  const cleaned = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const cleanedMatch = STATE_LOOKUP.get(cleaned.toLowerCase());
  if (cleanedMatch) return cleanedMatch;

  // Return title-cased original as fallback
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Check if two state strings refer to the same state.
 * Handles multi-state entries by checking if either contains the other's primary state.
 */
export function statesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;

  const normA = normalizeStateName(a);
  const normB = normalizeStateName(b);

  // Direct match after normalization
  if (normA === normB) return true;

  // For multi-state entries, check if any sub-state overlaps
  const extractStates = (raw: string): string[] => {
    const parts = raw.trim().split(/[\/;]|\s+and\s+/i).map((p) => p.trim()).filter(Boolean);
    return parts.map(normalizeStateName);
  };

  const statesA = extractStates(a);
  const statesB = extractStates(b);

  for (const sa of statesA) {
    for (const sb of statesB) {
      if (sa === sb) return true;
    }
  }

  return false;
}

/** Exported for use in Gemini prompt and validation */
export const VALID_STATE_NAMES = CANONICAL_STATES;
