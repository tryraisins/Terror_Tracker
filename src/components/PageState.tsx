import { ErrorState } from "./DataState";

/** Shaped like the page it stands in for: a header line, four tiles and two panels. */
export function PageSkeleton({ title }: { title: string }) {
  return <div role="status" aria-live="polite">
    <span className="sr-only">Loading {title}</span>
    <div className="page-head"><div><h1>{title}</h1></div></div>
    <div className="skeleton-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" />)}</div>
  </div>;
}

export function PageError({ title, offline, retry }: { title: string; offline: boolean; retry: () => void }) {
  return <><div className="page-head"><div><h1>{title}</h1></div></div><ErrorState offline={offline} retry={retry} /></>;
}
