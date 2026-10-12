"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

const links = [
  { href: "/incidents", label: "Record" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "Method" },
];
const active = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return <AdminHeader />;
  return <header className="site-header">
    <div className="site-header__inner">
      <Link href="/" className="brand" aria-label="NATracker home">NATracker</Link>
      <nav className="site-nav" aria-label="Primary navigation">{links.map(({ href, label }) => <Link key={href} href={href} className="site-nav__link" aria-current={active(pathname, href) ? "page" : undefined}>{label}</Link>)}</nav>
      <Link href="/incidents?focus=search" className="icon-button site-search-link" aria-label="Search the record"><MagnifyingGlassIcon aria-hidden="true" /></Link>
      <button type="button" className="icon-button menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>{open ? <XMarkIcon aria-hidden="true" /> : <Bars3Icon aria-hidden="true" />}</button>
    </div>
    <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile navigation" hidden={!open}>
      <Link href="/" className="mobile-menu__link" aria-current={pathname === "/" ? "page" : undefined} onClick={() => setOpen(false)}>Home</Link>
      {links.map(({ href, label }) => <Link key={href} href={href} className="mobile-menu__link" aria-current={active(pathname, href) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
    </nav>
  </header>;
}

function AdminHeader() {
  return <header className="site-header admin-header"><div className="site-header__inner"><Link href="/admin" className="brand" aria-label="NATracker administration">NATracker</Link><span className="update-note">Administration</span></div></header>;
}
