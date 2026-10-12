import Link from "next/link";

const notes = [
  ["Counting", "How figures are counted", "Totals combine exact counts, estimates and range midpoints, and each record shows which it uses. Unknown and not-reported impacts stay distinct and are never shown as zero."],
  ["Evidence status", "What a status means", "Confirmed: two or more cited sources, or an official statement plus a cited publisher. Developing: details may still change. Unconfirmed: a single source, so use it with caution."],
  ["Limits", "What this is not", "This is not a census or a risk ranking. Coverage effort varies by state and by month, and the archive is corrected as new reporting arrives."],
];

export default function Footer() {
  return <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="method-band">{notes.map(([kicker, title, body]) => <section key={kicker} className="method-band__item"><span className="kicker">{kicker}</span><h2>{title}</h2><p>{body}</p></section>)}</div>
      <div className="site-footer__bar">
        <span className="site-footer__brand"><i aria-hidden="true" />NATracker<small>Public-interest record of reported incidents in Nigeria</small></span>
        <nav aria-label="Footer"><Link href="/about">Methodology</Link><Link href="/incidents">Incidents</Link><Link href="/map">State map</Link></nav>
      </div>
    </div>
  </footer>;
}
