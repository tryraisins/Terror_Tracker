import Attack from "./models/Attack";

/**
 * Active incident records must use MongoDB's BSON date type. A string that
 * looks like an ISO date is not equivalent for range queries and aggregations.
 */
export const INVALID_ACTIVE_ATTACK_DATE_FILTER: Record<string, unknown> = {
  _deleted: { $ne: true },
  $expr: { $ne: [{ $type: "$date" }, "date"] },
} as const;

export function parseIncidentDate(value: unknown, context: string): Date {
  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(String(value ?? ""));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`[${context}] Incident date is missing or invalid.`);
  }
  return parsed;
}

export async function countInvalidActiveAttackDates(): Promise<number> {
  return Attack.countDocuments(INVALID_ACTIVE_ATTACK_DATE_FILTER);
}

export async function assertActiveAttackDateIntegrity(context: string): Promise<void> {
  const count = await countInvalidActiveAttackDates();
  if (count > 0) {
    throw new Error(
      `[${context}] BLOCKED: ${count} active incident record(s) do not have a BSON Date in the date field.`,
    );
  }
}
