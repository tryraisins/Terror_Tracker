"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
    ShieldExclamationIcon,
    GlobeAltIcon,
    ClockIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon,
    CpuChipIcon,
    ServerStackIcon,
} from "@heroicons/react/24/outline";

const features = [
    {
        icon: CpuChipIcon,
        title: "AI-Powered Collection",
        description:
            "Uses Google Gemini with web search grounding to scan verified news sources, security reports, and field correspondents for the latest incident data.",
    },
    {
        icon: ClockIcon,
        title: "Daily Updates",
        description:
            "System runs every day to search for new incidents, ensuring near real-time coverage of developing security situations across Nigeria.",
    },
    {
        icon: CheckBadgeIcon,
        title: "Deduplication Engine",
        description:
            "Advanced SHA-256 hashing and fuzzy matching prevents duplicate entries even when the same incident is reported by multiple outlets with different wording.",
    },
    {
        icon: GlobeAltIcon,
        title: "Multiple Source Verification",
        description:
            "Cross-references data across Premium Times, Sahara Reporters, Channels TV, Punch, HumAngle, Reuters, AFP, and trusted analyst accounts on X (Twitter).",
    },
    {
        icon: DocumentTextIcon,
        title: "Source Transparency",
        description:
            "Every incident includes direct links to the original news articles and reports, enabling users to verify information and perform additional research.",
    },
    {
        icon: ShieldExclamationIcon,
        title: "Comprehensive Data",
        description:
            "Each report captures the armed group responsible, exact location (state, LGA, town), casualty breakdown (killed, injured, kidnapped, displaced), and current status.",
    },
];

const dataSources = [
    { name: "Premium Times Nigeria", type: "News" },
    { name: "Sahara Reporters", type: "News" },
    { name: "Channels TV", type: "News" },
    { name: "The Punch", type: "News" },
    { name: "Vanguard Nigeria", type: "News" },
    { name: "Daily Trust", type: "News" },
    { name: "HumAngle Media", type: "Security" },
    { name: "The Cable", type: "News" },
    { name: "Peoples Gazette", type: "News" },
    { name: "Reuters", type: "Wire" },
    { name: "AFP", type: "Wire" },
    { name: "ACLED", type: "Database" },
    { name: "Zagazola Makama", type: "Security" },
    { name: "@BrantPhilip_", type: "X/Twitter" },
    { name: "@Sazedek", type: "X/Twitter" },
];

export default function AboutPage() {
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!featuresRef.current) return;
        const cards = featuresRef.current.children;
        gsap.fromTo(
            cards,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
        );
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            {/* Hero */}
            <div className="mb-16 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                            background: "rgba(139,26,26,0.1)",
                            color: "var(--color-blood-light)",
                            border: "1px solid rgba(139,26,26,0.2)",
                        }}
                    >
                        About the Project
                    </div>
                </div>

                <h1
                    className="text-3xl sm:text-5xl font-bold leading-tight mb-6"
                    style={{ fontFamily: "var(--font-heading)" }}
                >
                    Tracking Insecurity
                    <br />
                    <span className="bg-clip-text text-transparent"
                        style={{
                            backgroundImage: "linear-gradient(135deg, var(--color-blood), var(--color-ember))",
                        }}
                    >
                        Across Nigeria
                    </span>
                </h1>

                <div className="max-w-3xl space-y-4 text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <p>
                        <strong style={{ color: "var(--text-primary)" }}>NATracker</strong> (Nigeria Attack Tracker) is an
                        automated intelligence tool that monitors, collects, and presents data on terrorist attacks,
                        insurgent activities, bandit raids, and militant operations across Nigeria.
                    </p>
                    <p>
                        The project was created to fill a critical gap in accessible, real-time security data. While
                        organizations like ACLED maintain excellent databases,
                        NATracker provides a more immediate, continuously updated view by scanning news sources hourly.
                    </p>
                    <p>
                        <strong style={{ color: "var(--color-urgent)" }}>Important:</strong> This tool is for research
                        and awareness purposes only. While we strive for accuracy, data is collected from news reports
                        which may contain inaccuracies, especially for developing situations. Always verify through the
                        provided source links.
                    </p>
                </div>
            </div>

            {/* How It Works */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-8 animate-fade-in-up" style={{ fontFamily: "var(--font-heading)" }}>
                    How It Works
                </h2>

                <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 animate-fade-in-up stagger-1">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blood to-ember">
                            <ServerStackIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                                Data Pipeline
                            </h3>
                            <ol className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                        style={{ background: "var(--accent)", color: "#fff" }}>1</span>
                                    <span><strong style={{ color: "var(--text-primary)" }}>Cron Trigger:</strong> cron-job.org sends an HTTP POST request to our API every hour with a secure authentication header.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                        style={{ background: "var(--accent)", color: "#fff" }}>2</span>
                                    <span><strong style={{ color: "var(--text-primary)" }}>AI Search:</strong> Gemini 2.5 Flash uses Google Search grounding to scan the web for recent attack reports from trusted news sources and analyst accounts.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                        style={{ background: "var(--accent)", color: "#fff" }}>3</span>
                                    <span><strong style={{ color: "var(--text-primary)" }}>Data Extraction:</strong> The AI extracts structured data including location, group, casualties, date, and source links from each reported incident.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                        style={{ background: "var(--accent)", color: "#fff" }}>4</span>
                                    <span><strong style={{ color: "var(--text-primary)" }}>Deduplication:</strong> Each incident is hashed using SHA-256 (based on date, state, town, and group) and also checked against existing records for fuzzy duplicates.</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                                        style={{ background: "var(--accent)", color: "#fff" }}>5</span>
                                    <span><strong style={{ color: "var(--text-primary)" }}>Storage:</strong> New, unique incidents are stored in MongoDB Atlas with full metadata and source references.</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "var(--font-heading)" }}>
                    Features
                </h2>
                <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="glass-card rounded-2xl p-6 group"
                                style={{ opacity: 0 }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4
                  transition-transform duration-300 group-hover:scale-110"
                                    style={{
                                        background: "rgba(139,26,26,0.1)",
                                        color: "var(--color-blood-light)",
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                                    {feature.title}
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Data Sources */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "var(--font-heading)" }}>
                    Data Sources
                </h2>
                <div className="glass-card rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dataSources.map((source) => (
                            <div
                                key={source.name}
                                className="flex items-center justify-between p-3 rounded-xl transition-all duration-200
                  hover:bg-[var(--border-subtle)]"
                            >
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    {source.name}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                    style={{
                                        background: "var(--border-subtle)",
                                        color: "var(--text-muted)",
                                    }}
                                >
                                    {source.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


        </div>
    );
}
