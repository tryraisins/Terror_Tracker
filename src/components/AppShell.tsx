"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ListIcon, MapDefs, MapIcon, MethodIcon, OverviewIcon, PatternsIcon, SearchIcon, Silhouette, StatesIcon } from "./icons";
import { ShareProvider } from "./Share";
import { dayLabel, fmt } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

const NAV = [
  { href: "/", label: "Overview", Icon: OverviewIcon },
  { href: "/map", label: "Map", Icon: MapIcon },
  { href: "/incidents", label: "Incidents", Icon: ListIcon },
  { href: "/patterns", label: "Patterns", Icon: PatternsIcon },
  { href: "/states", label: "States", Icon: StatesIcon },
  { href: "/about", label: "Method", Icon: MethodIcon },
];
const isActive = (pathname: string, href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
const scanTime = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(new Date(value));

function Brand({ sub = true }: { sub?: boolean }) {
  return <Link className="shell-brand" href="/" aria-label="NATracker overview"><Silhouette /><span><b>NATracker</b>{sub ? <small>Attacks in Nigeria</small> : null}</span></Link>;
}

/** Archive freshness for readers: record count, newest attack and the last completed scan. */
function StatusCard() {
  const { data } = useSummary();
  const [scan, setScan] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/scan-health", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((payload) => { if (!cancelled) setScan(payload?.lastCompletedAt ?? null); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const newest = data?.records[0];
  return <div className="status-card">
    <b>Archive status</b><span className="muted">Checked for new reports twice a day.</span>
    {data ? <div className="status-row"><span>Records in {data.year}</span><span>{fmt(data.records.length)}</span></div> : null}
    {newest ? <div className="status-row"><span>Newest attack</span><span>{dayLabel(newest)}</span></div> : null}
    {scan ? <div className="status-row"><span>Last checked</span><span title="West Africa Time">{scanTime(scan)}</span></div> : null}
  </div>;
}

function SearchBox() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); const query = value.trim(); router.push(query ? `/incidents?search=${encodeURIComponent(query)}` : "/incidents?focus=search"); };
  return <form className="shell-search" role="search" onSubmit={submit}><SearchIcon /><label className="sr-only" htmlFor="shell-search">Search incidents</label><input id="shell-search" type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search a town, LGA, state or group" /></form>;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <div className="admin-shell"><MapDefs /><header className="admin-bar"><Brand sub={false} /><span className="dim">Administration</span></header><main id="main-content" className="shell-main">{children}</main></div>;
  }
  return <ShareProvider>
    <MapDefs />
    <div className="shell">
      <aside className="shell-side">
        <Brand />
        <div><div className="shell-label">Explore</div><nav className="shell-nav" aria-label="Main">{NAV.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined}><Icon />{label}</Link>)}</nav></div>
        <StatusCard />
        <Link className="btn btn-ghost" style={{ justifyContent: "flex-start" }} href="/about#corrections">How corrections work</Link>
      </aside>
      <div className="shell-main">
        <div className="mobile-top"><Brand sub={false} /><Link className="icon-btn" href="/incidents?focus=search" aria-label="Search incidents"><SearchIcon /></Link></div>
        <div className="shell-top"><SearchBox /><span className="shell-top__note">Built from published news reports</span></div>
        <main id="main-content">{children}</main>
        <footer className="shell-footer"><p>NATracker is an independent record of violent attacks in Nigeria, built from published news reports. Every figure links to its sources and may change as reports are corrected.</p><nav aria-label="Footer">{NAV.slice(1).map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}</nav></footer>
      </div>
      <nav className="tabbar" aria-label="Main">{NAV.slice(0, 4).map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined}><Icon />{label}</Link>)}</nav>
    </div>
  </ShareProvider>;
}
