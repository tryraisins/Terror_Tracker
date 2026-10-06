"use client";

import { useCallback, useEffect, useState } from "react";

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

const detailText = (value: unknown) => value == null ? "No stored detail" : JSON.stringify(value, null, 2);

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

  useEffect(() => { load(); }, [load]);

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
          <details style={{ marginTop: ".6rem" }}><summary className="text-link">Private evidence and candidates</summary><pre style={{ maxHeight: "20rem", overflow: "auto", whiteSpace: "pre-wrap", color: "var(--body)", fontSize: ".75rem" }}>{detailText({ sourceEvidence: item.sourceEvidence, candidates: item.candidates })}</pre></details>
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
