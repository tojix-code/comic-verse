import Link from "next/link";
import { PanelsTopLeft } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link href="/" className="site-brand">
            <span className="site-brand-icon">
              <PanelsTopLeft size={19} />
            </span>
            <span>
              Comic<span>Verse</span>
            </span>
          </Link>

          <p className="footer-description">
            Stories worth staying up for.
          </p>
        </div>

        <div className="footer-links">
          <Link href="/browse">Browse</Link>
          <Link href="/library">My Library</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>

        <span className="footer-version">COMICVERSE · 0.3.0</span>
      </div>
    </footer>
  );
}