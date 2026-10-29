"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type ReviewStatus = "pending" | "resolved" | "dismissed";
type ReviewAction = "dismiss" | "reopen" | "request_retry";

interface ReviewItem {
  _id: string;
  sourceUrl: string;
  kind: string;
  reason: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  state: string;
  sourceEvidence: unknown;
  candidates: unknown;
  attempts: number;
  nextRetryAt: string | null;
  lastSeenAt: string;
  status: ReviewStatus;
  retryable: boolean;
  dispositionNote?: string;
}

interface QueuePayload {
  reviews: ReviewItem[];
  counts: Record<ReviewStatus, number>;
  pagination: { page: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
}

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(value))
  : "Not recorded";

interface Candidate {
  _id?: string;
  title?: string;
  date?: string;
  dateEvidence?: string;
  location?: { state?: string; lga?: string; town?: string; precision?: string };
  casualties?: { killed?: number | null; injured?: number | null; kidnapped?: number | null; displaced?: number | null };
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const candidatesOf = (value: unknown): Candidate[] =>
  (Array.isArray(value) ? value : []).filter((entry) => asRecord(entry)) as Candidate[];

const articleTextOf = (evidence: unknown) => {
  const text = asRecord(evidence)?.articleText;
  return typeof text === "string" ? text.trim() : "";
};

const incidentDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf())
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date)
    : "";
};

const placeOf = (candidate: Candidate) => {
  const place = candidate.location;
  const parts = [place?.town, place?.lga && `${place.lga} LGA`, place?.state].filter(Boolean);
  return parts.length ? `${parts.join(", ")}${place?.precision ? ` (${place.precision.replace(/_/g, " ")})` : ""}` : "";
};

const tollOf = (candidate: Candidate) => {
  const counts = candidate.casualties;
  return (["killed", "injured", "kidnapped", "displaced"] as const)
    .filter((key) => typeof counts?.[key] === "number")
    .map((key) => `${counts?.[key]} ${key}`)
    .join(", ");
};

const NUMBER = "(?:\\d[\\d,]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|dozens?)";
const VICTIM = "(?:kill(?:ed|ing|s)?|dead|deaths?|bod(?:y|ies)|abduct(?:ed|ion|ions|s)?|kidnap(?:ped|ping|s)?|injur(?:ed|ies|y)|wound(?:ed|s)?|displac(?:ed|ement))";
// A number beside a victim word: "12 villagers abducted", "killed at least 5". Years are not tolls.
const TOLL_SENTENCE = new RegExp(
  `\\b${NUMBER}(?:\\s+[\\p{L}'-]+){0,2}?\\s+${VICTIM}\\b|\\b${VICTIM}\\s+(?:(?:at least|about|over|more than|nearly|some|around|up to)\\s+)?(?!(?:19|20)\\d{2}\\b)${NUMBER}\\b`,
  "iu",
);

/** Splits without losing a character, so the pieces always join back to the original text. */
function sentencesOf(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isBreak = char === "\n" || (/[.!?]/.test(char) && (i + 1 === text.length || /\s/.test(text[i + 1])));
    if (!isBreak) continue;
    let end = i + 1;
    while (end < text.length && /["'”’)\]]/.test(text[end])) end++;
    while (end < text.length && /[ \t]/.test(text[end])) end++;
    out.push(text.slice(start, end));
    start = end;
    i = end - 1;
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function settlementPattern(candidates: Candidate[]): RegExp | null {
  const names = new Set<string>();
  for (const candidate of candidates) {
    const name = (candidate.location?.town || candidate.location?.lga || "").trim();
    if (name.length >= 3) names.add(name);
  }
  if (!names.size) return null;
  const alternatives = [...names].sort((a, b) => b.length - a.length).map(escapePattern).join("|");
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "giu");
}

function withPlaces(sentence: string, pattern: RegExp | null): ReactNode {
  if (!pattern) return sentence;
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of sentence.matchAll(pattern)) {
    if (match.index > last) nodes.push(sentence.slice(last, match.index));
    nodes.push(<mark className="review-excerpt__place" key={match.index}>{match[0]}</mark>);
    last = match.index + match[0].length;
  }
  if (!nodes.length) return sentence;
  if (last < sentence.length) nodes.push(sentence.slice(last));
  return nodes;
}

function ArticleExcerpt({ text, candidates }: { text: string; candidates: Candidate[] }) {
  const [expanded, setExpanded] = useState(false);
  const body = useMemo(() => {
    const pattern = settlementPattern(candidates);
    return sentencesOf(text).map((sentence, index) => TOLL_SENTENCE.test(sentence)
      ? <mark className="review-excerpt__toll" key={index}>{withPlaces(sentence, pattern)}</mark>
      : <Fragment key={index}>{withPlaces(sentence, pattern)}</Fragment>);
  }, [text, candidates]);
  const long = text.length > 700 || text.split("\n").length > 8;

  return <div>
    <span className="review-detail__label">Article excerpt</span>
    <p className={`review-excerpt${long && !expanded ? " review-excerpt--clamped" : ""}`}>{body}</p>
    <div className="review-legend">
      <span><mark className="review-excerpt__place">Place</mark> where the lead sets the event</span>
      <span><mark className="review-excerpt__toll">Sentence</mark> giving a toll</span>
    </div>
    {long ? <button className="text-link" type="button" style={{ marginTop: ".4rem" }} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Show the rest"}</button> : null}
  </div>;
}

const existingIdOf = (evidence: unknown) => {
  if (!evidence || typeof evidence !== "object") return "";
  const value = (evidence as { existingId?: unknown }).existingId;
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value) ? value : "";
};

function ReviewDetail({ item }: { item: ReviewItem }) {
  const text = articleTextOf(item.sourceEvidence);
  const candidates = useMemo(() => candidatesOf(item.candidates), [item.candidates]);
  const existingId = existingIdOf(item.sourceEvidence);
  const heading = item.kind !== "duplicate" ? "What the extractor claimed"
    : candidates.some((candidate) => candidate._id) ? "Stored records compared" : "Held lead from the article";

  return <div className="review-detail">
    <p className="review-detail__link">
      {item.publisher || "Publisher unknown"} · <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceUrl.replace(/^https?:\/\/(www\.)?/i, "")}</a>
    </p>
    {existingId ? <p className="supporting">
      Compared with stored record <code>{existingId}</code>
      {" · "}<Link className="text-link" href={`/incidents/${existingId}`}>Open it</Link>
    </p> : null}
    {text ? <ArticleExcerpt text={text} candidates={candidates} /> : <p className="supporting">The article body was not stored for this row.</p>}
    {candidates.length ? <div>
      <span className="review-detail__label">{heading}</span>
      <ul className="review-evidence">
        {candidates.map((candidate, index) => <li key={candidate._id || index}><dl className="review-evidence__item">
          {candidate.title ? <><dt>Title</dt><dd>{candidate.title}</dd></> : null}
          {incidentDate(candidate.date) ? <><dt>Date</dt><dd>{incidentDate(candidate.date)}</dd></> : null}
          {placeOf(candidate) ? <><dt>Place</dt><dd>{placeOf(candidate)}</dd></> : null}
          <dt>Toll</dt><dd>{tollOf(candidate) || "None reported"}</dd>
          {candidate.dateEvidence ? <><dt>Date basis</dt><dd>“{candidate.dateEvidence}”</dd></> : null}
        </dl></li>)}
      </ul>
    </div> : null}
  </div>;
}

export default function IncidentReviewQueue() {
  const [payload, setPayload] = useState<QueuePayload | null>(null);
  const [status, setStatus] = useState<ReviewStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ status, page: String(page), limit: "10" });
      const response = await fetch(`/api/admin/reviews?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load review items");
      setPayload(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load review items");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const act = async (item: ReviewItem, action: ReviewAction) => {
    setActing(item._id);
    setError("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, action, note: notes[item._id] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update review item");
      setNotes((current) => ({ ...current, [item._id]: "" }));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update review item");
    } finally {
      setActing(null);
    }
  };

  return <section className="panel" aria-labelledby="review-queue-title">
    <div className="panel-heading">
      <div>
        <span className="eyebrow">Persistent review queue</span>
        <h2 id="review-queue-title">Collector decisions</h2>
        <p className="panel-subtitle">Article evidence and candidate details are restricted to this protected workspace.</p>
      </div>
      <label className="filter-label filter-label--compact">Status
        <select aria-label="Review status" className="control" value={status} onChange={(event) => { setStatus(event.target.value as ReviewStatus | "all"); setPage(1); }}>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </label>
    </div>

    {payload ? <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem 1rem", marginBottom: "1rem" }} className="supporting">
      <span><strong>{payload.counts.pending}</strong> pending</span>
      <span><strong>{payload.counts.resolved}</strong> resolved</span>
      <span><strong>{payload.counts.dismissed}</strong> dismissed</span>
    </div> : null}
    {error ? <p className="panel panel--danger" role="alert" style={{ padding: ".75rem" }}>{error}</p> : null}
    {loading && !payload ? <p className="supporting" role="status">Loading review queue…</p> : null}
    {!loading && payload?.reviews.length === 0 ? <p className="supporting">No {status === "all" ? "" : `${status} `}review items.</p> : null}

    <div style={{ display: "grid", gap: ".75rem" }}>
      {payload?.reviews.map((item) => <article className="admin-record" key={item._id} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
        <div>
          <span className="record-card__date">{item.kind.replace("_", " ")} · {item.state || "Unknown"} · seen {formatDate(item.lastSeenAt)}</span>
          <a className="admin-record__title" href={item.sourceUrl} target="_blank" rel="noreferrer">{item.title || item.sourceUrl}</a>
          <p className="supporting" style={{ margin: ".35rem 0" }}>{item.reason}</p>
          <span className="evidence-count">{item.publisher || "Publisher unknown"} · published {formatDate(item.publishedAt)} · attempt {item.attempts}/3</span>
          {item.dispositionNote ? <p className="supporting">Disposition: {item.dispositionNote}</p> : null}
          <details style={{ marginTop: ".6rem" }}><summary className="text-link">Article and evidence</summary><ReviewDetail item={item} /></details>
          <label className="filter-label" style={{ marginTop: ".7rem" }}>Disposition note
            <input className="control" style={{ padding: ".7rem", width: "100%", height: "auto", minWidth: 0 }} value={notes[item._id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item._id]: event.target.value }))} maxLength={2000} placeholder="Optional review context" />
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".5rem" }}>
          <span className={`status ${item.status === "resolved" ? "status--confirmed" : ""}`}>{item.status}</span>
          {item.status === "pending" ? <>
            <button className="button-quiet" type="button" disabled={acting === item._id || !item.retryable || item.attempts >= 3} onClick={() => act(item, "request_retry")}>Retry</button>
            <button className="button-secondary" type="button" disabled={acting === item._id} onClick={() => act(item, "dismiss")}>Dismiss</button>
          </> : <button className="button-quiet" type="button" disabled={acting === item._id} onClick={() => act(item, "reopen")}>Reopen</button>}
        </div>
      </article>)}
    </div>

    {payload && payload.pagination.totalPages > 1 ? <nav className="pagination" aria-label="Review queue pagination" style={{ marginTop: "1rem" }}>
      <button className="button-quiet" type="button" disabled={!payload.pagination.hasPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
      <span className="pagination__label">Page {payload.pagination.page} of {payload.pagination.totalPages}</span>
      <button className="button-quiet" type="button" disabled={!payload.pagination.hasNext || loading} onClick={() => setPage((value) => value + 1)}>Next →</button>
    </nav> : null}
  </section>;
}
