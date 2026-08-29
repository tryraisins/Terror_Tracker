export function LoadingState({ label = "Loading records" }: { label?: string }) {
  return <div className="panel skeleton" role="status" aria-live="polite"><span className="sr-only">{label}</span></div>;
}

export function RecordListSkeleton({ count = 3, label = "Loading filtered incident records" }: { count?: number; label?: string }) {
  return <section className="record-list record-list--skeleton" role="status" aria-live="polite" aria-label={label}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: count }, (_, index) => <article className="record-skeleton" key={index} aria-hidden="true"><span className="record-skeleton__date" /><span className="record-skeleton__title" /><span className="record-skeleton__line" /><span className="record-skeleton__line record-skeleton__line--short" /><span className="record-skeleton__meta" /></article>)}
  </section>;
}

export function EmptyState({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="panel state-message"><h2>{title}</h2><p>{children}</p>{action}</section>;
}

export function ErrorState({ offline, retry }: { offline?: boolean; retry: () => void }) {
  return <section className={`panel state-message ${offline ? "panel--notice" : "panel--danger"}`} role="alert"><span className="eyebrow">{offline ? "Offline" : "Data unavailable"}</span><h2>{offline ? "Showing no new data while offline" : "The record could not be loaded"}</h2><p>{offline ? "Check your connection, then try again. This view does not claim to be live." : "The request did not complete. Please retry; no loading screen will continue indefinitely."}</p><button type="button" className="button-secondary" onClick={retry}>Retry</button></section>;
}
