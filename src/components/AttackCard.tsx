"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
    MapPinIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ArrowTopRightOnSquareIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface AttackCardProps {
    attack: {
        _id: string;
        title: string;
        description: string;
        date: string;
        location: {
            state: string;
            lga: string;
            town: string;
        };
        group: string;
        casualties: {
            killed: number | null;
            injured: number | null;
            kidnapped: number | null;
            displaced: number | null;
        };
        sources: {
            url: string;
            title: string;
            publisher: string;
        }[];
        status: "confirmed" | "unconfirmed" | "developing";
        tags: string[];
    };
    index?: number;
}

export default function AttackCard({ attack, index = 0 }: AttackCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cardRef.current) return;
        gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 20, scale: 0.98 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                delay: index * 0.08,
                ease: "power2.out",
            }
        );
    }, [index]);

    const totalCasualties =
        (attack.casualties.killed || 0) +
        (attack.casualties.injured || 0) +
        (attack.casualties.kidnapped || 0);

    const statusClasses: Record<string, string> = {
        confirmed: "badge-confirmed",
        unconfirmed: "badge-unconfirmed",
        developing: "badge-developing",
    };

    return (
        <div
            ref={cardRef}
            className="glass-card rounded-2xl overflow-hidden group"
            style={{ opacity: 0 }}
        >
            {/* Status bar */}
            <div
                className="h-1"
                style={{
                    background:
                        attack.status === "confirmed"
                            ? "var(--color-safe)"
                            : attack.status === "developing"
                                ? "var(--color-developing)"
                                : "var(--color-urgent)",
                }}
            />

            <div className="p-5 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3
                        className="text-lg font-semibold leading-snug line-clamp-2 group-hover:text-blood-light transition-colors"
                        style={{ fontFamily: "var(--font-heading)" }}
                    >
                        {attack.title}
                    </h3>
                    <span className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${statusClasses[attack.status]}`}>
                        {attack.status}
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: "var(--text-secondary)" }}>
                    {attack.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {attack.location.town !== "Unknown" && `${attack.location.town}, `}
                        {attack.location.lga !== "Unknown" && `${attack.location.lga}, `}
                        {attack.location.state}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {format(new Date(attack.date), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <UserGroupIcon className="w-3.5 h-3.5" />
                        {attack.group}
                    </span>
                </div>

                {/* Casualties */}
                {totalCasualties > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {attack.casualties.killed !== null && attack.casualties.killed > 0 && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{
                                    background: "rgba(255,65,54,0.1)",
                                    color: "var(--color-urgent)",
                                }}
                            >
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                {attack.casualties.killed} killed
                            </span>
                        )}
                        {attack.casualties.injured !== null && attack.casualties.injured > 0 && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{
                                    background: "rgba(255,133,27,0.1)",
                                    color: "var(--color-caution)",
                                }}
                            >
                                {attack.casualties.injured} injured
                            </span>
                        )}
                        {attack.casualties.kidnapped !== null && attack.casualties.kidnapped > 0 && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{
                                    background: "rgba(0,116,217,0.1)",
                                    color: "var(--color-verified)",
                                }}
                            >
                                {attack.casualties.kidnapped} kidnapped
                            </span>
                        )}
                    </div>
                )}

                {/* Tags */}
                {attack.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {attack.tags.slice(0, 5).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider"
                                style={{
                                    background: "var(--border-subtle)",
                                    color: "var(--text-muted)",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Sources */}
                {attack.sources?.length > 0 && (
                    <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--border-subtle)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                            Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {attack.sources.slice(0, 3).map((source, i) => (
                                <a
                                    key={i}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs font-medium transition-colors
                    hover:text-blood-light"
                                    style={{ color: "var(--color-verified)" }}
                                >
                                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                    {source.publisher || source.title || "Source"}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
