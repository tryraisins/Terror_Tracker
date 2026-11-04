const steps = [["Discover", "Read configured RSS feeds and source pages."], ["Read", "Extract available article text and source metadata."], ["Qualify", "Require a date and a state. Use the exact town or LGA when known, or state the wider area or state-level precision when not."], ["Reconcile", "Compare incident fingerprints to reduce duplication."], ["Publish", "Show reporting status, location precision, casualty precision and source evidence with each record."]];
const evidence = [["confirmed", "Confirmed", "Two or more cited sources, or an official statement plus a cited publisher."], ["developing", "Developing", "Credible reporting exists, but important details or outcomes may still change."], ["unconfirmed", "Unconfirmed", "A single source or incomplete corroboration. Use with additional caution."]];
const fields = [["Incident", "Title, factual summary and incident date."], ["Location", "State, LGA, town, surrounding area or state-level precision when available."], ["Attribution", "The group named in reporting, or unknown. Never inferred for certainty."], ["Human impact", "Killed, injured, abducted and displaced. Values are labelled as exact, estimated, reported ranges, unknown, or not reported."], ["Evidence", "Publisher, source title, URL and review state."], ["Record history", "Created and updated timestamps when returned by the database."]];
const limits = [["Coverage is incomplete", "Source availability, redirects, rate limits and missing local reporting create gaps."], ["Dates and places can conflict", "Publication date is never treated as the incident date without supporting information."], ["Numbers can be exact or approximate", "Figures may change. Ranges and estimates are displayed as such; unknown is reserved for reports that identify an impact without a reliable figure."], ["Post-April counts are not a trend", "Lower stored counts after April can reflect earlier strict date, location and casualty rules rather than fewer incidents."], ["Automation has limits", "Source discovery can miss events or confuse related stories. Publication is not a reliability percentage."]];

function Terms({ items }: { items: string[][] }) {
  return <dl className="terms">{items.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>;
}

export default function AboutPage() {
  return <div>
    <div className="page-head"><div><h1>Method</h1><p>A record, not a prediction. NATracker organises published reporting about attacks in Nigeria for research and awareness. It is not built for real-time safety decisions, and publication does not prove completeness or accuracy. Open the cited sources before relying on a record.</p></div></div>
    <div className="method-grid">
      <section id="process" className="card"><div className="card-head"><div><h2>How a report becomes a record</h2></div></div>
        <ol className="steps">{steps.map(([title, description], index) => <li key={title}><span className="n">{index + 1}</span><div><b>{title}</b><p>{description}</p></div></li>)}</ol></section>
      <section id="status" className="card"><div className="card-head"><div><h2>Reporting status</h2></div></div><Terms items={evidence.map(([, title, description]) => [title, description])} /></section>
      <section id="fields" className="card"><div className="card-head"><div><h2>What a record contains</h2></div></div><Terms items={fields} /></section>
      <section id="limits" className="card"><div className="card-head"><div><h2>Known limits</h2></div></div><Terms items={limits} /></section>
    </div>
    <section id="corrections" className="card" style={{ marginTop: 16 }}><div className="card-head" style={{ marginBottom: 8 }}><div><h2>Corrections</h2></div></div>
      <p className="muted" style={{ margin: 0, maxWidth: "70ch" }}>Every record keeps its supplied sources and timestamps. When a source is corrected or a report changes, figures are reviewed against the cited source before the record is updated.</p></section>
  </div>;
}
