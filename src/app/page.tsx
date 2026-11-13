import { getHomepageData } from "@/lib/homepage";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { LatestUpdates } from "@/components/home/LatestUpdates";
import { ComicCard } from "@/components/home/ComicCard";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { TrendingComics } from "@/components/home/TrendingComics";
import { SearchPanel } from "@/components/search-panel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { featured, latestUpdates, recentlyAdded , trending, databaseAvailable} =
    await getHomepageData();

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="home-ambient home-ambient-one" />
      <div className="home-ambient home-ambient-two" />

      <div className="home-container">
        <section className="home-welcome">
          <div>
            <span className="home-kicker">
              <Sparkles size={13} /> THE WORLD OF STORIES
            </span>
            <h1>
              Your next adventure
              <br />
              <span>starts here.</span>
            </h1>
            <p>
              Discover manga, manhwa and webtoons. Find your favourites,
              follow their journeys and keep every story close.
            </p>
            <Link href="#discover" className="home-primary-button">
              Find your next read <ArrowRight size={17} />
            </Link>
          </div>
        </section>

        {!databaseAvailable && <div className="catalogue-notice" role="status">Your personal catalogue database is offline right now. Live MangaDex search is still available below.</div>}

        <section className="home-section home-discover" id="discover">
          <div className="home-section-heading">
            <div>
              <span className="home-kicker"><Sparkles size={13} /> LIVE CATALOGUE</span>
              <h2>Search stories</h2>
            </div>
            <span className="home-section-label">MangaDex catalogue</span>
          </div>
          <SearchPanel />
        </section>

        {featured.length > 0 && (
          <div id="featured">
            <FeaturedCarousel items={featured} />
          </div>
        )}

        <LatestUpdates updates={latestUpdates} />
        <TrendingComics items={trending} />

        <section className="home-section">
          <div className="home-section-heading">
            <div>
              <span className="home-kicker">
                <Flame size={13} /> DISCOVER SOMETHING NEW
              </span>
              <h2>Recently Added</h2>
            </div>
            <span className="home-section-label">
              {recentlyAdded.length} titles
            </span>
          </div>

          {recentlyAdded.length === 0 ? (
            <div className="home-empty">
              <Sparkles size={25} />
              <h3>Your next favourite is on its way</h3>
              <p>
                Newly approved stories will appear here when added to
                the ComicVerse catalogue.
              </p>
            </div>
          ) : (
            <div className="comic-grid">
              {recentlyAdded.map((item) => (
                <ComicCard
                  key={item.id}
                  title={item.title}
                  slug={item.slug}
                  coverUrl={item.coverUrl}
                  contentType={item.contentType}
                  synopsis={item.synopsis}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
