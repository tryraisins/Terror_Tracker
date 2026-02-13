"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { ClockIcon } from "@heroicons/react/24/outline";

interface TimeSinceLastAttackProps {
    lastAttackDate: string | null;
}

interface TimeUnits {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeSince(dateStr: string): TimeUnits {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
}

export default function TimeSinceLastAttack({ lastAttackDate }: TimeSinceLastAttackProps) {
    const [time, setTime] = useState<TimeUnits>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!lastAttackDate) return;

        // Initial calculation
        setTime(calculateTimeSince(lastAttackDate));

        // Update every second
        const interval = setInterval(() => {
            setTime(calculateTimeSince(lastAttackDate));
        }, 1000);

        return () => clearInterval(interval);
    }, [lastAttackDate]);

    useEffect(() => {
        if (!containerRef.current) return;
        gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
    }, []);

    if (!lastAttackDate) {
        return null;
    }

    const units = [
        { label: time.days === 1 ? "Day" : "Days", value: time.days },
        { label: time.hours === 1 ? "Hour" : "Hours", value: time.hours },
        { label: time.minutes === 1 ? "Minute" : "Minutes", value: time.minutes },
        { label: time.seconds === 1 ? "Second" : "Seconds", value: time.seconds },
    ];

    return (
        <div ref={containerRef} className="mb-10" style={{ opacity: 0 }}>
            <div
                className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden"
                style={{
                    border: "1px solid rgba(139,26,26,0.2)",
                }}
            >
                {/* Background accent glow */}
                <div
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-8"
                    style={{ background: "var(--color-blood)" }}
                />
                <div
                    className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-5"
                    style={{ background: "var(--color-ember)" }}
                />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-5">
                        <ClockIcon className="w-4 h-4" style={{ color: "var(--color-blood-light)" }} />
                        <span
                            className="text-xs font-bold uppercase tracking-[0.2em]"
                            style={{ color: "var(--color-blood-light)" }}
                        >
                            Time Since Last Recorded Attack
                        </span>
                    </div>

                    {/* Timer digits */}
                    <div className="flex items-center justify-center gap-3 md:gap-5">
                        {units.map((unit, i) => (
                            <div key={unit.label} className="flex items-center gap-3 md:gap-5">
                                <div className="text-center">
                                    <div
                                        className="text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums leading-none mb-1.5"
                                        style={{
                                            fontFamily: "var(--font-heading)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        {String(unit.value).padStart(2, "0")}
                                    </div>
                                    <div
                                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em]"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        {unit.label}
                                    </div>
                                </div>

                                {/* Separator colon */}
                                {i < units.length - 1 && (
                                    <span
                                        className="text-3xl sm:text-4xl md:text-5xl font-light -mt-4 opacity-30"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        :
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-5 text-center">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Last recorded:{" "}
                            <span style={{ color: "var(--text-secondary)" }}>
                                {new Date(lastAttackDate).toLocaleDateString("en-NG", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
