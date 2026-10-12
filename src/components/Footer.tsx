import Link from "next/link";
import ScanStatus from "./ScanStatus";

export default function Footer() {
  return <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__notes">
        <p>Figures are as publicly reported and may change as sources are corrected.</p>
        <ScanStatus />
      </div>
      <nav aria-label="Footer"><Link href="/about">Method</Link><Link href="/incidents">Record</Link><Link href="/map">Map</Link></nav>
    </div>
  </footer>;
}
