"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownTrayIcon,
  Bars3Icon,
  ChartBarIcon,
  MapIcon,
  MoonIcon,
  NewspaperIcon,
  ShieldExclamationIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Logo from "./Logo";
import { useTheme } from "./ThemeProvider";

const navLinks = [
  { href: "/", label: "Dashboard", icon: ChartBarIcon },
  { href: "/incidents", label: "Incidents", icon: NewspaperIcon },
  { href: "/map", label: "Threat map", icon: MapIcon },
  { href: "/about", label: "Methodology", icon: ShieldExclamationIcon },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    const appMode = window.matchMedia("(display-mode: standalone)");
    const updateDisplayMode = () => setIsStandalone(appMode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    handleScroll();
    updateDisplayMode();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    appMode.addEventListener("change", updateDisplayMode);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      appMode.removeEventListener("change", updateDisplayMode);
    };
  }, []);

  useEffect(() => setIsOpen(false), [pathname]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.alert(isIOS
      ? "To install NATracker, tap Share, then choose Add to Home Screen."
      : "To install NATracker, choose Install app or Add to Home Screen from your browser menu.");
  };

  return (
    <nav className={`site-nav ${scrolled ? "site-nav-scrolled" : ""}`} aria-label="Primary navigation">
      <div className="site-nav-row">
        <Link href="/" className="brand-mark" aria-label="NATracker home">
          <span className="brand-icon"><Logo className="h-5 w-5 text-white" /></span>
          <span className="hidden min-[430px]:block">
            <span className="brand-name">NAT<span>racker</span></span>
            <span className="brand-subtitle">Nigeria security intelligence</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1" aria-label="Pages">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={`nav-link ${active ? "nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="live-status hidden md:inline-flex"><span /> Live data</span>
          {!isStandalone && (
            <button type="button" onClick={handleInstallClick} className="utility-button hidden sm:inline-flex" title="Install NATracker">
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span className="hidden xl:inline">Install</span>
            </button>
          )}
          <button type="button" onClick={toggleTheme} className="icon-button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => setIsOpen((open) => !open)} className="icon-button lg:hidden" aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isOpen}>
            {isOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className={`mobile-nav ${isOpen ? "mobile-nav-open" : ""}`}>
        <div className="mobile-nav-content">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}><Icon className="h-5 w-5" />{label}</Link>;
          })}
          {!isStandalone && <button type="button" onClick={handleInstallClick} className="mobile-install"><ArrowDownTrayIcon className="h-5 w-5" />Install NATracker</button>}
        </div>
      </div>
    </nav>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
