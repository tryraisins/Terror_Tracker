/**
 * Reusable duplicate-audit script for incident records.
 *
 * Usage:
 *   node scripts/analyze-duplicates.js
 *   node scripts/analyze-duplicates.js --state Kaduna
 *   node scripts/analyze-duplicates.js --limit 20 --threshold 0.5
 *   node scripts/analyze-duplicates.js --execute
 *   node scripts/analyze-duplicates.js --json
 *
 * Defaults to dry-run audit mode:
 * - scans active incidents
 * - finds heuristic duplicate candidates
 * - asks Gemini to confirm the top candidates
 * - prints a report
 *
 * With --execute, confirmed duplicates are merged into the better record:
 * - casualties: max per field
 * - sources: unique by normalized URL
 * - description: AI-consolidated
 * - tags: union
 * - secondary record is soft-deleted with _deletedReason
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_THRESHOLD = 0.4;
const DEFAULT_LIMIT = 12;
const COMPARISON_WINDOW_MS = 8 * 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  const options = {
    execute: false,
    json: false,
    help: false,
    threshold: DEFAULT_THRESHOLD,
    limit: DEFAULT_LIMIT,
    state: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--state") {
      options.state = argv[i + 1] || null;
      i++;
      continue;
    }
    if (arg === "--limit") {
      options.limit = Number(argv[i + 1]);
      i++;
      continue;
    }
    if (arg === "--threshold") {
      options.threshold = Number(argv[i + 1]);
      i++;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(options.limit) || options.limit <= 0) {
    throw new Error("--limit must be a positive number");
  }
  if (!Number.isFinite(options.threshold) || options.threshold < 0) {
    throw new Error("--threshold must be a non-negative number");
  }

  return options;
}

function printHelp() {
  console.log(`Duplicate audit script

Usage:
  node scripts/analyze-duplicates.js [options]

Options:
  --execute             Apply merges for AI-confirmed duplicates
  --json                Print machine-readable JSON output
  --state <name>        Restrict scan to a single state
  --limit <n>           Number of heuristic candidates to AI-check (default: ${DEFAULT_LIMIT})
  --threshold <n>       Heuristic score cutoff before AI verification (default: ${DEFAULT_THRESHOLD})
  --help, -h            Show this help
`);
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/$/, "").toLowerCase();
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1),
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1;
  return (longerLength - levenshteinDistance(longer, shorter)) / longerLength;
}

function isUnknownLocation(value) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized === "unknown" ||
    normalized === "n/a" ||
    normalized === "unspecified"
  );
}

function townNamesOverlap(town1, town2) {
  const t1 = String(town1 || "").toLowerCase().trim();
  const t2 = String(town2 || "").toLowerCase().trim();
  if (!t1 || !t2) return false;
  if (t1.includes(t2) || t2.includes(t1)) return true;

  const filler = new Set(["near", "and", "the", "from", "area", "along", "road"]);
  const tokenize = (value) =>
    new Set(
      value
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && !filler.has(token)),
    );

  const tokens1 = tokenize(t1);
  const tokens2 = tokenize(t2);
  for (const token of tokens1) {
    if (tokens2.has(token)) return true;
  }

  const extractAliases = (value) => {
    const aliases = [value.replace(/\s*\(.*\)\s*/g, "").trim()];
    const parenMatch = value.match(/\(([^)]+)\)/);
    if (parenMatch) aliases.push(parenMatch[1].trim());
    return aliases.filter(Boolean);
  };

  for (const alias1 of extractAliases(t1)) {
    for (const alias2 of extractAliases(t2)) {
      if (
        alias1 === alias2 ||
        alias1.includes(alias2) ||
        alias2.includes(alias1) ||
        calculateSimilarity(alias1, alias2) > 0.75
      ) {
        return true;
      }
    }
  }

  return false;
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "in",
  "on",
  "at",
  "of",
  "to",
  "and",
  "or",
  "is",
  "are",
  "was",
  "were",
  "by",
  "for",
  "from",
  "with",
  "as",
  "that",
  "this",
  "it",
  "its",
  "be",
  "has",
  "had",
  "have",
  "not",
  "but",
  "who",
  "which",
  "their",
  "they",
  "them",
  "been",
  "into",
  "also",
  "over",
  "during",
  "after",
  "before",
  "about",
  "between",
  "through",
  "including",
  "reportedly",
  "approximately",
  "several",
  "area",
  "local",
  "government",
  "state",
  "nigeria",
  "nigerian",
]);

function extractKeywords(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function keywordOverlapScore(text1, text2) {
  const kw1 = extractKeywords(text1);
  const kw2 = extractKeywords(text2);
  if (kw1.size === 0 || kw2.size === 0) return 0;
  let overlap = 0;
  for (const word of kw1) {
    if (kw2.has(word)) overlap++;
  }
  return overlap / Math.min(kw1.size, kw2.size);
}

const CANONICAL_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const STATE_LOOKUP = new Map(CANONICAL_STATES.map((state) => [state.toLowerCase(), state]));
const STATE_ALIASES = {
  "federal capital territory": "FCT",
  "abuja": "FCT",
  "fct": "FCT",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
  "nassarawa": "Nasarawa",
};

function normalizeStateName(raw) {
  if (!raw) return "Unknown";
  let state = String(raw).trim();

  if (/[\/;]/.test(state) || /\band\b/i.test(state)) {
    const parts = state
      .split(/[\/;]|\s+and\s+/i)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) state = parts[0];
  }

  state = state.replace(/\s+state$/i, "").trim();

  if (STATE_ALIASES[state.toLowerCase()]) return STATE_ALIASES[state.toLowerCase()];
  if (STATE_LOOKUP.has(state.toLowerCase())) return STATE_LOOKUP.get(state.toLowerCase());

  const cleaned = state.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (STATE_LOOKUP.has(cleaned.toLowerCase())) return STATE_LOOKUP.get(cleaned.toLowerCase());

  return state.charAt(0).toUpperCase() + state.slice(1);
}

function statesMatch(a, b) {
  return normalizeStateName(a) === normalizeStateName(b);
}

function normalizeDocForOutput(doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    date: doc.date,
    location: doc.location,
    group: doc.group,
    casualties: doc.casualties,
    sourceCount: Array.isArray(doc.sources) ? doc.sources.length : 0,
  };
}

function computeHeuristicScore(incA, incB) {
  const timeDiff = Math.abs(new Date(incA.date).getTime() - new Date(incB.date).getTime());
  if (timeDiff > COMPARISON_WINDOW_MS) return null;
  if (!statesMatch(incA.location?.state, incB.location?.state)) return null;

  const townA = String(incA.location?.town || "").toLowerCase();
  const townB = String(incB.location?.town || "").toLowerCase();
  const lgaA = String(incA.location?.lga || "").toLowerCase();
  const lgaB = String(incB.location?.lga || "").toLowerCase();

  const townUnknownA = isUnknownLocation(incA.location?.town);
  const townUnknownB = isUnknownLocation(incB.location?.town);
  const lgaUnknownA = isUnknownLocation(incA.location?.lga);
  const lgaUnknownB = isUnknownLocation(incB.location?.lga);

  let locationScore = 0;
  let locationDetail = "";

  if (!townUnknownA && !townUnknownB) {
    const townSim = calculateSimilarity(townA, townB);
    const aliasMatch = townNamesOverlap(incA.location?.town || "", incB.location?.town || "");
    if (aliasMatch || townSim > 0.75) {
      locationScore = 0.4;
      locationDetail = `town-match(${aliasMatch ? "alias" : townSim.toFixed(2)})`;
    } else if (townSim > 0.5) {
      locationScore = 0.2;
      locationDetail = `town-partial(${townSim.toFixed(2)})`;
    }
  } else if (townUnknownA || townUnknownB) {
    if (!lgaUnknownA && !lgaUnknownB) {
      const lgaSim = calculateSimilarity(lgaA, lgaB);
      if (lgaSim > 0.75) {
        locationScore = 0.3;
        locationDetail = `lga-match(${lgaSim.toFixed(2)})`;
      }
    }
    if (locationScore === 0) locationDetail = "location-unknown";
  }

  if (locationScore > 0 && !lgaUnknownA && !lgaUnknownB) {
    const lgaSim = calculateSimilarity(lgaA, lgaB);
    if (lgaSim > 0.75) locationScore = Math.min(locationScore + 0.1, 0.5);
  }

  if (locationScore === 0 && !lgaUnknownA && !lgaUnknownB) {
    const lgaSim = calculateSimilarity(lgaA, lgaB);
    if (lgaSim > 0.85) {
      locationScore = 0.25;
      locationDetail = `lga-fallback(${lgaSim.toFixed(2)})`;
    }
  }

  const groupA = String(incA.group || "").toLowerCase();
  const groupB = String(incB.group || "").toLowerCase();
  const groupSim = calculateSimilarity(groupA, groupB);
  const sameGroup =
    groupSim > 0.6 ||
    groupA.includes("unknown") ||
    groupB.includes("unknown") ||
    groupA.includes("unidentified") ||
    groupB.includes("unidentified") ||
    groupA.includes("gunmen") ||
    groupB.includes("gunmen") ||
    groupA.includes("armed men") ||
    groupB.includes("armed men") ||
    groupA.includes("armed group") ||
    groupB.includes("armed group") ||
    groupA.includes("suspected") ||
    groupB.includes("suspected") ||
    (groupA.includes("bandit") && groupB.includes("bandit")) ||
    (groupA.includes("militant") && groupB.includes("militant"));
  const groupScore = sameGroup ? 0.15 : 0;

  let casualtyScore = 0;
  const killedA = incA.casualties?.killed ?? 0;
  const killedB = incB.casualties?.killed ?? 0;
  if (killedA === 0 && killedB === 0) {
    casualtyScore = 0.1;
  } else if (killedA === 0 || killedB === 0) {
    casualtyScore = 0.05;
  } else {
    const ratio = Math.min(killedA, killedB) / Math.max(killedA, killedB);
    if (ratio > 0.5) casualtyScore = 0.2;
    else if (ratio > 0.3) casualtyScore = 0.1;
  }

  const titleOverlap = keywordOverlapScore(incA.title, incB.title);
  const titleScore = titleOverlap > 0.5 ? 0.2 : titleOverlap > 0.3 ? 0.1 : 0;

  const titleStringSim = calculateSimilarity(
    String(incA.title || "").toLowerCase(),
    String(incB.title || "").toLowerCase(),
  );
  const titleSimBonus = titleStringSim > 0.85 ? 0.25 : titleStringSim > 0.7 ? 0.15 : 0;

  const descOverlap = keywordOverlapScore(incA.description || "", incB.description || "");
  const descScore = descOverlap > 0.4 ? 0.15 : descOverlap > 0.25 ? 0.08 : 0;

  let sourceOverlapScore = 0;
  const urlsA = new Set(
    (incA.sources || []).map((source) => normalizeUrl(source.url)).filter(Boolean),
  );
  const urlsB = new Set(
    (incB.sources || []).map((source) => normalizeUrl(source.url)).filter(Boolean),
  );
  if (urlsA.size > 0 && urlsB.size > 0) {
    let shared = 0;
    for (const url of urlsA) {
      if (urlsB.has(url)) shared++;
    }
    if (shared > 0) sourceOverlapScore = 0.3;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const dateScore = timeDiff < dayMs ? 0.1 : timeDiff < 2 * dayMs ? 0.05 : 0;

  const score =
    locationScore +
    groupScore +
    casualtyScore +
    titleScore +
    titleSimBonus +
    descScore +
    sourceOverlapScore +
    dateScore;

  return {
    score,
    reason:
      `Score: ${score.toFixed(2)} (` +
      `Loc: ${locationScore.toFixed(2)} [${locationDetail}], ` +
      `Grp: ${groupScore.toFixed(2)}, ` +
      `Cas: ${casualtyScore.toFixed(2)} [${killedA}v${killedB}], ` +
      `Title: ${titleScore.toFixed(2)} [kw:${titleOverlap.toFixed(2)}, sim:${titleStringSim.toFixed(2)}+${titleSimBonus.toFixed(2)}], ` +
      `Desc: ${descScore.toFixed(2)} [${descOverlap.toFixed(2)}], ` +
      `Src: ${sourceOverlapScore.toFixed(2)}, ` +
      `Date: ${dateScore.toFixed(2)})`,
  };
}

function cleanSources(sources) {
  return (sources || []).map((source) => ({
    url: source.url,
    title: source.title,
    publisher: source.publisher,
  }));
}

async function confirmDuplicateWithGemini(model, candidate, existing) {
  const prompt = `You are a security intelligence analyst specializing in deduplicating incident reports.
Compare the CANDIDATE report against the EXISTING report below. Determine if the CANDIDATE describes the SAME real-world security incident as the EXISTING report.

CANDIDATE REPORT:
${JSON.stringify(
  {
    id: String(candidate._id),
    title: candidate.title,
    date: candidate.date,
    location: candidate.location,
    group: candidate.group,
    casualties: candidate.casualties,
    sources: cleanSources(candidate.sources),
    description: candidate.description,
  },
  null,
  2,
)}

EXISTING REPORT:
${JSON.stringify(
  {
    id: String(existing._id),
    title: existing.title,
    date: existing.date,
    location: existing.location,
    group: existing.group,
    casualties: existing.casualties,
    sources: cleanSources(existing.sources),
    description: existing.description,
  },
  null,
  2,
)}

MATCHING RULES:
Two reports describe the SAME INCIDENT if ALL of these are true:
1. LOCATION MATCH: Same state, AND same or similar town/LGA
2. DATE MATCH: Same date OR within 1 day of each other
3. NATURE MATCH: Same basic type of attack

Two reports are NOT the same incident if:
- They occurred in different states
- They occurred more than 2 days apart
- They describe fundamentally different types of events
- They are in the same state but clearly different towns/villages with no name overlap

IMPORTANT: When evidence is ambiguous, err on the side of marking as duplicate.

IF DUPLICATE FOUND, compare quality:
- Prefer reports from reliable outlets over tweets
- Prefer reports with more specific details
- Prefer higher casualty counts
- If quality is roughly equal, prefer the existing report

Respond with JSON only:
{
  "isDuplicate": boolean,
  "betterReport": "candidate" | "existing",
  "reason": "string"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response
    .text()
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(text);
}

async function mergeDescriptions(model, primaryDescription, secondaryDescription) {
  const prompt = `You are an intelligence analyst. Consolidate these two reports of the SAME incident into a single, comprehensive description.

EXISTING REPORT:
"${primaryDescription}"

NEW REPORT:
"${secondaryDescription}"

INSTRUCTIONS:
- Combine details from both.
- If the new report has more specific info, use it.
- Keep the tone objective and serious.
- Result should be a single paragraph.
- Return ONLY the merged description text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (text && text.length > 50) return text;
  } catch (error) {
    console.error("Description merge failed, keeping existing description.", error);
  }
  return primaryDescription;
}

function mergeSources(primarySources, secondarySources) {
  const sourceMap = new Map();
  for (const source of [...(primarySources || []), ...(secondarySources || [])]) {
    const key = normalizeUrl(source.url);
    if (!key) continue;
    if (!sourceMap.has(key)) sourceMap.set(key, source);
  }
  return Array.from(sourceMap.values());
}

function mergeCasualties(primary, secondary) {
  return {
    killed: Math.max(primary?.killed || 0, secondary?.killed || 0),
    injured: Math.max(primary?.injured || 0, secondary?.injured || 0),
    kidnapped: Math.max(primary?.kidnapped || 0, secondary?.kidnapped || 0),
    displaced: Math.max(primary?.displaced || 0, secondary?.displaced || 0),
  };
}

function mergeTags(primaryTags, secondaryTags) {
  return Array.from(new Set([...(primaryTags || []), ...(secondaryTags || [])].filter(Boolean)));
}

async function applyMerge(collection, model, primary, secondary) {
  const mergedDescription = await mergeDescriptions(
    model,
    primary.description,
    secondary.description,
  );

  const mergedUpdate = {
    description: mergedDescription,
    casualties: mergeCasualties(primary.casualties, secondary.casualties),
    sources: mergeSources(primary.sources, secondary.sources),
    tags: mergeTags(primary.tags, secondary.tags),
    status:
      primary.status === "confirmed" || secondary.status === "confirmed"
        ? "confirmed"
        : primary.status,
    updatedAt: new Date(),
  };

  await collection.updateOne(
    { _id: primary._id },
    {
      $set: mergedUpdate,
    },
  );

  await collection.updateOne(
    { _id: secondary._id },
    {
      $set: {
        _deleted: true,
        _deletedReason: `Duplicate of ${primary._id}`,
        updatedAt: new Date(),
      },
    },
  );

  return mergedUpdate;
}

function printTextReport(summary) {
  console.log(`Mode: ${summary.execute ? "EXECUTE" : "DRY RUN"}`);
  console.log(`Active incidents scanned: ${summary.scanned}`);
  console.log(`Heuristic candidates found: ${summary.candidateCount}`);
  console.log(`AI-checked pairs: ${summary.checkedCount}`);
  console.log(`Confirmed duplicates: ${summary.confirmedCount}`);
  if (summary.state) console.log(`State filter: ${summary.state}`);

  if (summary.confirmed.length === 0) {
    console.log("\nNo confirmed duplicates found in the AI-checked batch.");
    return;
  }

  console.log("\nConfirmed duplicates:");
  for (const item of summary.confirmed) {
    console.log(`- ${item.primary.title}`);
    console.log(`  keep: ${item.primary.id}`);
    console.log(`  absorb: ${item.secondary.id}`);
    console.log(`  heuristic: ${item.heuristicScore.toFixed(2)}`);
    console.log(`  reason: ${item.ai.reason}`);
    if (item.applied) {
      console.log(
        `  merged: sources=${item.applied.sources.length}, killed=${item.applied.casualties.killed}, kidnapped=${item.applied.casualties.kidnapped}`,
      );
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not found in .env.local");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not found in .env.local");

  await mongoose.connect(process.env.MONGODB_URI, {
    family: 4,
    serverSelectionTimeoutMS: 15000,
  });

  const collection = mongoose.connection.db.collection("attacks");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const query = { _deleted: { $ne: true } };
  if (options.state) {
    const normalizedState = normalizeStateName(options.state);
    query["location.state"] = { $regex: new RegExp(`^${normalizedState}(\\s+State)?$`, "i") };
  }

  const docs = await collection
    .find(query, {
      projection: {
        title: 1,
        description: 1,
        date: 1,
        location: 1,
        group: 1,
        casualties: 1,
        sources: 1,
        status: 1,
        tags: 1,
      },
    })
    .sort({ date: 1 })
    .toArray();

  const candidates = [];
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const timeDiff = Math.abs(new Date(docs[j].date).getTime() - new Date(docs[i].date).getTime());
      if (timeDiff > COMPARISON_WINDOW_MS) break;

      const result = computeHeuristicScore(docs[i], docs[j]);
      if (!result) continue;
      if (result.score < options.threshold) continue;

      candidates.push({
        heuristicScore: result.score,
        heuristicReason: result.reason,
        reportA: docs[i],
        reportB: docs[j],
      });
    }
  }

  candidates.sort((a, b) => b.heuristicScore - a.heuristicScore);

  const checkedPairs = [];
  const confirmed = [];
  const consumedIds = new Set();

  for (const candidate of candidates) {
    if (checkedPairs.length >= options.limit) break;

    const idA = String(candidate.reportA._id);
    const idB = String(candidate.reportB._id);
    if (consumedIds.has(idA) || consumedIds.has(idB)) continue;

    const ai = await confirmDuplicateWithGemini(model, candidate.reportA, candidate.reportB);
    const checked = {
      heuristicScore: candidate.heuristicScore,
      heuristicReason: candidate.heuristicReason,
      reportA: normalizeDocForOutput(candidate.reportA),
      reportB: normalizeDocForOutput(candidate.reportB),
      ai,
    };
    checkedPairs.push(checked);

    if (!ai.isDuplicate) continue;

    const primaryId = ai.betterReport === "existing" ? idB : idA;
    const secondaryId = ai.betterReport === "existing" ? idA : idB;

    let primaryDoc = candidate.reportA;
    let secondaryDoc = candidate.reportB;
    if (primaryId !== idA) {
      primaryDoc = candidate.reportB;
      secondaryDoc = candidate.reportA;
    }

    const confirmedItem = {
      heuristicScore: candidate.heuristicScore,
      heuristicReason: candidate.heuristicReason,
      ai,
      primary: normalizeDocForOutput(primaryDoc),
      secondary: normalizeDocForOutput(secondaryDoc),
      applied: null,
    };

    if (options.execute) {
      const livePrimary = await collection.findOne({
        _id: new mongoose.Types.ObjectId(primaryId),
        _deleted: { $ne: true },
      });
      const liveSecondary = await collection.findOne({
        _id: new mongoose.Types.ObjectId(secondaryId),
        _deleted: { $ne: true },
      });

      if (livePrimary && liveSecondary) {
        const mergedUpdate = await applyMerge(collection, model, livePrimary, liveSecondary);
        confirmedItem.applied = {
          primaryId,
          secondaryId,
          sources: mergedUpdate.sources,
          casualties: mergedUpdate.casualties,
        };
        consumedIds.add(secondaryId);
      }
    }

    confirmed.push(confirmedItem);
  }

  const summary = {
    execute: options.execute,
    state: options.state ? normalizeStateName(options.state) : null,
    scanned: docs.length,
    threshold: options.threshold,
    limit: options.limit,
    candidateCount: candidates.length,
    checkedCount: checkedPairs.length,
    confirmedCount: confirmed.length,
    confirmed,
    checkedPairs,
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printTextReport(summary);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Duplicate analysis failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
