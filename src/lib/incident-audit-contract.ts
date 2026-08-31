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
