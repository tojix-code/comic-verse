import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

type LatestUpdate = {
  chapterId: string;
  chapterNumber: string | null;
  chapterTitle: string | null;
  publishedAt: Date | null;
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  coverUrl: string | null;
  contentType: string;
};

export function LatestUpdates({
  updates,
}: {
  updates: LatestUpdate[];
}) {
  return (
    <section className="home-section">
      <div className="home-section-heading">
        <div>
          <span className="home-kicker">FRESH FROM THE LIBRARY</span>
          <h2>Latest Chapter Updates</h2>
        </div>

        <span className="home-section-label">
          {updates.length} updates
        </span>
      </div>

      {updates.length === 0 ? (
        <div className="home-empty">
          <BookOpen size={25} />
          <h3>No chapter updates yet</h3>
          <p>New chapters will appear here when they are added to the catalogue.</p>
        </div>
      ) : (
        <div className="updates-list">
          {updates.map((item) => (
            <Link
              href={`/comics/${item.seriesSlug}/chapter/${item.chapterId}`}
              className="update-item"
              key={item.chapterId}
            >
              <div className="update-cover">
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt={item.seriesTitle} loading="lazy" />
                ) : (
                  <BookOpen size={22} />
                )}
              </div>

              <div className="update-details">
                <h3>{item.seriesTitle}</h3>
                <p>
                  {item.chapterTitle ||
                    (item.chapterNumber !== null
                      ? `Chapter ${item.chapterNumber}`
                      : "New chapter")}
                </p>
              </div>

              <ArrowRight size={17} className="update-arrow" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}