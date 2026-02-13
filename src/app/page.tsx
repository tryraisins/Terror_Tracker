"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import StatCard from "@/components/StatCard";
import AttackCard from "@/components/AttackCard";
import BarChart from "@/components/BarChart";
import HorizontalBar from "@/components/HorizontalBar";
import TimeSinceLastAttack from "@/components/TimeSinceLastAttack";
import { CardSkeleton, AttackCardSkeleton, ChartSkeleton } from "@/components/Skeletons";
import {
  BoltIcon,
  UserMinusIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ClockIcon,
  CalendarDaysIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

interface StatsData {
  overview: {
    totalAttacks: number;
    totalKilled: number;
    totalInjured: number;
    totalKidnapped: number;
    attacksLast30Days: number;
    attacksLast7Days: number;
    year: number;
  };
  byState: { state: string; count: number; }[];
  byGroup: { group: string; count: number; killed: number; }[];
  byMonth: { month: number; count: number; killed: number; }[];
  recentAttacks: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate hero text
    if (heroRef.current) {
      const children = heroRef.current.children;
      gsap.fromTo(
        children,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }

    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
      {/* Hero Section */}
      <div ref={heroRef} className="mb-12">
        <div className="flex items-center gap-3 mb-4" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: "rgba(139,26,26,0.1)",
              color: "var(--color-blood-light)",
              border: "1px solid rgba(139,26,26,0.2)",
            }}
          >
            <SignalIcon className="w-3.5 h-3.5" />
            Intelligence Dashboard
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("en-NG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4"
          style={{ fontFamily: "var(--font-heading)", opacity: 0 }}
        >
          Nigeria Attack
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--color-blood), var(--color-ember), var(--color-flame))",
            }}
          >
            Tracker {stats?.overview?.year || new Date().getFullYear()}
          </span>
        </h1>

        <p
          className="text-lg max-w-2xl leading-relaxed"
          style={{ color: "var(--text-secondary)", opacity: 0 }}
        >
          Real-time intelligence on terrorist and insurgent activities across Nigeria.
          Data sourced from verified news outlets, security reports, and field correspondents.
        </p>
      </div>

      {/* Time Since Last Attack */}
      {!loading && stats?.recentAttacks?.[0]?.date && (
        <TimeSinceLastAttack lastAttackDate={stats.recentAttacks[0].date} />
      )}

      {/* Stats Grid */}
      <section className="mb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total Incidents"
              value={stats.overview.totalAttacks}
              icon={<BoltIcon className="w-6 h-6" />}
              color="var(--color-blood)"
              delay={0}
            />
            <StatCard
              label="Lives Lost"
              value={stats.overview.totalKilled}
              icon={<UserMinusIcon className="w-6 h-6" />}
              color="var(--color-urgent)"
              delay={0.1}
            />
            <StatCard
              label="Injured"
              value={stats.overview.totalInjured}
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              color="var(--color-caution)"
              delay={0.2}
            />
            <StatCard
              label="Kidnapped"
              value={stats.overview.totalKidnapped}
              icon={<LockClosedIcon className="w-6 h-6" />}
              color="var(--color-verified)"
              delay={0.3}
            />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center bg-grain">
            <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-secondary)" }}>
              Unable to load statistics. Please check your database connection.
            </p>
          </div>
        )}
      </section>

      {/* Secondary Stats */}
      {stats && !loading && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <StatCard
            label="Attacks (Last 7 Days)"
            value={stats.overview.attacksLast7Days}
            icon={<ClockIcon className="w-6 h-6" />}
            color="var(--color-ember)"
            delay={0.4}
          />
          <StatCard
            label="Attacks (Last 30 Days)"
            value={stats.overview.attacksLast30Days}
            icon={<CalendarDaysIcon className="w-6 h-6" />}
            color="var(--color-sand)"
            delay={0.5}
          />
        </section>
      )}

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : stats ? (
          <>
            <BarChart
              title="Monthly Attack Frequency"
              data={stats.byMonth.map((m) => ({
                label: String(m.month),
                value: m.count,
                killed: m.killed,
              }))}
              color="#8B1A1A"
            />
            <HorizontalBar
              title="Most Affected States"
              data={stats.byState.map((s) => ({
                label: s.state,
                value: s.count,
              }))}
              color="var(--color-ember)"
            />
          </>
        ) : null}
      </section>

      {/* Groups Chart */}
      {stats && !loading && stats.byGroup.length > 0 && (
        <section className="mb-12">
          <HorizontalBar
            title="Armed Groups Activity"
            data={stats.byGroup.map((g) => ({
              label: g.group,
              value: g.count,
              killed: g.killed,
            }))}
            color="var(--color-blood)"
          />
        </section>
      )}

      {/* Recent Attacks */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Recent Incidents
          </h2>
          <Link
            href="/incidents"
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-blood-light"
            style={{ color: "var(--accent)" }}
          >
            View All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <AttackCardSkeleton key={i} />)}
          </div>
        ) : stats?.recentAttacks?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recentAttacks.map((attack, i) => (
              <AttackCard key={attack._id} attack={attack} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              No Incidents Recorded Yet
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              The tracker will begin populating once it starts
              fetching data from news sources.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
