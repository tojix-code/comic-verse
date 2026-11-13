import Link from "next/link";
import {
  PanelsTopLeft,
  Compass,
  BookOpen,
  Library,
  Search,
} from "lucide-react";
import { ApiStatus } from "@/components/api-status";
import { AccountMenu } from "@/components/account-menu";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-icon">
            <PanelsTopLeft size={21} />
          </span>
          <span>
            Comic<span>Verse</span>
          </span>
        </Link>

        <nav className="site-nav">
          <Link href="/" className="site-nav-link">
            <Compass size={16} /> Home
          </Link>
          <Link href="/browse" className="site-nav-link">
            <BookOpen size={16} /> Browse
          </Link>
          <Link href="/manga" className="site-nav-link">
            Manga
          </Link>
          <Link href="/novels" className="site-nav-link">
            Novels
          </Link>
          <Link href="/library" className="site-nav-link">
            <Library size={16} /> My Library
          </Link>
        </nav>

        <div className="site-header-actions">
          <ApiStatus />
          <Link href="/browse" className="site-search-button" aria-label="Search">
            <Search size={19} />
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}