import { Flame } from "lucide-react";
import { ComicCard } from "./ComicCard";

type TrendingItem = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  synopsis: string | null;
  contentType: string;
  bookmarkCount: number;
};

export function TrendingComics({
  items,
}: {
  items: TrendingItem[];
}) {
  return (
    <section className="home-section">
      <div className="home-section-heading">
        <div>
          <span className="home-kicker">
            <Flame size={13} /> READER FAVOURITES
          </span>
          <h2>Trending Comics</h2>
        </div>
        <span className="home-section-label">Most bookmarked</span>
      </div>

      {items.length === 0 ? (
        <div className="home-empty">
          <Flame size={25} />
          <h3>No trending titles yet</h3>
          <p>Trending titles will appear as readers build their libraries.</p>
        </div>
      ) : (
        <div className="comic-grid">
          {items.map((item) => (
            <div key={item.id}>
              <ComicCard
                title={item.title}
                slug={item.slug}
                coverUrl={item.coverUrl}
                contentType={item.contentType}
                synopsis={item.synopsis}
              />
              <p className="trending-count">
                {item.bookmarkCount} {item.bookmarkCount === 1 ? "bookmark" : "bookmarks"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}