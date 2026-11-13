import { db } from "@/db";
import { chapter, series } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  User,
  Layers,
  ArrowRight,
} from "lucide-react";
import { LibraryButton } from "@/components/home/LibraryButton";
import { ChapterList } from "@/components/details/ChapterList";

export const dynamic = "force-dynamic";

type ComicDetailsProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ComicDetailsPage({
  params,
}: ComicDetailsProps) {
  const { slug } = await params;

  const [comic] = await db
    .select()
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1);

  if (!comic || !comic.published) {
    notFound();
  }

  const chapters = await db
    .select()
    .from(chapter)
    .where(eq(chapter.seriesId, comic.id))
    .orderBy(desc(chapter.createdAt));

  const firstChapter = chapters[chapters.length - 1];

  return (
    <main className="details-page">
      <section className="details-hero">
        <div className="details-cover">
          {comic.coverUrl ? (
            <img src={comic.coverUrl} alt={comic.title} />
          ) : (
            <div className="comic-cover-placeholder">
              <BookOpen size={45} />
              <span>ComicVerse</span>
            </div>
          )}
        </div>

        <div className="details-information">
          <span className="home-kicker">
            {comic.contentType.replace("-", " ")}
          </span>

          <h1>{comic.title}</h1>

          <div className="details-metadata">
            {comic.creator && (
              <span>
                <User size={15} /> {comic.creator}
              </span>
            )}

            {comic.releaseYear && (
              <span>
                <Calendar size={15} /> {comic.releaseYear}
              </span>
            )}

            <span>
              <Layers size={15} /> {chapters.length} Chapters
            </span>
          </div>

          <div className="details-badges">
            {comic.publicationStatus && (
              <span>{comic.publicationStatus}</span>
            )}

            {comic.contentRating && (
              <span>{comic.contentRating}</span>
            )}
          </div>

          <h2>Synopsis</h2>

          <p className="details-synopsis">
            {comic.synopsis || "No synopsis available yet."}
          </p>

          <div className="details-actions">
            <LibraryButton
              sourceKey={comic.sourceKey}
              sourceSeriesId={comic.sourceSeriesId}
              title={comic.title}
              coverUrl={comic.coverUrl}
              contentType={comic.contentType}
            />

            {firstChapter && (
              <Link
                href={`/comics/${comic.slug}/chapter/${firstChapter.id}`}
                className="details-read-button"
              >
                Start Reading <ArrowRight size={17} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="details-chapters">
        <div className="details-chapter-heading">
          <div><span className="home-kicker">CONTINUE YOUR JOURNEY</span><h2>Chapters</h2></div>
          <span>{chapters.length} chapters</span>
        </div>
        {chapters.length === 0 ? (
          <div className="home-empty"><BookOpen size={25}/><h3>No chapters available</h3><p>Chapters will appear here when they are added.</p></div>
        ) : (
          <ChapterList chapters={chapters.map((item) => ({ id: item.id, title: item.title, chapterNumber: item.chapterNumber, publishedAt: item.publishedAt?.toISOString() ?? null }))} hrefBase={`/comics/${comic.slug}/chapter`} />
        )}
      </section>
    </main>
  );
}
