"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bars3Icon, BookOpenIcon, ListBulletIcon, MagnifyingGlassIcon, MapIcon, Squares2X2Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Overview", short: "Overview", icon: Squares2X2Icon },
  { href: "/incidents", label: "Incidents", short: "Incidents", icon: ListBulletIcon },
  { href: "/map", label: "Map", short: "Map", icon: MapIcon },
  { href: "/about", label: "Methodology", short: "Method", icon: BookOpenIcon },
];
const active = (pathname: string, href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

type ScanSummary = { stale: boolean; lastCompleted: { finishedAt: string | null } | null };

const scanTime = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(new Date(value));

function ScanStatus() {
  const [scan, setScan] = useState<ScanSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/scan-health", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((payload) => { if (!cancelled) setScan(payload); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const finished = scan?.lastCompleted?.finishedAt;
  if (!finished) return <span className="live-status">Live record</span>;
  return <span className={`live-status ${scan?.stale ? "live-status--stale" : ""}`}>{scan?.stale ? "Scan overdue · last completed" : "Live record · last scan"} {scanTime(finished)} WAT</span>;
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return <AdminHeader />;
  return <>
    <div className="utility-strip"><div className="utility-strip__inner"><ScanStatus /><span className="utility-strip__note">Figures reflect published reports and remain subject to correction</span></div></div>
    <header className="site-header"><div className="site-header__inner">
      <Link href="/" className="brand" aria-label="NATracker overview"><span className="brand__mark"><Logo className="brand__logo" /></span><span><span className="brand__wordmark">NATracker</span><span className="brand__strapline">Nigeria security incident record</span></span></Link>
      <nav className="site-nav" aria-label="Primary navigation">{links.map(({ href, label }) => <Link key={href} href={href} className="site-nav__link" aria-current={active(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
      <form className="site-search" role="search" action="/incidents" method="get">
        <label className="sr-only" htmlFor="site-search">Search incident records</label>
        <MagnifyingGlassIcon aria-hidden="true" />
        <input id="site-search" name="search" type="search" placeholder="Search records, places, actors" autoComplete="off" />
      </form>
      <Link href="/incidents" className="icon-button site-search-link" aria-label="Search incident records"><MagnifyingGlassIcon aria-hidden="true" /></Link>
      <button type="button" className="icon-button menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <XMarkIcon aria-hidden="true" /> : <Bars3Icon aria-hidden="true" />}</button>
    </div>
    <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation" hidden={!open}>{links.map(({ href, label }) => <Link key={href} href={href} className="mobile-menu__link" aria-current={active(pathname, href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
    </header>
    <nav className="bottom-nav" aria-label="Primary navigation">{links.map(({ href, short, icon: Icon }) => <Link key={href} href={href} className="bottom-nav__link" aria-current={active(pathname, href) ? "page" : undefined}><Icon aria-hidden="true" />{short}</Link>)}</nav>
  </>;
}

function AdminHeader() {
  return <header className="site-header admin-header"><div className="site-header__inner"><Link href="/admin" className="brand" aria-label="NATracker administration"><span className="brand__mark"><Logo className="brand__logo" /></span><span><span className="brand__wordmark">NATracker</span><span className="brand__strapline">Administration</span></span></Link><span className="update-note">Admin only</span></div></header>;
}
