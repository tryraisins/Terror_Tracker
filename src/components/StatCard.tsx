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
            className="glass-card rounded-2xl p-6 relative overflow-hidden group transition-colors duration-300"
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
                className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl pointer-events-none"
                style={{
                    background: color,
                    opacity: 0.05,
                    transition: "opacity 0.3s ease"
                }}
            />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                    {/* Icon Container */}
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 ease-out group-hover:rotate-3"
                        style={{
                            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                            border: `1px solid ${color}20`,
                            color: color
                        }}
                    >
                        {icon}
                    </div>

                    {/* Trend Pill (Optional) */}
                    {trend && (
                        <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{
                                background: trend.startsWith("+")
                                    ? "rgba(255, 65, 54, 0.1)"
                                    : "rgba(46, 204, 64, 0.1)",
                                color: trend.startsWith("+")
                                    ? "var(--color-urgent)"
                                    : "var(--color-safe)",
                                border: `1px solid ${trend.startsWith("+") ? "rgba(255,65,54,0.2)" : "rgba(46,204,64,0.2)"}`
                            }}
                        >
                            {trend}
                        </div>
                    )}
                </div>

                <div>
                    <div
                        ref={valueRef}
                        className="text-4xl font-bold tracking-tight mb-1"
                        style={{
                            fontFamily: "var(--font-heading)",
                            color: "var(--text-primary)"
                        }}
                    >
                        {typeof value === "number" ? "0" : value}
                    </div>
                    <div className="text-sm font-medium tracking-wide uppercase opacity-70" style={{ color: "var(--text-secondary)" }}>
                        {label}
                    </div>
                </div>

                {/* Bottom decorative line */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-current opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:w-full w-0"
                    style={{ background: color }}
                />
            </div>
        </div>
    );
}
