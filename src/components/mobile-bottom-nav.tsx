"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Compass, Bookmark } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/novels", label: "Novels", Icon: BookOpen },
  { href: "/manga", label: "Manga", Icon: BookOpen },
  { href: "/browse", label: "Browse", Icon: Compass },
  { href: "/library", label: "Bookmarks", Icon: Bookmark },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={active ? "mobile-bottom-link active" : "mobile-bottom-link"}>
            <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
