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

    useEffect(() => {
        if (!cardRef.current || !valueRef.current) return;

        gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, delay, ease: "power3.out" }
        );

        // Animate counter
        if (typeof value === "number") {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: value,
                duration: 1.5,
                delay: delay + 0.3,
                ease: "power2.out",
                onUpdate: () => {
                    if (valueRef.current) {
                        valueRef.current.textContent = Math.round(obj.val).toLocaleString();
                    }
                },
            });
        }
    }, [value, delay]);

    return (
        <div
            ref={cardRef}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group"
            style={{ opacity: 0 }}
        >
            {/* Accent glow */}
            <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 
        transition-opacity duration-500 group-hover:opacity-20"
                style={{ background: color }}
            />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: `${color}15`, color }}
                    >
                        {icon}
                    </div>
                    {trend && (
                        <span
                            className="text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{
                                background: trend.startsWith("+")
                                    ? "rgba(255,65,54,0.12)"
                                    : "rgba(46,204,64,0.12)",
                                color: trend.startsWith("+") ? "var(--color-urgent)" : "var(--color-safe)",
                            }}
                        >
                            {trend}
                        </span>
                    )}
                </div>

                <div
                    ref={valueRef}
                    className="text-3xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-heading)", color }}
                >
                    {typeof value === "number" ? "0" : value}
                </div>

                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    {label}
                </p>
            </div>
        </div>
    );
}
