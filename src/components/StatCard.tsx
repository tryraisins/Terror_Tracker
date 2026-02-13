"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    color?: string;
    delay?: number;
}

export default function StatCard({ label, value, icon, trend, color = "var(--accent)", delay = 0 }: StatCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cardRef.current || !valueRef.current) return;

        // Intro animation
        gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, delay, ease: "power2.out" }
        );

        // Counter animation
        if (typeof value === "number") {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: value,
                duration: 1.2,
                delay: delay + 0.2,
                ease: "power2.out",
                onUpdate: () => {
                    if (valueRef.current) {
                        valueRef.current.textContent = Math.round(obj.val).toLocaleString();
                    }
                },
            });
        }
    }, [value, delay]);

    const handleMouseEnter = () => {
        if (bgRef.current) {
            gsap.to(bgRef.current, { scale: 1.2, opacity: 0.15, duration: 0.4 });
        }
    };

    const handleMouseLeave = () => {
        if (bgRef.current) {
            gsap.to(bgRef.current, { scale: 1, opacity: 0.05, duration: 0.4 });
        }
    };

    return (
        <div
            ref={cardRef}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                opacity: 0,
                borderColor: "var(--border-subtle)"
            }}
        >
            {/* Background Decor */}
            <div
                ref={bgRef}
                className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{
                    background: color,
                    opacity: 0.05,
                    transition: "opacity 0.3s ease"
                }}
            />

            <div className="relative z-10 flex flex-col items-center text-center h-full gap-4">

                {/* Header: Icon & Trend */}
                <div className="relative">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-3"
                        style={{
                            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                            border: `1px solid ${color}20`,
                            color: color,
                            boxShadow: `0 4px 12px ${color}15`
                        }}
                    >
                        {icon}
                    </div>

                    {trend && (
                        <div
                            className="absolute -top-2 -right-3 flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm"
                            style={{
                                background: trend.startsWith("+") ? "var(--color-urgent)" : "var(--color-safe)",
                                color: "#fff",
                                border: "2px solid var(--bg-card)"
                            }}
                        >
                            {trend}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center">
                    <div
                        ref={valueRef}
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-2 leading-none"
                        style={{
                            fontFamily: "var(--font-heading)",
                            color: "var(--text-primary)"
                        }}
                    >
                        {typeof value === "number" ? "0" : value}
                    </div>
                    <div className="text-xs font-bold tracking-widest uppercase opacity-60" style={{ color: "var(--text-secondary)" }}>
                        {label}
                    </div>
                </div>
            </div>

            {/* Hover Border Glow (replaces the line that was covering text) */}
            <div
                className="absolute inset-0 border-2 rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{ borderColor: `${color}40` }}
            />
        </div>
    );
}
