"use client";

import { useMemo, useState } from "react";
import { PageError, PageSkeleton } from "@/components/PageState";
import { BarList, Controls, Heatmap, Legend, RowItem } from "@/components/Viz";
import { MEASURES, PERIODS, byKey, inPeriod, total, type Measure, type Period } from "@/lib/summary";
import { useSummary } from "@/lib/use-summary";

// Generic descriptors, not named groups: used only for the attribution note.
const UNNAMED = /unknown|unidentified|gunmen|bandit|armed (men|group)|assailant|attacker/i;

export default function PatternsPage() {
  const { data, failed, offline, retry } = useSummary();
  const [measure, setMeasure] = useState<Measure>("attacks");
  const [period, setPeriod] = useState<Period>("year");
  const current = useMemo(() => data ? data.records.filter(inPeriod(period, data.today)) : [], [data, period]);

  if (!data && failed) return <PageError title="Patterns" offline={offline} retry={retry} />;
  if (!data) return <PageSkeleton title="Patterns" />;

  const M = MEASURES[measure];
  const phrase = PERIODS[period].phrase;
  const groups = byKey(current, measure, (row) => row.g || "Unknown");
  const unnamed = current.filter((row) => UNNAMED.test(row.g)).length;
  const deadliest = [...current].filter((row) => (row.k ?? 0) > 0).sort((a, b) => (b.k ?? 0) - (a.k ?? 0)).slice(0, 6);

  return <div data-measure={measure}>
    <div className="page-head">
      <div><h1>Patterns</h1><p>Where and when attacks cluster, who reports attribute them to, and the deadliest attacks of the year.</p></div>
      <Controls measure={measure} onMeasure={setMeasure} period={period} onPeriod={setPeriod} year={data.year} />
    </div>

    <section className="card" aria-labelledby="heat-title">
      <div className="card-head"><div><h2 id="heat-title">When each state was hit hardest</h2><p>{M.label} per month in the 12 most affected states, January to {new Date(`${data.today}T12:00:00Z`).getUTCDate()} {new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${data.today}T12:00:00Z`))}. This grid always shows the whole year; select a state to open its page.</p></div><Legend measure={measure} /></div>
      <Heatmap rows={data.records} measure={measure} today={data.today} />
    </section>

    <div className="panels">
      <section className="card span-6" aria-labelledby="who-title">
        <div className="card-head"><div><h2 id="who-title">Attributed perpetrators</h2><p>{M.label} by the group reports attribute them to, {phrase}.</p></div></div>
        <BarList entries={groups.slice(0, 8)} measure={measure} wide />
        <div className="card-foot"><span>{current.length ? `${Math.round((unnamed / current.length) * 100)}% of attacks ${phrase} are attributed only to unidentified gunmen or bandits. ` : ""}Names are kept as each report spells them.</span></div>
      </section>
      <section className="card span-6" aria-labelledby="dead-title">
        <div className="card-head"><div><h2 id="dead-title">The deadliest attacks</h2><p>Ranked by reported death toll, {phrase}.</p></div></div>
        {deadliest.length ? <ul className="rows">{deadliest.map((row) => <RowItem key={row.id} row={row} />)}</ul> : <p className="dim" style={{ margin: 0 }}>No deaths reported {phrase}.</p>}
        <div className="card-foot"><span>{total(current, "killed").toLocaleString("en-NG")} people killed in {current.length.toLocaleString("en-NG")} attacks {phrase}.</span></div>
      </section>
    </div>
  </div>;
}
