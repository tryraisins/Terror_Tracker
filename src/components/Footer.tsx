import Link from "next/link";
import ScanStatus from "./ScanStatus";

export default function Footer() {
  return <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__notes">
        <p>NATracker is an independent record built from published reports. Figures are as publicly reported and may change as sources are corrected.</p>
        <ScanStatus />
      </div>
      <nav aria-label="Footer"><Link href="/incidents">Records</Link><Link href="/map">Map</Link><Link href="/about">Method</Link></nav>
    </div>
  </footer>;
}
