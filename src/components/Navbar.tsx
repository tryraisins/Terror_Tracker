"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bars3Icon,
    XMarkIcon,
    MapIcon,
    NewspaperIcon,
    ChartBarIcon,
    ShieldExclamationIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Logo from "./Logo";
const navLinks = [
    { href: "/", label: "Dashboard", icon: ChartBarIcon },
    { href: "/incidents", label: "Incidents", icon: NewspaperIcon },
    { href: "/map", label: "Threat Map", icon: MapIcon },
    { href: "/about", label: "About", icon: ShieldExclamationIcon },
];

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll, { passive: true });

        // PWA display mode check - deferred to prevent synchronous setState cascading renders
        Promise.resolve().then(() => {
            const isAppMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
            setIsStandalone(!!isAppMode);
        });

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
            }
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
            if (isIOS) {
                alert("To install NATracker on iOS:\n1. Tap the Share button at the bottom\n2. Tap 'Add to Home Screen'");
            } else {
                alert("To install NATracker, look for 'Add to Home Screen' or 'Install' in your browser's menu.");
            }
        }
    };

    const [prevPathname, setPrevPathname] = useState(pathname);

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        setIsOpen(false);
    }

    return (
        <nav
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl 
        rounded-2xl transition-all duration-500 ease-out
        ${scrolled ? "glass shadow-xl py-2" : "glass py-3"}
      `}
            style={{
                boxShadow: scrolled
                    ? "0 8px 32px rgba(139,26,26,0.12), 0 0 0 1px var(--border-glass)"
                    : "0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px var(--border-glass)",
            }}
        >
            <div className="flex items-center justify-between px-5 md:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center
              bg-gradient-to-br from-blood to-ember transition-transform 
              duration-300 group-hover:scale-110 group-hover:rotate-3"
                    >
                        <Logo className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <h1
                            className="text-base font-bold tracking-tight leading-none"
                            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                        >
                            NAT<span className="text-blood-light">racker</span>
                        </h1>
                        <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)" }}>
                            Nigeria Attack Tracker
                        </p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  transition-all duration-300
                  ${isActive
                                        ? "text-white"
                                        : "hover:bg-[var(--border-subtle)]"
                                    }
                `}
                                style={{
                                    color: isActive ? "#fff" : "var(--text-secondary)",
                                    background: isActive
                                        ? "linear-gradient(135deg, var(--color-blood), var(--color-ember))"
                                        : undefined,
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                    {/* Install App Button (Desktop) */}
                    {!isStandalone && (
                        <button
                            onClick={handleInstallClick}
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 hover:scale-105"
                            style={{
                                background: "rgba(139,26,26,0.15)",
                                color: "var(--color-blood, #dc2626)",
                                border: "1px solid rgba(139,26,26,0.3)",
                            }}
                            title="Install NATracker App"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Install App
                        </button>
                    )}

                    {/* Live indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                            background: "rgba(46,204,64,0.12)",
                            color: "var(--color-safe)",
                            border: "1px solid rgba(46,204,64,0.25)",
                        }}
                    >
                        <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                        LIVE
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center
              transition-all duration-300 hover:bg-[var(--border-subtle)]"
                        style={{ color: "var(--text-secondary)" }}
                        aria-label="Toggle menu"
                        id="mobile-menu-toggle"
                    >
                        {isOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-400 ease-out
          ${isOpen ? "max-h-80 opacity-100 mt-3" : "max-h-0 opacity-0"}
        `}
            >
                <div className="px-5 pb-4 space-y-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="pt-3" />
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-300
                `}
                                style={{
                                    color: isActive ? "#fff" : "var(--text-secondary)",
                                    background: isActive
                                        ? "linear-gradient(135deg, var(--color-blood), var(--color-ember))"
                                        : "transparent",
                                }}
                            >
                                <Icon className="w-5 h-5" />
                                {link.label}
                            </Link>
                        );
                    })}

                    {!isStandalone && (
                        <button
                            onClick={() => {
                                handleInstallClick();
                                setIsOpen(false);
                            }}
                            className="w-full mt-3 flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                            style={{
                                color: "#fff",
                                background: "linear-gradient(135deg, var(--color-blood), var(--color-ember))",
                            }}
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Install NATracker App
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
