"use client";

import { useState } from "react";

export default function ShareIncident({ title, shareUrl }: { title: string; shareUrl: string }) {
  const [message, setMessage] = useState("");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  async function share() {
    const shareData = { title, text: "Read this incident record with cited sources and visible uncertainty.", url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setMessage("Share options opened.");
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") setMessage("Sharing is unavailable right now.");
      }
      return;
    }
    setMessage("Choose a social platform below to share this record.");
  }

  return <div className="incident-share" aria-label="Share this incident">
    <span className="incident-share__label">Share this record</span>
    <button type="button" className="button-secondary incident-share__primary" onClick={share} aria-label="Share incident link">
      <ShareIcon /> Share
    </button>
    <a className="button-quiet incident-share__social" href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">WhatsApp</a>
    <a className="button-quiet incident-share__social" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">Facebook</a>
    <a className="button-quiet incident-share__social" href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">Twitter</a>
    <span className="sr-only" role="status" aria-live="polite">{message}</span>
  </div>;
}

function ShareIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M12.5 5.5 16 9m0 0-3.5 3.5M16 9H8.5a4.5 4.5 0 0 0 0 9H11M7.5 14.5 4 11m0 0 3.5-3.5M4 11h7.5a4.5 4.5 0 0 0 0-9H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
