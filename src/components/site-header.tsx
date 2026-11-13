import Link from "next/link";
import { PanelsTopLeft, Compass, BookOpen, Library, Search, UserRound } from "lucide-react";
import { ApiStatus } from "@/components/api-status";
import { AccountMenu } from "@/components/account-menu";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-30">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" aria-label="ComicVerse home">
          <span className="site-brand-icon"><PanelsTopLeft size={20} /></span>
          <span>Comic<span>Verse</span></span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/" className="site-nav-link"><Compass size={15} />Home</Link>
          <Link href="/novels" className="site-nav-link">Novels</Link>
          <Link href="/manga" className="site-nav-link">Manga</Link>
          <Link href="/browse" className="site-nav-link"><BookOpen size={15} />Browse</Link>
          <Link href="/library" className="site-nav-link"><Library size={15} />Bookmarks</Link>
          <Link href="/profile" className="site-nav-link"><UserRound size={15} />Profile</Link>
        </nav>
        <div className="site-header-actions">
          <div className="hidden sm:block"><ApiStatus /></div>
          <Link href="/browse" className="site-search-button" aria-label="Search catalogue"><Search size={18} /></Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
