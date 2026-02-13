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
            className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1"
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
                className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-500"
                style={{
                    background: color,
                    opacity: 0,
                }}
            />

            <div className="relative z-10 flex flex-col h-full justify-between min-h-[110px]">
                {/* Header: Label & Icon */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col flex-1 pr-3">
                        <div
                            className="text-xs font-bold tracking-widest uppercase opacity-70 mb-1"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {label}
                        </div>
                    </div>

                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                        style={{
                            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                            border: `1px solid ${color}20`,
                            color: color,
                            boxShadow: `0 2px 8px ${color}10`
                        }}
                    >
                        {/* Clone icon with smaller size if needed, or rely on parent sizing */}
                        <div className="w-5 h-5">
                            {icon}
                        </div>
                    </div>
                </div>

                {/* Content: Value & Trend */}
                <div className="flex items-end gap-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div
                        ref={valueRef}
                        className="text-4xl md:text-5xl font-bold tracking-tight leading-none"
                        style={{
                            fontFamily: "var(--font-heading)",
                            color: "var(--text-primary)"
                        }}
                    >
                        {typeof value === "number" ? "0" : value}
                    </div>

                    {trend && (
                        <div
                            className="flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm mb-1.5"
                            style={{
                                background: trend.startsWith("+") ? "var(--color-urgent)" : "var(--color-safe)",
                                color: "#fff",
                            }}
                        >
                            {trend}
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Border Glow */}
            <div
                className="absolute inset-0 border-2 rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{ borderColor: `${color}40` }}
            />
        </div>
    );
}
