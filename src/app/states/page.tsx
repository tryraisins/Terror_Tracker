"use client";

import Link from "next/link";
import { useState } from "react";
import { Locator } from "@/components/icons";
import { PageError, PageSkeleton } from "@/components/PageState";
import { Controls } from "@/components/Viz";
import { NIGERIA_STATES } from "@/lib/filter-options";
import { MEASURES, PERIODS, fmt, inPeriod, stateSlug, total, type Measure, type Period } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

export default function StatesPage() {
  const { data, failed, offline, retry } = useSummary();
  const [measure, setMeasure] = useState<Measure>("attacks");
  const [period, setPeriod] = useState<Period>("year");
  if (!data && failed) return <PageError title="States" offline={offline} retry={retry} />;
  if (!data) return <PageSkeleton title="States" />;

  const current = data.records.filter(inPeriod(period, data.today));
  const states = NIGERIA_STATES.map(({ value }) => { const rows = current.filter((row) => row.s === value); return { name: value, rows, value: total(rows, measure) }; })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  return <div data-measure={measure}>
    <div className="page-head">
      <div><h1>States</h1><p>All 36 states and the FCT, ordered by {MEASURES[measure].noun} {PERIODS[period].phrase}. Open a state for its own charts, worst-hit areas and every incident.</p></div>
      <Controls measure={measure} onMeasure={setMeasure} period={period} onPeriod={setPeriod} year={data.year} />
    </div>
    <div className="state-grid">{states.map(({ name, rows }) => <Link key={name} className="card state-card" href={`/states/${stateSlug(name)}`}>
      <Locator state={name} />
      <span><b>{name}</b><span className="dim" style={{ fontSize: 13 }}>{fmt(rows.length)} {rows.length === 1 ? "attack" : "attacks"}</span>
        <span className="inc-figs"><span className="pill pill--k">{fmt(total(rows, "killed"))} killed</span><span className="pill pill--a">{fmt(total(rows, "abducted"))} abducted</span></span></span>
    </Link>)}</div>
  </div>;
}
