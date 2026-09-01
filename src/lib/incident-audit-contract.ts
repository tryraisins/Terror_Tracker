import { createHash } from "crypto";

export const CROSSWALK_AUDIT_RUN_ID = "crosswalk-2026-01-to-08" as const;

export const CANONICAL_NIGERIA_JURISDICTIONS = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
] as const;

export type CanonicalNigeriaJurisdiction =
  (typeof CANONICAL_NIGERIA_JURISDICTIONS)[number];

export const UNRESOLVED_REASON_CODES = [
  "DATE_CONFLICT",
  "DATE_NOT_STATED",
  "LOCATION_INSUFFICIENT",
  "ORIGINAL_INCIDENT_UNCLEAR",
  "POSSIBLE_DUPLICATE",
  "SOURCE_ACCESS_LIMITATION",
] as const;

export const REVISED_2026_AUDIT_POLICY = {
  location: [
    "Use an exact town, village, ward, road, facility or coordinates when a direct source states it.",
    "If the precise town is not available, use the best source-supported surrounding area or LGA within the canonical state.",
    "If only the state is supported, keep the incident only when the source is event-specific and direct; mark the location as approximate_state.",
    "Do not invent an LGA or town to make a record look precise.",
  ],
  casualties: [
    "Count victims only: civilians, soldiers, police, vigilantes and other security personnel.",
    "Never count attacker, terrorist, insurgent or bandit fatalities as victim casualties.",
    "Use exact when credible direct sources agree on a specific victim count.",
    "Use range when credible direct sources conflict; preserve min, max and a representative midpoint estimate.",
    "Use estimate for source language such as about, over, more than, at least, scores or hundreds.",
    "Use unknown only when the impact is reported but no defensible count, estimate or range can be derived.",
  ],
  trendLanguage:
    "Post-April incident counts are not evidence of a decline while source collection rules, date/location strictness and unresolved evidence gaps differ across months.",
} as const;

export function stableAuditHash(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      );
    }
    return typeof input === "string" ? input.trim() : input;
  };

  return createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
}
