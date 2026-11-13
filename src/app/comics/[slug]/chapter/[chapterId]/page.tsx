import { db } from "@/db";
import { chapter, chapterPage, series } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ReadingProgressTracker } from "@/components/reader/ReadingProgressTracker";

export const dynamic = "force-dynamic";

type ReaderPageProps = {
  params: Promise<{
    slug: string;
    chapterId: string;
  }>;
};

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { slug, chapterId } = await params;

  const [comic] = await db
    .select()
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1);

  if (!comic || !comic.published) notFound();

  const chapters = await db
    .select()
    .from(chapter)
    .where(eq(chapter.seriesId, comic.id))
    .orderBy(asc(chapter.createdAt));

  const currentIndex = chapters.findIndex((item) => item.id === chapterId);
  if (currentIndex === -1) notFound();

  const currentChapter = chapters[currentIndex];
  const previousChapter = chapters[currentIndex - 1];
  const nextChapter = chapters[currentIndex + 1];
  const pages = await db
    .select()
    .from(chapterPage)
    .where(eq(chapterPage.chapterId, currentChapter.id))
    .orderBy(asc(chapterPage.pageNumber));

  const chapterTitle =
    currentChapter.title ||
    (currentChapter.chapterNumber
      ? `Chapter ${currentChapter.chapterNumber}`
      : "Untitled Chapter");

  return (
    <main className="reader-page">
      <div className="reader-topbar">
        <Link href={`/comics/${comic.slug}`} className="reader-back">
          <ArrowLeft size={17} />
          <span>Back to details</span>
        </Link>
        <div className="reader-series-name">{comic.title}</div>
        <span className="reader-chapter-count">
          {currentIndex + 1} / {chapters.length}
        </span>
      </div>

      <section className="reader-heading">
        <span className="home-kicker">NOW READING</span>
        <h1>{chapterTitle}</h1>
        <p>{comic.title}</p>
        {pages.length > 0 && (
          <ReadingProgressTracker
            sourceKey={comic.sourceKey}
            sourceSeriesId={comic.sourceSeriesId}
            sourceChapterId={currentChapter.sourceChapterId}
            seriesTitle={comic.title}
            chapterLabel={chapterTitle}
            totalPages={pages.length}
          />
        )}
      </section>

      {pages.length > 0 ? (
        <section className="reader-pages" aria-label="Chapter pages">
          {pages.map((page) => (
            <figure className="reader-page-image" key={page.id}>
              {/* External page images are supplied by the approved catalogue entry. */}
              <img
                src={page.imageUrl}
                alt={`${comic.title}, ${chapterTitle}, page ${page.pageNumber}`}
                loading={page.pageNumber <= 2 ? "eager" : "lazy"}
                decoding="async"
              />
              <figcaption>Page {page.pageNumber} of {pages.length}</figcaption>
            </figure>
          ))}
        </section>
      ) : (
        <section className="reader-content">
          <div className="reader-placeholder">
            <BookOpen size={42} />
            <h2>Chapter content is not available yet</h2>
            <p>
              This chapter is registered in the ComicVerse catalogue,
              but no authorized reading pages have been added.
            </p>
            <span>No fabricated pages or restricted external content are displayed.</span>
          </div>
        </section>
      )}

      <nav className="reader-navigation">
        {previousChapter ? (
          <Link
            href={`/comics/${comic.slug}/chapter/${previousChapter.id}`}
            className="reader-nav-button"
          >
            <ChevronLeft size={18} /> Previous chapter
          </Link>
        ) : (
          <span className="reader-nav-disabled">
            <ChevronLeft size={18} /> Previous chapter
          </span>
        )}
        {nextChapter ? (
          <Link
            href={`/comics/${comic.slug}/chapter/${nextChapter.id}`}
            className="reader-nav-button"
          >
            Next chapter <ChevronRight size={18} />
          </Link>
        ) : (
          <span className="reader-nav-disabled">
            Next chapter <ChevronRight size={18} />
          </span>
        )}
      </nav>

      <div className="reader-bottom-link">
        <Link href={`/comics/${comic.slug}`}>
          Return to {comic.title} <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
