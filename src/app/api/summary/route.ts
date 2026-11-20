import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";
import { assertActiveAttackDateIntegrity } from "@/lib/attack-data-integrity";
import { normalizeStateName } from "@/lib/normalize-state";
import { inPeriod, summaryDatePrecision, type SummaryPayload, type SummaryRow } from "@/lib/summary";

const NIGERIA_TIMEZONE = "Africa/Lagos";
const lagosDay = new Intl.DateTimeFormat("en-CA", { timeZone: NIGERIA_TIMEZONE });

type MetaCount = { precision?: string; max?: number | null } | undefined;
type LeanAttack = {
  _id: unknown; title: string; date: Date; datePrecision?: string; dateRange?: { start?: Date | string | null; end?: Date | string | null };
  location?: { state?: string; lga?: string; town?: string };
  group?: string; status: SummaryRow["st"]; tags?: string[];
  casualties?: { killed?: number | null; kidnapped?: number | null; injured?: number | null };
  casualtyMeta?: { killed?: MetaCount; kidnapped?: MetaCount };
};

const openMinimum = (meta: MetaCount) => meta?.precision === "range" && meta.max == null;
const rangeDay = (value?: Date | string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
};

/**
 * One slim row per active record this Nigeria calendar year. The public overview,
 * map, patterns and state pages aggregate these rows on the client so every panel
 * follows the same measure and period. Fields stay within the public allowlist.
 */
export async function GET(req: NextRequest) {
  const securityError = await applySecurityChecks(req, { rateLimit: 60, rateLimitWindow: 60_000 });
  if (securityError) return securityError;

  try {
    await connectDB();
    await assertActiveAttackDateIntegrity("GET /api/summary");
    const today = lagosDay.format(new Date());
    const year = Number(today.slice(0, 4));
    const startOfYear = new Date(`${year}-01-01T00:00:00.000+01:00`);

    const records = await Attack.find({ _deleted: { $ne: true }, datePrecision: { $ne: "unknown" }, date: { $gte: startOfYear } })
      .sort({ date: -1 })
      .select("title date datePrecision dateRange location group status casualties casualtyMeta tags")
      .lean<LeanAttack[]>();

    const rows: SummaryRow[] = records.map((record) => ({
      id: String(record._id),
      d: lagosDay.format(new Date(record.date)),
      dp: summaryDatePrecision(record.datePrecision, record.tags),
      ds: rangeDay(record.dateRange?.start),
      de: rangeDay(record.dateRange?.end),
      t: record.title,
      town: record.location?.town || "",
      lga: record.location?.lga || "",
      s: normalizeStateName(record.location?.state || "") || record.location?.state || "",
      g: (record.group || "Unknown").trim(),
      k: record.casualties?.killed ?? null,
      ab: record.casualties?.kidnapped ?? null,
      i: record.casualties?.injured ?? null,
      st: record.status,
      ko: openMinimum(record.casualtyMeta?.killed) || undefined,
      abo: openMinimum(record.casualtyMeta?.kidnapped) || undefined,
    }));

    const payload: SummaryPayload = { today, year, records: rows.filter(inPeriod("year", today)) };
    return setCORSHeaders(NextResponse.json(payload));
  } catch (error) {
    console.error("GET /api/summary error:", error);
    return setCORSHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}
