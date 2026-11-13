"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight, CalendarDays, Search } from "lucide-react";

type ChapterItem = {
  id: string;
  title: string | null;
  chapterNumber: string | null;
  publishedAt: string | null;
};

export function ChapterList({ chapters, hrefBase }: { chapters: ChapterItem[]; hrefBase: string }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    const matching = chapters.filter((item) => {
      const label = item.title || (item.chapterNumber ? "Chapter " + item.chapterNumber : "Untitled Chapter");
      return label.toLowerCase().includes(value);
    });
    return [...matching].sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      const aNum = Number(a.chapterNumber ?? 0);
      const bNum = Number(b.chapterNumber ?? 0);
      const comparison = aDate && bDate && aDate !== bDate ? aDate - bDate : aNum - bNum;
      return order === "newest" ? -comparison : comparison;
    });
  }, [chapters, query, order]);

  return (
    <div className="chapter-list-tools">
      <div className="chapter-list-toolbar">
        <label className="chapter-list-search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a chapter..." aria-label="Search chapters"/></label>
        <button type="button" className="chapter-sort-button" onClick={() => setOrder((value) => value === "newest" ? "oldest" : "newest")}><ArrowDownUp size={15}/>{order === "newest" ? "Newest first" : "Oldest first"}</button>
      </div>
      <div className="chapter-list-summary"><span>{filtered.length} of {chapters.length} chapters</span>{query && <button type="button" onClick={() => setQuery("")}>Clear search</button>}</div>
      {filtered.length ? <div className="details-chapter-list">{filtered.map((item) => {
        const label = item.title || (item.chapterNumber ? "Chapter " + item.chapterNumber : "Untitled Chapter");
        return <Link key={item.id} href={hrefBase + "/" + item.id} className="details-chapter-item">
          <div><h3>{label}</h3>{item.publishedAt && <p><CalendarDays size={13}/>{new Date(item.publishedAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>}</div><ArrowRight size={18}/>
        </Link>;
      })}</div> : <div className="chapter-list-empty">No chapters match “{query}”.</div>}
    </div>
  );
}
