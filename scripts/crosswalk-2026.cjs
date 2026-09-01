/*
 * Independent 2026 incident crosswalk and unresolved-candidate persistence.
 *
 * Safety properties:
 * - the public `attacks` collection is read-only in every mode;
 * - network results are evidence leads, never automatic attack imports;
 * - generated evidence remains under the ignored audit-2026 directory;
 * - writes require an already-passing dry-run manifest and target only the two
 *   separate audit collections;
 * - rerunning identical inputs is a database no-op.
 */
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
const mongoose = require("mongoose");

const AUDIT_RUN_ID = "crosswalk-2026-01-to-08";
const ROOT = path.resolve(process.cwd(), "audit-2026", "crosswalk-2026-01-to-08");
const SCOPE_START = new Date("2026-01-01T00:00:00.000+01:00");
const SCOPE_END_EXCLUSIVE = new Date("2026-08-30T00:00:00.000+01:00");
const PERIOD_END = new Date("2026-08-29T23:59:59.999+01:00");
const STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
const STATE_SET = new Set(STATES);
const MONTHS = Array.from({ length: 8 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);
const REASON_CODES = new Set(["DATE_CONFLICT","DATE_NOT_STATED","LOCATION_INSUFFICIENT","ORIGINAL_INCIDENT_UNCLEAR","POSSIBLE_DUPLICATE","SOURCE_ACCESS_LIMITATION"]);
const LOCATION_PRECISION_CODES = new Set(["exact_lga_or_town","state_only","exact","surrounding_area","approximate_lga","approximate_state","unknown"]);
const CASUALTY_PRECISION_CODES = new Set(["exact","estimate","range","unknown","not_reported"]);
const EVENT_PATTERN = /\b(attack(?:ed|s|ing)?|ambush(?:ed|es)?|raid(?:ed|s|ing)?|shoot(?:ing|s|ers?|shot)|kill(?:ed|s|ing)?|kidnap(?:ped|s|ping)?|abduct(?:ed|s|ing)?|clash(?:ed|es)?|gunmen|bandits?|terrorists?|insurgents?|herders?|communal|ied|explosion)\b/i;
const NON_INCIDENT_PATTERN = /\b(arrest(?:ed|s)?|weapons? recover(?:y|ed)|clearance operation|courtesy visit|conference|training|anniversary|election deployment)\b/i;
const DIRECT_URL = /^https?:\/\//i;
const args = new Set(process.argv.slice(2));
const COLLECT = args.has("--collect");
const EXECUTE = args.has("--execute");
const VERIFY = args.has("--verify-idempotency");
const ACLED_EXPLORER_SUMMARY = args.has("--acled-explorer-summary");
const DRY_RUN = args.has("--dry-run") || (!EXECUTE && !VERIFY);
const ACLED_EXPLORER_URL = "https://apps.acleddata.com/newexplorer/api/details?time_range=year&disorder_type=politicalviolence&country_id=566";

function sha(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object" && !(value instanceof Date)) return Object.fromEntries(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key, child]) => [key, stable(child)]));
  return value instanceof Date ? value.toISOString() : typeof value === "string" ? value.trim() : value;
}
function fingerprint(value) { return sha(JSON.stringify(stable(value))); }
function jsonl(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)) : []; }
function writeJson(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
function writeJsonl(file, rows) { fs.writeFileSync(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""), "utf8"); }
function asDate(value) { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date : null; }
function iso(value) { return asDate(value)?.toISOString() || null; }
function normalizeUrl(value) { try { const url = new URL(String(value)); url.hash = ""; for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|ref|output)/i.test(key)) url.searchParams.delete(key); return url.toString().replace(/\/$/, "").toLowerCase(); } catch { return String(value || "").trim().replace(/\/$/, "").toLowerCase(); } }
function stripHtml(value) { return String(value || "").replace(/<(script|style|svg|noscript|nav|footer|form)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim(); }
function monthKey(value) { return iso(value)?.slice(0, 7) || null; }
function inScope(value) { const date = asDate(value); return Boolean(date && date >= SCOPE_START && date < SCOPE_END_EXCLUSIVE); }
function unknown(value) { return !value || /^(unknown|n\/a|unspecified)$/i.test(String(value).trim()); }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function safeCasualty(value) { return Number.isInteger(value) && value >= 0 ? value : null; }
function casualtyAssessment(value, note) {
  const safe = safeCasualty(value);
  if (safe === null) return { value:null, meta:{ precision:"unknown", note } };
  return { value:safe, meta:{ precision:safe === 0 ? "not_reported" : "estimate", min:safe, max:safe, estimate:safe, note } };
}
function candidateImpact(input = {}) {
  const casualties = { killed:null, injured:null, kidnapped:null, displaced:null };
  const casualtyMeta = {};
  for (const field of Object.keys(casualties)) {
    const assessment = casualtyAssessment(input?.[field], "Candidate extractor value retained for review; victim-only and event-specific status must be confirmed before production use.");
    casualties[field] = assessment.value;
    casualtyMeta[field] = assessment.meta;
  }
  return { casualties, casualtyMeta };
}
function incidentType(proposal) { const text = `${proposal.title || ""} ${(proposal.tags || []).join(" ")}`.toLowerCase(); if (/\b(ied|bomb|explosion|suicide bomb)/.test(text)) return "IED"; if (/\b(communal|farmer|herder|intercommunity|inter-community)/.test(text)) return "communal_violence"; if (/\b(kidnap|abduct)/.test(text)) return "abduction"; if (EVENT_PATTERN.test(text)) return "armed_attack"; return "other"; }
function attackFingerprint(rows) { return fingerprint(rows.map((row) => ({ id: String(row._id), hash: row.hash || null, date: iso(row.date), deleted: row._deleted === true, updatedAt: iso(row.updatedAt) })).sort((a,b) => a.id.localeCompare(b.id))); }

async function mapLimit(items, concurrency, work) {
  let cursor = 0;
  const out = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, async () => {
    while (cursor < items.length) { const index = cursor++; out[index] = await work(items[index], index); }
  }));
  return out;
}

function requestText(url, { timeout = 15000, insecure = false, redirects = 4 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === "http:" ? http : https;
    const request = transport.get(parsed, {
      rejectUnauthorized: !insecure,
      headers: { "user-agent": "Mozilla/5.0 (compatible; TerrorTrackerEvidenceAudit/2026)", accept: "text/html,application/json;q=0.9,*/*;q=0.7" },
      timeout,
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects > 0) {
        response.resume();
        return resolve(requestText(new URL(response.headers.location, url).toString(), { timeout, insecure, redirects: redirects - 1 }));
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { if (body.length < 8_000_000) body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode || 0, body, finalUrl: url, contentType: response.headers["content-type"] || "" }));
    });
    request.on("timeout", () => request.destroy(new Error("request timeout")));
    request.on("error", reject);
  });
}

function npfArticle(html, url) {
  const title = stripHtml(html.match(/<h3[^>]+class=["'][^"']*post-title[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
  const publishedAt = stripHtml(html.match(/class=["'][^"']*post-date[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1] || "").match(/20\d{2}-\d{2}-\d{2}/)?.[0] || null;
  return { authority: "Nigeria Police Force", url, title, publishedAt, text: stripHtml(html), accessStatus: "PASS" };
}

function extractStates(text) {
  const found = [];
  for (const state of STATES) {
    const aliases = state === "FCT" ? ["FCT", "Abuja", "Federal Capital Territory"] : [state];
    if (aliases.some((alias) => new RegExp(`\\b${alias.replace(/ /g, "\\s+")}\\b`, "i").test(text))) found.push(state);
  }
  return unique(found);
}

function dateVariants(date) {
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const month = date.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
  const short = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }).replace(/\.$/, "");
  return [date.toISOString().slice(0,10), `${day} ${month} ${year}`, `${day}${day===1?"st":day===2?"nd":day===3?"rd":"th"} ${month} ${year}`, `${month} ${day}, ${year}`, `${short} ${day}, ${year}`, `${day} ${short} ${year}`];
}

function eventDateSupported(text, date) {
  const normalized = stripHtml(text);
  for (const variant of dateVariants(date)) {
    const index = normalized.toLowerCase().indexOf(variant.toLowerCase());
    if (index < 0) continue;
    const context = normalized.slice(Math.max(0, index - 220), index + variant.length + 220);
    const escapedDate = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const eventWords = "(?:attack(?:ed)?|ambush(?:ed)?|raid(?:ed)?|shooting|killing|kidnapping|abduction|clash|explosion|incident)";
    const explicitBefore = new RegExp(`\\b(?:on|during|since)\\s+(?:the\\s+)?${escapedDate}\\b.{0,140}${eventWords}`, "i");
    const explicitAfter = new RegExp(`${eventWords}.{0,180}\\b(?:on|occurred|happened|took\\s+place)\\s+(?:on\\s+)?(?:the\\s+)?${escapedDate}\\b`, "i");
    const metadataBeforeDate = context.slice(0, Math.max(0, context.toLowerCase().indexOf(variant.toLowerCase()))).slice(-80);
    if (!/\b(published|updated|posted|publication date|date:)\b/i.test(metadataBeforeDate) && (explicitBefore.test(context) || explicitAfter.test(context))) return { supported: true, contextHash: sha(context), variant };
  }
  return { supported: false, contextHash: null, variant: null };
}

async function collectOfficialReleases() {
  const releases = [];
  const access = [];
  const listingPages = Array.from({ length: 55 }, (_, index) => index + 1);
  const listingResults = await mapLimit(listingPages, 6, async (page) => {
    const url = `https://police.gov.ng/index.php/news?page=${page}`;
    try {
      const response = await requestText(url, { insecure: true });
      if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
      return [...response.body.matchAll(/\/index\.php\/news\/details\/(\d+)/gi)].map((match) => match[1]);
    } catch (error) {
      access.push({ authority: "Nigeria Police Force", url, status: "FAIL", reason: error.message });
      return [];
    }
  });
  const articleIds = unique(listingResults.flat());
  await mapLimit(articleIds, 10, async (id) => {
    const url = `https://police.gov.ng/index.php/news/details/${id}`;
    try {
      const response = await requestText(url, { insecure: true });
      if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
      const article = npfArticle(response.body, url);
      if (article.publishedAt >= "2026-01-01" && article.publishedAt <= "2026-08-29") releases.push(article);
    } catch (error) { access.push({ authority: "Nigeria Police Force", url, status: "FAIL", reason: error.message }); }
  });
  access.push({ authority: "Nigeria Police Force", url: "https://police.gov.ng/index.php/news", status: articleIds.length ? "PASS" : "FAIL", reason: `${articleIds.length} unique article IDs discovered; ${releases.length} releases fall in scope.` });

  try {
    const url = "https://defencehq.mil.ng/wp-json/wp/v2/posts?after=2026-01-01T00:00:00&before=2026-08-30T00:00:00&per_page=100&_fields=id,date,link,title,content,excerpt";
    const response = await requestText(url);
    if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
    const posts = JSON.parse(response.body);
    for (const post of posts) releases.push({ authority: "Defence Headquarters", url: post.link, title: stripHtml(post.title?.rendered), publishedAt: post.date?.slice(0,10) || null, text: stripHtml(post.content?.rendered || post.excerpt?.rendered), accessStatus: "PASS" });
    access.push({ authority: "Defence Headquarters", url, status: "PASS", reason: `${posts.length} releases retrieved in scope.` });
  } catch (error) { access.push({ authority: "Defence Headquarters", url: "https://defencehq.mil.ng/", status: "FAIL", reason: error.message }); }

  const indexSources = [
    ["Nigerian Army", "https://army.mil.ng/news/", true],
    ["Nigerian Air Force", "https://www.airforce.mil.ng/news", true],
    ["Nigerian Navy", "https://navy.mil.ng/", false],
  ];
  for (const [authority, url, insecure] of indexSources) {
    try {
      const response = await requestText(url, { insecure });
      const dynamicShell = response.status >= 200 && response.status < 300 && (!EVENT_PATTERN.test(stripHtml(response.body)) || stripHtml(response.body).length < 500);
      access.push({ authority, url, status: dynamicShell ? "PARTIAL" : response.status >= 200 && response.status < 300 ? "PASS" : "FAIL", reason: dynamicShell ? "Public index is reachable but does not expose a complete, date-filterable 2026 release archive." : `HTTP ${response.status}; public index inspected.` });
    } catch (error) { access.push({ authority, url, status: "FAIL", reason: error.message }); }
  }
  access.push({ authority: "Operation Hadin Kai", url: null, status: "BLOCKED", reason: "No complete first-party, date-filterable public release archive was located; media republications cannot prove release completeness." });
  releases.sort((a,b) => `${a.authority}|${a.publishedAt}|${a.url}`.localeCompare(`${b.authority}|${b.publishedAt}|${b.url}`));
  writeJsonl(path.join(ROOT, "official-releases.jsonl"), releases.map((row) => ({ ...row, textDigest: sha(row.text), textLength: row.text.length, eventLanguage: EVENT_PATTERN.test(`${row.title} ${row.text}`), states: extractStates(`${row.title} ${row.text}`), text: undefined })));
  writeJsonl(path.join(ROOT, "official-source-access.jsonl"), access);
  return { releases, access };
}

function loadCollectedOfficial() {
  const releases = jsonl(path.join(ROOT, "official-releases.jsonl")).map((row) => ({ ...row, text: "" }));
  const access = jsonl(path.join(ROOT, "official-source-access.jsonl"));
  if (!releases.length || !access.length) throw new Error("Collected official-source artifacts are missing; run with --collect first.");
  return { releases, access };
}

function normaliseAcledExplorerSummary(payload) {
  const latestUpdate = String(payload?.latestUpdate || "");
  const timeline = Array.isArray(payload?.timeline) ? payload.timeline : [];
  if (!asDate(latestUpdate) || !Array.isArray(payload?.provinces) || !timeline.length) throw new Error("ACLED Explorer response is missing required aggregate fields.");
  const monthly = timeline
    .filter((row) => /^2026-0[1-8]-01$/.test(String(row.date || "")))
    .map((row) => ({ month: String(row.date).slice(0, 7), events: Number(row.events), fatalities: Number(row.fatalities) }))
    .filter((row) => Number.isInteger(row.events) && row.events >= 0 && Number.isInteger(row.fatalities) && row.fatalities >= 0);
  if (!monthly.length) throw new Error("ACLED Explorer response has no usable January-August 2026 monthly aggregate.");
  return {
    sourceUrl: ACLED_EXPLORER_URL,
    retrievedAt: new Date().toISOString(),
    latestUpdate,
    query: { countryId: 566, country: "Nigeria", timeRange: "year", disorderType: "politicalviolence" },
    monthly,
    stateAggregateCount: payload.provinces.length,
    limitations: [
      "Explorer is a past-year aggregate view rather than a bounded January-August export.",
      "The response exposes current state totals, not state-by-month rows.",
      "The response does not expose stable event IDs for a deterministic incident-level crosswalk.",
    ],
  };
}

async function loadAcledExplorerSummary() {
  const summaryPath = path.join(ROOT, "acled-explorer-nigeria-political-violence-summary.json");
  if (ACLED_EXPLORER_SUMMARY) {
    const response = await requestText(ACLED_EXPLORER_URL, { timeout: 30000 });
    if (response.status < 200 || response.status >= 300) throw new Error(`ACLED Explorer summary returned HTTP ${response.status}.`);
    const summary = normaliseAcledExplorerSummary(JSON.parse(response.body));
    writeJson(summaryPath, summary);
    return summary;
  }
  if (!fs.existsSync(summaryPath)) return null;
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  if (!asDate(summary.latestUpdate) || !Array.isArray(summary.monthly) || !summary.monthly.length || !Array.isArray(summary.limitations)) throw new Error("Saved ACLED Explorer summary is invalid; rerun with --acled-explorer-summary.");
  return summary;
}

function proposalDateResolution(proposal, decision) {
  const evidenceDates = unique((proposal.sources || []).flatMap((source) => (source.eventDateEvidence || []).map((item) => item.date)).filter(Boolean)).sort();
  if (decision === "UNRESOLVED_EVENT_DATE" || proposal.dateConflict) {
    if (evidenceDates.length > 1) return { eventDate: null, datePrecision: "date_range", dateRange: { start: iso(`${evidenceDates[0]}T00:00:00+01:00`), end: iso(`${evidenceDates.at(-1)}T23:59:59+01:00`) }, reason: proposal.dateConflict ? "DATE_CONFLICT" : "DATE_NOT_STATED" };
    return { eventDate: null, datePrecision: "unknown", dateRange: { start: null, end: null }, reason: proposal.dateConflict ? "DATE_CONFLICT" : "DATE_NOT_STATED" };
  }
  const proposalDay = iso(proposal.date)?.slice(0,10);
  if (proposalDay && evidenceDates.includes(proposalDay)) return { eventDate: iso(proposal.date), datePrecision: "exact_day", dateRange: { start: null, end: null }, reason: null };
  return { eventDate: null, datePrecision: "unknown", dateRange: { start: null, end: null }, reason: "DATE_NOT_STATED" };
}

function candidateCore(input) {
  const core = { ...input, sources: input.sources.map((source) => ({ ...source, publishedAt: iso(source.publishedAt) })).sort((a,b) => normalizeUrl(a.url).localeCompare(normalizeUrl(b.url))), reasonCodes: unique(input.reasonCodes).sort(), productionWriteAllowed: false, reviewStatus: "open" };
  core.candidateHash = fingerprint({ headline: core.headline.toLowerCase(), state: core.location.state, lga: core.location.lga.toLowerCase(), town: core.location.town.toLowerCase(), eventDate: core.eventDate, dateRange: core.dateRange, urls: core.sources.map((source) => normalizeUrl(source.url)) });
  core.recordFingerprint = fingerprint({ ...core, candidateHash: core.candidateHash });
  return core;
}

function buildUnresolvedCandidates() {
  const reviewPath = path.resolve(process.cwd(), "audit-2026", "rerun-2026-08-30-genuine", "proposal-review-ledger.jsonl");
  const manualPath = path.resolve(process.cwd(), "audit-2026", "rerun-2026-08-30-genuine", "manual-adjudication-ledger.jsonl");
  const manual = new Map(jsonl(manualPath).map((row) => [row.proposalId, row]));
  const candidates = [];
  for (const review of jsonl(reviewPath)) {
    const proposal = review.proposal || {};
    const adjudication = manual.get(proposal.proposalId || review.proposalId);
    if (!adjudication || !String(adjudication.decision).startsWith("UNRESOLVED")) continue;
    if (!review.signals?.directEventInEvidence || !review.signals?.hasReadableEvidence || review.signals?.clearNonEvent) continue;
    const state = proposal.location?.state;
    if (!STATE_SET.has(state)) continue;
    let date = proposalDateResolution(proposal, adjudication.decision);
    const followUpWithoutOriginal = review.signals?.followUpTitle === true;
    if (followUpWithoutOriginal) {
      date = { eventDate:null, datePrecision:"unknown", dateRange:{start:null,end:null}, reason:null };
    }
    const lga = unknown(proposal.location?.lga) ? "Unknown" : String(proposal.location.lga).trim();
    const town = unknown(proposal.location?.town) ? "Unknown" : String(proposal.location.town).trim();
    const reasonCodes = [];
    if (date.reason) reasonCodes.push(date.reason);
    if (lga === "Unknown" && town === "Unknown") reasonCodes.push("LOCATION_INSUFFICIENT");
    if (review.preliminaryDecision === "BASELINE_DUPLICATE_OR_SOURCE_MERGE" || (review.signals.exactBaselineAttackIds || []).length || (review.signals.nearBaselineMatches || []).length) reasonCodes.push("POSSIBLE_DUPLICATE");
    if (followUpWithoutOriginal) reasonCodes.push("ORIGINAL_INCIDENT_UNCLEAR");
    if (!reasonCodes.length) reasonCodes.push("ORIGINAL_INCIDENT_UNCLEAR");
    const sourceRows = (proposal.sources || []).filter((source) => DIRECT_URL.test(source.url || "")).map((source) => ({ url: source.url, title: source.title || proposal.title || "Untitled source", publisher: source.publisher || "Unknown publisher", publishedAt: source.publicationDate || null, sourceType: /(?:police\.gov\.ng|\.mil\.ng)/i.test(source.url) ? "official" : "trusted_media" }));
    if (!sourceRows.length) continue;
    const impact = candidateImpact(proposal.casualties);
    const locationPrecision = town !== "Unknown" ? "exact" : lga !== "Unknown" ? "approximate_lga" : "approximate_state";
    const required = reasonCodes.includes("DATE_CONFLICT") || reasonCodes.includes("DATE_NOT_STATED") ? "A direct contemporaneous source that states the original event date without relying on publication date." : reasonCodes.includes("LOCATION_INSUFFICIENT") ? `A direct source that supports at least the LGA, surrounding area or state-level event location in ${state}.` : reasonCodes.includes("POSSIBLE_DUPLICATE") ? "Affirmative source language linking this report to, or distinguishing it from, the possible existing incident." : "An official release or independent contemporaneous source that establishes the original incident grain and production eligibility.";
    candidates.push(candidateCore({ auditRunId:AUDIT_RUN_ID, headline:proposal.title || "Untitled unresolved report", description:proposal.description || adjudication.reason, incidentType:incidentType(proposal), eventDate:date.eventDate, datePrecision:date.datePrecision, dateRange:date.dateRange, location:{ state, lga, town }, locationPrecision, group:proposal.group || "Unknown", casualties:impact.casualties, casualtyMeta:impact.casualtyMeta, sources:sourceRows, reasonCodes, requiredNextEvidence:required }));
  }

  const historicalRoot = path.resolve(process.cwd(), "audit-2026", "full-audit-2026-08-29");
  for (const file of fs.readdirSync(historicalRoot).filter((name) => name.endsWith("-collated-candidates.jsonl"))) {
    for (const row of jsonl(path.join(historicalRoot, file))) {
      const possibleDay = String(row.possible_incident_date || row.date || "").slice(0,10);
      if (possibleDay < "2026-01-01" || possibleDay > "2026-04-30" || /REJECTED/i.test(row.audit_decision || row.verification_status || "")) continue;
      const state = row.state || row.location?.state;
      const url = row.url || row.sources?.[0]?.url;
      if (!STATE_SET.has(state) || !DIRECT_URL.test(url || "")) continue;
      const followUp = /FOLLOW_UP/i.test(row.audit_decision || row.verification_status || "");
      const locationText = typeof row.location === "string" ? row.location : row.location?.town;
      const impact = candidateImpact(row.casualties);
      candidates.push(candidateCore({ auditRunId:AUDIT_RUN_ID, headline:row.title || row.key || "Historical unresolved report", description:row.reason || row.description || "Historical candidate retained pending direct evidence.", incidentType:incidentType(row), eventDate:null, datePrecision:"unknown", dateRange:{start:null,end:null}, location:{state,lga:row.location?.lga || "Unknown",town:locationText || "Unknown"}, locationPrecision:locationText ? "exact" : row.location?.lga ? "approximate_lga" : "approximate_state", group:row.group || "Unknown", casualties:impact.casualties, casualtyMeta:impact.casualtyMeta, sources:[{url,title:row.title || row.key || "Historical unresolved source",publisher:"Unknown publisher",publishedAt:null,sourceType:/(?:police\.gov\.ng|\.mil\.ng)/i.test(url)?"official":"trusted_media"}], reasonCodes:[followUp?"ORIGINAL_INCIDENT_UNCLEAR":"DATE_NOT_STATED"], requiredNextEvidence:row.next_verification_step || "A direct source that states the original event date and incident circumstances." }));
    }
  }
  const byHash = new Map();
  for (const row of candidates) if (!byHash.has(row.candidateHash)) byHash.set(row.candidateHash, row);
  return [...byHash.values()].sort((a,b) => `${a.location.state}|${a.eventDate || ""}|${a.candidateHash}`.localeCompare(`${b.location.state}|${b.eventDate || ""}|${b.candidateHash}`));
}

async function revalidateHistorical(attacks) {
  const priorPath = path.join(ROOT, "historical-revalidation.jsonl");
  if (!COLLECT && fs.existsSync(priorPath)) return jsonl(priorPath);
  const historicalAttacks = attacks.filter((row) => inScope(row.date) && asDate(row.date) < new Date("2026-05-01T00:00:00.000+01:00"));
  const rows = await mapLimit(historicalAttacks, 12, async (attack, index) => {
    const source = (attack.sources || []).find((item) => DIRECT_URL.test(item.url || ""));
    const base = { attackId:String(attack._id), state:attack.location?.state || null, storedEventDate:iso(attack.date), sourceUrl:source?.url || null, sourceTitle:source?.title || "", publisher:source?.publisher || "" };
    if (!source) return { ...base, accessStatus:"FAIL", dateEvidenceStatus:"UNRESOLVED", reason:"No direct source URL exists." };
    try {
      const response = await requestText(source.url, { timeout: 12000, insecure: false });
      if (response.status < 200 || response.status >= 300) return { ...base, accessStatus:"BLOCKED", httpStatus:response.status, dateEvidenceStatus:"UNRESOLVED", reason:`Primary source returned HTTP ${response.status}.` };
      const text = stripHtml(response.body);
      const support = eventDateSupported(text, asDate(attack.date));
      return { ...base, accessStatus:"PASS", httpStatus:response.status, finalUrl:response.finalUrl, contentDigest:sha(text), contentLength:text.length, dateEvidenceStatus:"UNRESOLVED", explicitDateMentionCandidate:support.supported, evidenceContextHash:support.contextHash, matchedDateVariant:support.variant, reason:support.supported?"Explicit event/date language was detected, but manual review is still required to rule out report metadata, follow-up timing, or a referenced different event.":"Source was accessible, but the stored event date was not independently established by the conservative text check." };
    } catch (error) { return { ...base, accessStatus:"BLOCKED", dateEvidenceStatus:"UNRESOLVED", reason:error.message }; }
    finally { if ((index + 1) % 50 === 0) console.log(JSON.stringify({ phase:"historical-revalidation", completed:index+1, total:historicalAttacks.length })); }
  });
  writeJsonl(priorPath, rows);
  return rows;
}

function evidenceDoc(input) {
  const core = { auditRunId:AUDIT_RUN_ID, jurisdiction:null, sourceUrl:null, sourceTitle:"", publishedAt:null, eventDate:null, attackIds:[], candidateHashes:[], findings:[], requiredNextEvidence:"None.", trendEligible:false, ...input };
  core.evidenceHash = fingerprint({ recordType:core.recordType, jurisdiction:core.jurisdiction, periodStart:core.periodStart, periodEnd:core.periodEnd, sourceAuthority:core.sourceAuthority, sourceUrl:normalizeUrl(core.sourceUrl), sourceTitle:core.sourceTitle, eventDate:core.eventDate, coverageStatus:core.coverageStatus, attackIds:core.attackIds.map(String).sort(), candidateHashes:[...core.candidateHashes].sort() });
  core.recordFingerprint = fingerprint({ ...core, evidenceHash:core.evidenceHash, attackIds:core.attackIds.map(String).sort(), candidateHashes:[...core.candidateHashes].sort(), findings:[...core.findings].sort() });
  return core;
}

function buildEvidence(attacks, candidates, official, historical, acledSummary) {
  const evidence = [];
  const attackByUrl = new Map();
  for (const attack of attacks) for (const source of attack.sources || []) { const key=normalizeUrl(source.url); if (key) { if(!attackByUrl.has(key))attackByUrl.set(key,[]); attackByUrl.get(key).push(String(attack._id)); } }
  const candidateByUrl = new Map();
  for (const candidate of candidates) for (const source of candidate.sources) { const key=normalizeUrl(source.url); if(key){if(!candidateByUrl.has(key))candidateByUrl.set(key,[]);candidateByUrl.get(key).push(candidate.candidateHash);} }
  const releaseRows = official.releases.filter((release) => release.publishedAt >= "2026-01-01" && release.publishedAt <= "2026-08-29");
  for (const release of releaseRows) {
    const key = normalizeUrl(release.url);
    const attackIds = unique(attackByUrl.get(key) || []);
    const candidateHashes = unique(candidateByUrl.get(key) || []);
    const states = release.states || extractStates(`${release.title} ${release.text || ""}`);
    const eventLanguage = release.eventLanguage ?? EVENT_PATTERN.test(`${release.title} ${release.text || ""}`);
    const coverageStatus = attackIds.length ? "MATCHED_ATTACK" : candidateHashes.length ? "MATCHED_UNRESOLVED" : eventLanguage && !NON_INCIDENT_PATTERN.test(release.title || "") ? "UNLINKED" : "NON_INCIDENT";
    const targets = states.length ? states : [null];
    for (const state of targets) evidence.push(evidenceDoc({ recordType:"source_crosswalk", jurisdiction:state, periodStart:SCOPE_START.toISOString(), periodEnd:PERIOD_END.toISOString(), sourceAuthority:release.authority, sourceType:"official", accessStatus:"PASS", coverageStatus, sourceUrl:release.url, sourceTitle:release.title || "Untitled official release", publishedAt:release.publishedAt, eventDate:null, attackIds, candidateHashes, findings:[eventLanguage?"Official release contains incident language.":"Release screened as non-incident or operational context."], requiredNextEvidence:coverageStatus==="UNLINKED"?"A direct source establishing the victim-facing event date, location and relationship to existing records.":"None." }));
  }
  for (const state of STATES) for (const month of MONTHS) {
    const monthStart = `${month}-01T00:00:00.000+01:00`;
    const monthEndDate = new Date(new Date(monthStart).getTime()); monthEndDate.setUTCMonth(monthEndDate.getUTCMonth()+1); monthEndDate.setUTCMilliseconds(-1);
    const releasesForCell = releaseRows.filter((row) => row.authority === "Nigeria Police Force" && String(row.publishedAt).startsWith(month) && (row.states || []).includes(state));
    evidence.push(evidenceDoc({ recordType:"source_crosswalk", jurisdiction:state, periodStart:iso(monthStart), periodEnd:iso(monthEndDate), sourceAuthority:"Nigeria Police Force indexed national releases", sourceType:"official", accessStatus:"PASS", coverageStatus:releasesForCell.length?"UNLINKED":"NO_RELEASE_FOUND", sourceTitle:`${state} ${month} NPF release index crosswalk`, findings:[releasesForCell.length?`${releasesForCell.length} indexed NPF release(s) mentioned the jurisdiction; each remains separately adjudicated.`:"No indexed national NPF release found for this cell; absence is not evidence that no incident occurred."], requiredNextEvidence:releasesForCell.length?"Event-level linkage or exclusion for every release in the cell.":"A complete official archive or direct state-command release index for the period." }));
    evidence.push(evidenceDoc({ recordType:"source_crosswalk", jurisdiction:state, periodStart:iso(monthStart), periodEnd:iso(monthEndDate), sourceAuthority:`${state} State Police Command`, sourceType:"official", accessStatus:"BLOCKED", coverageStatus:"NO_RELEASE_FOUND", sourceTitle:`${state} ${month} state-command access record`, findings:["No complete first-party, date-filterable state-command archive was available for an exhaustive crosswalk."], requiredNextEvidence:`Authorised access to the ${state} State Police Command release archive for ${month}.` }));
  }
  for (const row of official.access) evidence.push(evidenceDoc({ recordType:"source_crosswalk", periodStart:SCOPE_START.toISOString(), periodEnd:PERIOD_END.toISOString(), sourceAuthority:row.authority, sourceType:"official", accessStatus:["PASS","PARTIAL","BLOCKED","FAIL"].includes(row.status)?row.status:"UNRESOLVED", coverageStatus:"NOT_APPLICABLE", sourceUrl:row.url, sourceTitle:`${row.authority} archive access`, findings:[row.reason], requiredNextEvidence:row.status==="PASS"?"None.":`A complete, first-party, date-filterable ${row.authority} release archive.` }));
  for (const row of historical) evidence.push(evidenceDoc({ recordType:"historical_revalidation", jurisdiction:STATE_SET.has(row.state)?row.state:null, periodStart:row.storedEventDate, periodEnd:row.storedEventDate, sourceAuthority:row.publisher || "Historical source", sourceType:"repository_evidence", accessStatus:row.dateEvidenceStatus==="PASS"?"PASS":row.accessStatus==="PASS"?"UNRESOLVED":row.accessStatus, coverageStatus:"MATCHED_ATTACK", sourceUrl:row.sourceUrl, sourceTitle:row.sourceTitle || "Historical source revalidation", eventDate:row.storedEventDate, attackIds:[row.attackId], findings:[row.reason], requiredNextEvidence:row.dateEvidenceStatus==="PASS"?"Manual confirmation that the date mention refers to this event rather than publication metadata.":"A direct contemporaneous passage that states the original event date and location." }));
  const structuredAuthorized = Boolean(process.env.ACLED_ACCESS_TOKEN) || Boolean(acledSummary);
  const structuredFindings = acledSummary
    ? [
        `ACLED Explorer Nigeria political-violence aggregate was retrieved read-only from ${acledSummary.sourceUrl}; no credentials or event rows were stored.`,
        `Latest Explorer update: ${acledSummary.latestUpdate.slice(0, 10)}; the audit ends 2026-08-29, so the August comparison window is incomplete.`,
        `The aggregate contains ${acledSummary.monthly.length} 2026 country-month row(s) and ${acledSummary.stateAggregateCount} current state totals, but no stable event IDs or state-month rows.`,
        ...acledSummary.limitations,
      ]
    : [structuredAuthorized ? "An ACLED access token is present, but this runner does not infer license scope or auto-import events." : "No ACLED OAuth access token or authorised ACLED Explorer aggregate is available in the repository environment."];
  evidence.push(evidenceDoc({ recordType:"dataset_access", periodStart:SCOPE_START.toISOString(), periodEnd:PERIOD_END.toISOString(), sourceAuthority:"ACLED", sourceType:"structured_dataset", accessStatus:structuredAuthorized?"PARTIAL":"BLOCKED", coverageStatus:"NOT_APPLICABLE", sourceUrl:"https://acleddata.com/api-documentation/getting-started", sourceTitle:"Authorised structured conflict dataset access check", findings:structuredFindings, requiredNextEvidence:acledSummary?"An account-authorised, date-bounded event-level export with stable ACLED event IDs and administrative-area fields for deterministic matching.":structuredAuthorized?"Confirm the account license permits this audit use, then run an authenticated read-only export and crosswalk.":"Authorised account access and documented permission for this audit use." }));
  const historicalUnresolved = historical.filter((row) => row.dateEvidenceStatus !== "PASS").length;
  const blockedStateCells = STATES.length * MONTHS.length;
  const gateFindings = [
    acledSummary?"ACLED Explorer aggregate access is documented, but it cannot support an event-level or state-month crosswalk.":structuredAuthorized?"Structured-dataset license scope and event crosswalk remain unresolved.":"Authorised structured conflict dataset access is unavailable.",
    `${blockedStateCells} state-command month cells lack a complete first-party release archive.`,
    `${historicalUnresolved} of ${historical.length} January-April records did not pass conservative event-date revalidation.`,
    "Database record counts therefore describe tracker records, not comparable national incidence rates.",
  ];
  evidence.push(evidenceDoc({ recordType:"trend_gate", periodStart:SCOPE_START.toISOString(), periodEnd:PERIOD_END.toISOString(), sourceAuthority:"Terror Tracker trend-eligibility gate", sourceType:"repository_evidence", accessStatus:"BLOCKED", coverageStatus:"GATE", sourceTitle:"January-August 2026 monthly and regional trend gate", findings:gateFindings, requiredNextEvidence:"Pass the authorised structured-dataset crosswalk, resolve official archive coverage, and revalidate every historical event date before comparative monthly or regional claims.", trendEligible:false }));
  const byHash = new Map(); for (const row of evidence) byHash.set(row.evidenceHash,row);
  return [...byHash.values()].sort((a,b) => `${a.recordType}|${a.jurisdiction||""}|${a.periodStart}|${a.evidenceHash}`.localeCompare(`${b.recordType}|${b.jurisdiction||""}|${b.periodStart}|${b.evidenceHash}`));
}

function validate(candidates, evidence) {
  const errors = [];
  const candidateHashes = new Set();
  for (const row of candidates) {
    if (candidateHashes.has(row.candidateHash)) errors.push(`Duplicate candidate hash ${row.candidateHash}`); candidateHashes.add(row.candidateHash);
    if (!STATE_SET.has(row.location?.state)) errors.push(`Invalid candidate state ${row.location?.state}`);
    if (!LOCATION_PRECISION_CODES.has(row.locationPrecision)) errors.push(`Candidate ${row.candidateHash} has invalid location precision`);
    if (row.productionWriteAllowed !== false) errors.push(`Candidate ${row.candidateHash} permits production write`);
    if (!row.sources?.length || row.sources.some((source) => !DIRECT_URL.test(source.url || ""))) errors.push(`Candidate ${row.candidateHash} has invalid sources`);
    if (!row.reasonCodes?.length || row.reasonCodes.some((code) => !REASON_CODES.has(code))) errors.push(`Candidate ${row.candidateHash} has invalid reason codes`);
    if (Object.values(row.casualties || {}).some((value) => value !== null && (!Number.isInteger(value) || value < 0))) errors.push(`Candidate ${row.candidateHash} has invalid casualties`);
    for (const [field, meta] of Object.entries(row.casualtyMeta || {})) {
      if (!CASUALTY_PRECISION_CODES.has(meta?.precision)) errors.push(`Candidate ${row.candidateHash} has invalid casualty precision for ${field}`);
    }
  }
  const evidenceHashes = new Set();
  for (const row of evidence) { if(evidenceHashes.has(row.evidenceHash))errors.push(`Duplicate evidence hash ${row.evidenceHash}`);evidenceHashes.add(row.evidenceHash);if(row.jurisdiction!==null&&!STATE_SET.has(row.jurisdiction))errors.push(`Invalid evidence jurisdiction ${row.jurisdiction}`); }
  const gates=evidence.filter((row)=>row.recordType==="trend_gate"); if(gates.length!==1)errors.push(`Expected one trend gate; found ${gates.length}`); if(gates.some((row)=>row.trendEligible))errors.push("Trend gate cannot pass while source and dataset checks are blocked");
  return errors;
}

async function collectionUpsert(collection, key, rows) {
  const existing = await collection.find({ [key]: { $in: rows.map((row) => row[key]) } }).toArray();
  const byKey = new Map(existing.map((row) => [row[key], row]));
  const inserts = [], updates = [], unchanged = [];
  for (const row of rows) { const prior=byKey.get(row[key]); if(!prior)inserts.push(row); else if(prior.recordFingerprint!==row.recordFingerprint)updates.push(row); else unchanged.push(row); }
  const now = new Date();
  if (inserts.length) await collection.insertMany(inserts.map((row)=>({...row,createdAt:now,updatedAt:now})),{ordered:true});
  if (updates.length) await collection.bulkWrite(updates.map((row)=>({updateOne:{filter:{[key]:row[key],recordFingerprint:{$ne:row.recordFingerprint}},update:{$set:{...row,updatedAt:now}}}})),{ordered:true});
  return { inserted:inserts.length, modified:updates.length, unchanged:unchanged.length };
}

async function verifyManifest(db, manifest) {
  const candidates=jsonl(path.join(ROOT,"credible-unresolved-incidents.jsonl")); const evidence=jsonl(path.join(ROOT,"incident-crosswalk-evidence.jsonl"));
  const storedCandidates=await db.collection("credible_unresolved_incidents").find({auditRunId:AUDIT_RUN_ID}).toArray();
  const storedEvidence=await db.collection("incident_crosswalk_evidence").find({auditRunId:AUDIT_RUN_ID}).toArray();
  const candidateMap=new Map(storedCandidates.map((row)=>[row.candidateHash,row.recordFingerprint])); const evidenceMap=new Map(storedEvidence.map((row)=>[row.evidenceHash,row.recordFingerprint]));
  const attacks=await db.collection("attacks").find({date:{$gte:SCOPE_START,$lt:SCOPE_END_EXCLUSIVE}}).toArray();
  const failures=[];
  for(const row of candidates)if(candidateMap.get(row.candidateHash)!==row.recordFingerprint)failures.push(`candidate mismatch ${row.candidateHash}`);
  for(const row of evidence)if(evidenceMap.get(row.evidenceHash)!==row.recordFingerprint)failures.push(`evidence mismatch ${row.evidenceHash}`);
  if(attacks.some((row)=>row._deleted===true) && manifest.scopeActiveAttackCount!==attacks.filter((row)=>row._deleted!==true).length)failures.push("active attack count changed since dry run");
  const gate=storedEvidence.find((row)=>row.recordType==="trend_gate"); if(!gate||gate.trendEligible!==false||gate.accessStatus!=="BLOCKED")failures.push("stored trend gate is missing or unsafe");
  return { pass:failures.length===0,failures,expectedCandidates:candidates.length,storedCandidates:storedCandidates.length,expectedEvidence:evidence.length,storedEvidence:storedEvidence.length,activeAttackCount:attacks.filter((row)=>row._deleted!==true).length };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required in .env.local; no work was performed.");
  if (EXECUTE && (COLLECT || DRY_RUN || VERIFY)) throw new Error("Use --execute only after a separate passing --dry-run.");
  if (VERIFY && (COLLECT || EXECUTE)) throw new Error("Use --verify-idempotency by itself.");
  fs.mkdirSync(ROOT,{recursive:true});
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
  const db=mongoose.connection.db;
  if (VERIFY) {
    const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,"dry-run-manifest.json"),"utf8"));
    const result=await verifyManifest(db,manifest); writeJson(path.join(ROOT,"idempotency-verification.json"),{generatedAt:new Date().toISOString(),...result}); console.log(JSON.stringify(result,null,2)); if(!result.pass)process.exitCode=1; return;
  }
  const allAttacks=await db.collection("attacks").find({date:{$gte:SCOPE_START,$lt:SCOPE_END_EXCLUSIVE}}).sort({_id:1}).toArray();
  const activeAttacks=allAttacks.filter((row)=>row._deleted!==true);
  const beforeAttackFingerprint=attackFingerprint(allAttacks);
  if (EXECUTE) {
    const manifestPath=path.join(ROOT,"dry-run-manifest.json"); if(!fs.existsSync(manifestPath))throw new Error("A passing dry-run manifest is required before execute.");
    const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8")); if(!manifest.ready)throw new Error("Dry-run manifest is not ready.");
    const candidates=jsonl(path.join(ROOT,"credible-unresolved-incidents.jsonl")); const evidence=jsonl(path.join(ROOT,"incident-crosswalk-evidence.jsonl"));
    if(fingerprint(candidates)!==manifest.candidateLedgerFingerprint||fingerprint(evidence)!==manifest.evidenceLedgerFingerprint)throw new Error("Audit inputs changed after dry run; rerun dry-run before execute.");
    if(beforeAttackFingerprint!==manifest.attackFingerprint)throw new Error("The attacks collection changed after dry run; rerun the read-only audit.");
    const snapshot={generatedAt:new Date().toISOString(),credibleUnresolvedIncidents:await db.collection("credible_unresolved_incidents").find({auditRunId:AUDIT_RUN_ID}).toArray(),incidentCrosswalkEvidence:await db.collection("incident_crosswalk_evidence").find({auditRunId:AUDIT_RUN_ID}).toArray(),attackFingerprint:beforeAttackFingerprint};
    writeJson(path.join(ROOT,"snapshot-before-audit-layer-writes.json"),snapshot);
    const unresolved=await collectionUpsert(db.collection("credible_unresolved_incidents"),"candidateHash",candidates);
    const crosswalk=await collectionUpsert(db.collection("incident_crosswalk_evidence"),"evidenceHash",evidence);
    await db.collection("credible_unresolved_incidents").createIndex({candidateHash:1},{unique:true}); await db.collection("credible_unresolved_incidents").createIndex({auditRunId:1,"location.state":1,reviewStatus:1});
    await db.collection("incident_crosswalk_evidence").createIndex({evidenceHash:1},{unique:true}); await db.collection("incident_crosswalk_evidence").createIndex({recordType:1,trendEligible:1,createdAt:-1});
    const after=await db.collection("attacks").find({date:{$gte:SCOPE_START,$lt:SCOPE_END_EXCLUSIVE}}).sort({_id:1}).toArray(); if(attackFingerprint(after)!==beforeAttackFingerprint)throw new Error("Safety invariant failed: attacks collection changed during audit-layer write.");
    const verification=await verifyManifest(db,manifest); const result={generatedAt:new Date().toISOString(),mode:"execute",unresolved,crosswalk,attacksUnchanged:true,verification}; writeJson(path.join(ROOT,"execute-result.json"),result); console.log(JSON.stringify(result,null,2)); if(!verification.pass)process.exitCode=1; return;
  }
  const official=COLLECT?await collectOfficialReleases():loadCollectedOfficial();
  const acledSummary=await loadAcledExplorerSummary();
  const candidates=buildUnresolvedCandidates();
  const historical=await revalidateHistorical(activeAttacks);
  const evidence=buildEvidence(activeAttacks,candidates,official,historical,acledSummary);
  const errors=validate(candidates,evidence);
  writeJsonl(path.join(ROOT,"credible-unresolved-incidents.jsonl"),candidates);
  writeJsonl(path.join(ROOT,"incident-crosswalk-evidence.jsonl"),evidence);
  const byState=Object.fromEntries(STATES.map((state)=>[state,candidates.filter((row)=>row.location.state===state).length]));
  const statusCounts=(rows,field)=>Object.fromEntries([...new Set(rows.map((row)=>row[field]))].sort().map((key)=>[key,rows.filter((row)=>row[field]===key).length]));
  const manifest={generatedAt:new Date().toISOString(),mode:"dry-run",auditRunId:AUDIT_RUN_ID,scope:{start:SCOPE_START.toISOString(),endInclusive:PERIOD_END.toISOString(),timezone:"Africa/Lagos",jurisdictions:STATES},scopeActiveAttackCount:activeAttacks.length,attackFingerprint:beforeAttackFingerprint,candidates:{count:candidates.length,byState,reasonCodes:statusCounts(candidates.flatMap((row)=>row.reasonCodes.map((reasonCode)=>({reasonCode}))),"reasonCode")},evidence:{count:evidence.length,recordTypes:statusCounts(evidence,"recordType"),accessStatuses:statusCounts(evidence,"accessStatus")},official:{releaseRows:official.releases.length,accessRecords:official.access.length},historicalRevalidation:{records:historical.length,dateEvidencePassed:historical.filter((row)=>row.dateEvidenceStatus==="PASS").length,unresolved:historical.filter((row)=>row.dateEvidenceStatus!=="PASS").length},structuredDataset:acledSummary?{status:"PARTIAL",reason:"Authorised ACLED Explorer aggregate retrieved; it remains insufficient for an event-level or state-month crosswalk.",latestUpdate:acledSummary.latestUpdate,monthlyRows:acledSummary.monthly.length,stateAggregateCount:acledSummary.stateAggregateCount}:process.env.ACLED_ACCESS_TOKEN?{status:"PARTIAL",reason:"Token present; license scope and event crosswalk still require review."}:{status:"BLOCKED",reason:"No authorised access token or ACLED Explorer aggregate exists in the repository environment."},trendEligibility:{status:"BLOCKED",eligible:false},validations:{errors},candidateLedgerFingerprint:fingerprint(candidates),evidenceLedgerFingerprint:fingerprint(evidence),ready:errors.length===0};
  writeJson(path.join(ROOT,"dry-run-manifest.json"),manifest); console.log(JSON.stringify(manifest,null,2)); if(!manifest.ready)process.exitCode=1;
}

main().catch((error)=>{console.error(error.stack||error.message);process.exitCode=1;}).finally(async()=>{await mongoose.disconnect();});
