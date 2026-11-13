/**
 * Rescue a settlement for held candidates whose location extraction returned
 * state only. The article text often names the place; the pipeline lost it.
 *
 * Dry run: prints the proposed location and the quoted sentence. Writes
 * `held-rescued.jsonl` next to the decisions; it never edits an attack.
 *
 *   npx tsx scripts/rescue-held-locations.ts --decisions scratch/backfill/adjudication/held.jsonl --held scratch/backfill/held/held.json --out scratch/backfill/adjudication/held-rescued.jsonl
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";

const arg = (name: string, fallback?: string) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const isPlaceholder = (value: string) => !value || /^(unknown|unspecified|n\/?a|multiple|various)$/i.test(value.trim());

function readJsonl(file: string): Array<Record<string, any>> {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

async function main() {
  const decisionsFile = arg("decisions");
  const heldFile = arg("held");
  const out = arg("out");
  if (!decisionsFile || !heldFile || !out) throw new Error("--decisions, --held and --out are required");

  const { fetchArticleText } = await import("../src/lib/search-led-discovery");
  const decisions = readJsonl(decisionsFile);
  const held = JSON.parse(fs.readFileSync(heldFile, "utf8").replace(/^\uFEFF/, ""));
  const byHash = new Map<string, Record<string, any>>();
  for (const row of held) if (row.candidateHash) byHash.set(row.candidateHash, row);

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY missing");
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-flash";

  const needs = decisions.filter((row) => {
    if (row.verdict !== "promote") return false;
    const loc = row.evidence?.candidateLocation || {};
    return isPlaceholder(String(loc.town || "")) && isPlaceholder(String(loc.lga || ""));
  });
  console.log(`state-only promotes needing a settlement: ${needs.length}`);

  const results: Array<Record<string, any>> = [];
  for (const decision of needs) {
    const source = byHash.get(decision.id);
    const candidate = source?.candidate;
    const url = decision.url || source?.url;
    if (!candidate || !url) continue;
    const article = await fetchArticleText(url, String(candidate.title || ""));
    if (!article) { results.push({ id: decision.id, rescued: false, reason: "article fetch failed" }); continue; }
    const prompt = [
      "Return strict JSON only.",
      `State: ${candidate.location?.state}.`,
      "From the article, identify the settlement (town or village) where the incident happened, and its LGA if stated.",
      'Use {"town":"...","lga":"...","quote":"..."} where quote is one sentence from the article naming the settlement.',
      'If the article does not name a settlement, return {"town":null,"lga":null,"quote":null}. Do not guess.',
      "",
      article.text.slice(0, 8000),
    ].join("\n");
    let parsed: { town?: string | null; lga?: string | null; quote?: string | null } = {};
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model, thinking: { type: "disabled" }, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
      const body = await response.json();
      parsed = JSON.parse(body.choices?.[0]?.message?.content || "{}");
    } catch (error) {
      results.push({ id: decision.id, rescued: false, reason: `model failed: ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }
    const quote = String(parsed.quote || "").toLowerCase().replace(/\s+/g, " ");
    const town = String(parsed.town || "").trim();
    const supported = Boolean(town) && quote.includes(town.toLowerCase().split(" ")[0]) && article.text.toLowerCase().includes(quote.slice(0, 40));
    results.push({ id: decision.id, title: candidate.title, url, town: town || null, lga: parsed.lga || null, quote: parsed.quote || null, supported });
    console.log(`${supported ? "OK " : "NO "} ${decision.id.slice(0, 12)} ${town || "-"} / ${parsed.lga || "-"} | ${String(candidate.title).slice(0, 70)}`);
    if (supported) {
      decision.evidence = { ...decision.evidence, candidateLocation: { ...candidate.location, town, lga: parsed.lga || candidate.location?.lga || "Unknown", precision: "exact", notes: `Settlement rescued from source: ${parsed.quote}` }, locationRescue: { quote: parsed.quote } };
    }
  }

  fs.writeFileSync(out, decisions.map((row) => JSON.stringify(row)).join("\n") + "\n");
  fs.writeFileSync(out.replace(/\.jsonl$/, "-report.json"), JSON.stringify(results, null, 2));
  console.log(`rescued ${results.filter((row) => row.supported).length} of ${needs.length}; decisions written to ${out}`);
}

main().catch((error) => { console.error("FATAL", error); process.exitCode = 1; });
