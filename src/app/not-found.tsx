import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/DataState";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * Rendered by notFound(), including from the incident detail route. It exists so
 * a missing record answers with a real 404 status while still showing the
 * site's own chrome rather than a bare framework page.
 */
export default function NotFound() {
  return (
    <div className="page-wrap">
      <EmptyState
        title="Page not found"
        action={<Link className="button-secondary" href="/incidents">Browse the record</Link>}
      >
        This page may have moved, or the record may no longer be included in the public record.
      </EmptyState>
    </div>
  );
}
