import { db } from "@/db";
import { chapter, chapterPage, series } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { ReadingProgressTracker } from "@/components/reader/ReadingProgressTracker";

export const dynamic = "force-dynamic";

export default async function NovelReaderPage({ params }: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await params;
  const [novel] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (!novel || !novel.published || !["novel", "light-novel"].includes(novel.contentType)) notFound();

  const chapters = await db.select().from(chapter).where(eq(chapter.seriesId, novel.id)).orderBy(asc(chapter.createdAt));
  const currentIndex = chapters.findIndex((item)=>item.id===chapterId);
  if (currentIndex < 0) notFound();
  const current = chapters[currentIndex];
  const pages = await db.select().from(chapterPage).where(eq(chapterPage.chapterId,current.id)).orderBy(asc(chapterPage.pageNumber));
  const previous = chapters[currentIndex-1], next = chapters[currentIndex+1];
  const label = current.title || (current.chapterNumber ? `Chapter ${current.chapterNumber}` : "Untitled Chapter");

  return <main className="reader-page">
    <div className="reader-topbar"><Link href={`/novels/${novel.slug}`} className="reader-back"><ArrowLeft size={17}/><span>Back to details</span></Link><div className="reader-series-name">{novel.title}</div><span className="reader-chapter-count">{currentIndex+1} / {chapters.length}</span></div>
    <section className="reader-heading"><span className="home-kicker">NOW READING · {novel.contentType.toUpperCase()}</span><h1>{label}</h1><p>{novel.title}</p>{pages.length>0 && <ReadingProgressTracker sourceKey={novel.sourceKey} sourceSeriesId={novel.sourceSeriesId} sourceChapterId={current.sourceChapterId} seriesTitle={novel.title} chapterLabel={label} totalPages={pages.length}/>}</section>
    {pages.length ? <section className="reader-pages" aria-label="Chapter pages">{pages.map(page=><figure className="reader-page-image" key={page.id} data-reader-page={page.pageNumber}><img src={page.imageUrl} alt={`${novel.title}, ${label}, page ${page.pageNumber}`} loading={page.pageNumber<=2?"eager":"lazy"} decoding="async"/><figcaption>Page {page.pageNumber} of {pages.length}</figcaption></figure>)}</section> : <section className="reader-content"><div className="reader-placeholder"><BookOpen size={42}/><h2>Chapter content is not available yet</h2><p>This chapter is listed in ComicVerse, but no authorized reading content has been added.</p><span>No fabricated chapter text or restricted external content is displayed.</span></div></section>}
    <nav className="reader-navigation">{previous ? <Link href={`/novels/${novel.slug}/chapter/${previous.id}`} className="reader-nav-button"><ChevronLeft size={18}/> Previous chapter</Link> : <span className="reader-nav-disabled"><ChevronLeft size={18}/> Previous chapter</span>}{next ? <Link href={`/novels/${novel.slug}/chapter/${next.id}`} className="reader-nav-button">Next chapter <ChevronRight size={18}/></Link> : <span className="reader-nav-disabled">Next chapter <ChevronRight size={18}/></span>}</nav>
    <div className="reader-bottom-link"><Link href={`/novels/${novel.slug}`}>Return to {novel.title} <ArrowRight size={16}/></Link></div>
  </main>;
}
