"use client";

import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function Footer() {
    return (
        <footer
            className="mt-20 border-t py-12 px-6"
            style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blood to-ember">
                            <ShieldExclamationIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                                NAT<span className="text-blood-light">racker</span>
                            </h3>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                Nigeria Attack Tracker
                            </p>
                        </div>
                    </div>

                    {/* Info */}
                    <p className="text-xs text-center max-w-md" style={{ color: "var(--text-muted)" }}>
                        Data is collected from verified news sources and may contain inaccuracies.
                        Always verify information through the provided source links before citing.
                        This tracker is for research and awareness purposes only.
                    </p>

                    {/* Year */}
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        &copy; {new Date().getFullYear()} NATracker
                    </p>
                </div>
            </div>
        </footer>
    );
}
