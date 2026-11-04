"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon, DownloadIcon, FacebookIcon, LinkedInIcon, LinkIcon, Locator, ShareIcon, Silhouette, TelegramIcon, TextIcon, WhatsAppIcon, XIcon } from "./icons";
import { SITE_URL } from "@/lib/site-config";
import { dayLabel, placeLine, placeName, type SummaryRow } from "@/lib/summary";

/** What a share needs: the slim row plus optional display overrides such as "20+". */
export type Shareable = Pick<SummaryRow, "id" | "d" | "dp" | "t" | "town" | "lga" | "s" | "k" | "ab" | "ko" | "abo">;

const urlFor = (row: Shareable) => `${SITE_URL}/incidents/${row.id}`;
export const killedText = (row: Pick<Shareable, "k" | "ko">) => row.k ? `${row.k.toLocaleString("en-NG")}${row.ko ? "+" : ""}` : "";
export const abductedText = (row: Pick<Shareable, "ab" | "abo">) => row.ab ? `${row.ab.toLocaleString("en-NG")}${row.abo ? "+" : ""}` : "";

/** Plain text for broadcast lists and group chats: place, date, toll and the link. */
export function shareText(row: Shareable) {
  const toll = [row.k ? `${killedText(row)} killed` : "", row.ab ? `${abductedText(row)} abducted` : ""].filter(Boolean).join(", ");
  return `${placeName(row)}, ${placeLine(row)}. ${dayLabel(row, true)}. ${toll ? `Reported toll: ${toll}.` : "Toll not reported yet."} ${row.t}\nSources and details: ${urlFor(row)}`;
}

export function LinkPreview({ row }: { row: Shareable }) {
  return <div className="og" aria-label="Link preview">
    <div className="og-l">
      <div className="og-brand"><Silhouette />NATracker</div>
      <div className="og-date">{dayLabel(row, true)}</div>
      <div className="og-place">{placeName(row)}</div>
      <div className="og-where">{placeLine(row)}</div>
      <div className="og-figs">{row.k ? <span className="k">{killedText(row)} killed</span> : null}{row.ab ? <span className="a">{abductedText(row)} abducted</span> : null}{!row.k && !row.ab ? <span>Toll not reported yet</span> : null}</div>
    </div>
    <div className="og-r"><Locator state={row.s} className="" /></div>
  </div>;
}

/** Every platform, plus copy text, the preview image and the link. */
export function ShareActions({ row }: { row: Shareable }) {
  const [note, setNote] = useState("");
  const url = urlFor(row);
  const u = encodeURIComponent(url);
  const text = encodeURIComponent(`${placeName(row)}: ${row.t}`);
  const copy = async (value: string, done: string) => {
    try { await navigator.clipboard.writeText(value); setNote(done); } catch { setNote("Copying is blocked in this browser. Select the link below instead."); }
  };
  const open = { target: "_blank", rel: "noopener noreferrer" } as const;
  return <>
    <div className="share-grid">
      <a href={`https://wa.me/?text=${encodeURIComponent(shareText(row))}`} {...open} aria-label="Share on WhatsApp (opens in a new tab)"><WhatsAppIcon />WhatsApp</a>
      <a href={`https://twitter.com/intent/tweet?text=${text}&url=${u}`} {...open} aria-label="Share on X (opens in a new tab)"><XIcon />X</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} {...open} aria-label="Share on Facebook (opens in a new tab)"><FacebookIcon />Facebook</a>
      <a href={`https://t.me/share/url?url=${u}&text=${text}`} {...open} aria-label="Share on Telegram (opens in a new tab)"><TelegramIcon />Telegram</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} {...open} aria-label="Share on LinkedIn (opens in a new tab)"><LinkedInIcon />LinkedIn</a>
      <button type="button" onClick={() => copy(shareText(row), "Summary copied. Paste it into any chat.")}><TextIcon />Copy text</button>
      <a href={`/incidents/${row.id}/opengraph-image`} download={`natracker-${row.id}.png`}><DownloadIcon />Save image</a>
      <button type="button" onClick={() => copy(url, "Link copied.")}><LinkIcon />Copy link</button>
    </div>
    <div className="copy"><input readOnly value={url} aria-label="Incident link" onFocus={(event) => event.currentTarget.select()} /><button type="button" className="btn" onClick={() => copy(url, "Link copied.")}>Copy</button></div>
    <p className="share-note" role="status" aria-live="polite">{note}</p>
  </>;
}

const ShareContext = createContext<(row: Shareable) => void>(() => undefined);

export function ShareProvider({ children }: { children: ReactNode }) {
  const [row, setRow] = useState<Shareable | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openSheet = useCallback((next: Shareable) => { returnFocus.current = document.activeElement as HTMLElement; setRow(next); }, []);
  const close = useCallback(() => { setRow(null); returnFocus.current?.focus(); }, []);
  useEffect(() => {
    if (!row) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, close]);
  return <ShareContext.Provider value={openSheet}>
    {children}
    {row ? <div className="sheet-bg" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div><h2 id="share-title">Share this incident</h2><p className="dim" style={{ margin: "4px 0 0", fontSize: 13 }}>The link opens with this preview on every platform.</p></div>
          <button ref={closeRef} type="button" className="icon-btn" onClick={close} aria-label="Close sharing"><CloseIcon /></button>
        </div>
        <div style={{ marginTop: 16 }}><LinkPreview row={row} /></div>
        <ShareActions row={row} />
      </div>
    </div> : null}
  </ShareContext.Provider>;
}

export function ShareButton({ row, label }: { row: Shareable; label?: string }) {
  const open = useContext(ShareContext);
  return label
    ? <button type="button" className="btn btn-primary" onClick={() => open(row)}><ShareIcon />{label}</button>
    : <button type="button" className="icon-btn" onClick={() => open(row)} aria-label={`Share the ${placeName(row)} incident`}><ShareIcon /></button>;
}

/** Uses the phone's own share sheet when there is one, otherwise ours. */
export function NativeShareButton({ row }: { row: Shareable }) {
  const open = useContext(ShareContext);
  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: `${placeName(row)}: ${row.t}`, text: shareText(row), url: urlFor(row) }); return; } catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
    }
    open(row);
  };
  return <button type="button" className="btn btn-primary" onClick={share}><ShareIcon />Share</button>;
}
