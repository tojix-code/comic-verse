import { db } from "@/db";
import { chapter, series } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Layers, User } from "lucide-react";
import { LibraryButton } from "@/components/home/LibraryButton";
import { ChapterList } from "@/components/details/ChapterList";

export const dynamic = "force-dynamic";

export default async function NovelDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [novel] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  if (!novel || !novel.published || !["novel", "light-novel"].includes(novel.contentType)) notFound();

  const chapters = await db.select().from(chapter).where(eq(chapter.seriesId, novel.id)).orderBy(desc(chapter.createdAt));
  const firstChapter = chapters[chapters.length - 1];

  return <main id="main-content" className="details-page">
    <section className="details-hero">
      <div className="details-cover">{novel.coverUrl ? <img src={novel.coverUrl} alt={novel.title}/> : <div className="comic-cover-placeholder"><BookOpen size={45}/><span>ComicVerse</span></div>}</div>
      <div className="details-information">
        <span className="home-kicker">{novel.contentType.replace("-", " ")}</span>
        <h1>{novel.title}</h1>
        <div className="details-metadata">
          {novel.creator && <span><User size={15}/> {novel.creator}</span>}
          {novel.releaseYear && <span><Calendar size={15}/> {novel.releaseYear}</span>}
          <span><Layers size={15}/> {chapters.length} Chapters</span>
        </div>
        <div className="details-badges">{novel.publicationStatus && <span>{novel.publicationStatus}</span>}{novel.contentRating && <span>{novel.contentRating}</span>}</div>
        <h2>Synopsis</h2><p className="details-synopsis">{novel.synopsis || "No synopsis available yet."}</p>
        <div className="details-actions">
          <LibraryButton sourceKey={novel.sourceKey} sourceSeriesId={novel.sourceSeriesId} title={novel.title} coverUrl={novel.coverUrl} contentType={novel.contentType}/>
          {firstChapter && <Link href={`/novels/${novel.slug}/chapter/${firstChapter.id}`} className="details-read-button">Start Reading <ArrowRight size={17}/></Link>}
        </div>
      </div>
    </section>
    <section className="details-chapters">
      <div className="details-chapter-heading"><div><span className="home-kicker">CONTINUE YOUR JOURNEY</span><h2>Chapters</h2></div><span>{chapters.length} chapters</span></div>
      {chapters.length === 0 ? <div className="home-empty"><BookOpen size={25}/><h3>No chapters available</h3><p>Chapters will appear here when they are added.</p></div> :
        <ChapterList chapters={chapters.map((item) => ({ id: item.id, title: item.title, chapterNumber: item.chapterNumber, publishedAt: item.publishedAt?.toISOString() ?? null }))} hrefBase={`/novels/${novel.slug}/chapter`} />}
    </section>
  </main>;
}
