import IncidentCrosswalkEvidence from "./models/IncidentCrosswalkEvidence";

export interface TrendEligibilityResult {
  eligible: boolean;
  status: "PASS" | "BLOCKED" | "UNRESOLVED";
  auditRunId: string | null;
  findings: string[];
}

const DEFAULT_FINDING =
  "Comparative monthly and state rankings are withheld until an independent official-source and authorised structured-dataset crosswalk passes.";

export async function getTrendEligibility(): Promise<TrendEligibilityResult> {
  const gate = await IncidentCrosswalkEvidence.findOne({ recordType: "trend_gate" })
    .sort({ createdAt: -1, _id: -1 })
    .select("auditRunId accessStatus trendEligible findings")
    .lean();

  if (!gate || !gate.trendEligible || gate.accessStatus !== "PASS") {
    return {
      eligible: false,
      status: gate?.accessStatus === "UNRESOLVED" ? "UNRESOLVED" : "BLOCKED",
      auditRunId: gate?.auditRunId ?? null,
      findings: gate?.findings?.length ? gate.findings : [DEFAULT_FINDING],
    };
  }

  return {
    eligible: true,
    status: "PASS",
    auditRunId: gate.auditRunId,
    findings: gate.findings?.length ? gate.findings : [],
  };
}
