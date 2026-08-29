"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, ChartBarIcon, MapIcon, MoonIcon, NewspaperIcon, ShieldExclamationIcon, SunIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "./Logo";
import { useTheme } from "./ThemeProvider";

const links = [
  { href: "/", label: "Overview", short: "Overview", icon: ChartBarIcon },
  { href: "/incidents", label: "Incidents", short: "Incidents", icon: NewspaperIcon },
  { href: "/map", label: "Map", short: "Map", icon: MapIcon },
  { href: "/about", label: "Methodology", short: "Method", icon: ShieldExclamationIcon },
];
const active = (pathname: string, href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { toggleTheme } = useTheme();
  if (pathname.startsWith("/admin")) return <AdminHeader />;
  return <>
    <header className="site-header"><div className="site-header__inner">
      <Link href="/" className="brand" aria-label="NATracker overview"><span className="brand__mark"><Logo className="h-6 w-6" /></span><span><span className="brand__wordmark">NATracker</span><span className="brand__strapline">Nigeria security incident tracker</span></span></Link>
      <nav className="site-nav" aria-label="Primary navigation">{links.map(({ href, label }) => <Link key={href} href={href} className="site-nav__link" aria-current={active(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
      <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle colour theme" title="Toggle colour theme">
        <SunIcon className="theme-toggle__sun h-4 w-4" aria-hidden="true" /><MoonIcon className="theme-toggle__moon h-4 w-4" aria-hidden="true" /><span>Theme</span>
      </button>
      <button type="button" className="menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}</button>
    </div>
    <nav className="mobile-menu" aria-label="Mobile navigation" hidden={!open}>{links.map(({ href, label }) => <Link key={href} href={href} className="mobile-menu__link" aria-current={active(pathname, href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
    </header>
    <nav className="bottom-nav" aria-label="Primary navigation">{links.map(({ href, short, icon: Icon }) => <Link key={href} href={href} className="bottom-nav__link" aria-current={active(pathname, href) ? "page" : undefined}><Icon aria-hidden="true" />{short}</Link>)}</nav>
  </>;
}

function AdminHeader() {
  return <header className="admin-header"><div className="admin-header__inner"><Link href="/admin" className="brand" aria-label="NATracker administration"><span className="brand__mark"><Logo className="h-6 w-6" /></span><span><span className="brand__wordmark">NATracker</span><span className="brand__strapline">Administration</span></span></Link><span className="update-note">Admin only</span></div></header>;
}
