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
  scope: [
    "Include one specific completed original organized violent/security event, abduction, political attack/thuggery event, or qualifying group property attack in Nigeria.",
    "Include attacks on civilians or security personnel when the source describes the hostile event itself, even if casualties are zero or unknown.",
    "Include property-only arson, sabotage or destruction only when direct evidence supports premeditated or coordinated action by a group of people.",
    "Exclude routine Nigerian Army/security-force work: deployments, patrols, raids on hideouts, clearance operations, arrests, weapons recovery, attacker-only kills, airstrikes, commendations and operational-result reports.",
    "Allow an Army/security-force report only when it explicitly documents the rescue or release of kidnapping victims and identifies the original abduction/attack date and location; the rescue report is corroborating evidence, not a second incident.",
    "Exclude opinion, analysis, background, policy, threats without a completed event, political rhetoric, peaceful protest, accident/disaster, isolated vandalism, ordinary individual crime, court and general roundup articles.",
    "A headline keyword alone never qualifies a record. Require direct-source narrative evidence, a canonical Nigerian state and at least the supported event month; never substitute publication date.",
  ],
  date: [
    "Prefer the exact original event day when direct evidence supports it.",
    "Use date_range with both bounds when evidence supports only a period of days; use the range start as a storage anchor, not as an asserted exact date.",
    "Use month_only when the event month is supported but no narrower period is; use the first day as a storage anchor and retain the full month range.",
    "Do not publish datePrecision unknown. Mark date_range and month_only records developing with date-uncertainty.",
  ],
  location: [
    "Use an exact town, village, ward, road, facility or coordinates when a direct source states it.",
    "If the precise town is not available, use the best source-supported surrounding area or LGA within the canonical state.",
    "If only the state is supported, keep the incident only when the source is event-specific and direct; mark the location as approximate_state.",
    "For a border incident, assign one best-supported primary state, record the alternative state in notes, and never create one record per state.",
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
