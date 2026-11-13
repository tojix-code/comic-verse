import { and, desc, eq, ilike } from "drizzle-orm";
import { Search, Compass } from "lucide-react";
import { db } from "@/db";
import { series } from "@/db/schema";
import { ComicCard } from "@/components/home/ComicCard";

export const dynamic = "force-dynamic";

const contentTypes = [
  { label: "All", value: "all" },
  { label: "Manga", value: "manga" },
  { label: "Manhwa", value: "manhwa" },
  { label: "Manhua", value: "manhua" },
  { label: "Light Novel", value: "light-novel" },
  { label: "Novel", value: "novel" },
];

type BrowsePageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

export default async function BrowsePage({
  searchParams,
}: BrowsePageProps) {
  const params = await searchParams;

  const query = params.q?.trim() ?? "";
  const selectedType = contentTypes.some(
    (item) => item.value === params.type
  )
    ? params.type!
    : "all";

  const conditions = [eq(series.published, true)];

  if (query) {
    conditions.push(ilike(series.title, `%${query}%`));
  }

  if (selectedType !== "all") {
    conditions.push(eq(series.contentType, selectedType));
  }

  const results = await db
    .select()
    .from(series)
    .where(and(...conditions))
    .orderBy(desc(series.createdAt))
    .limit(60)
    .catch((error) => {
      console.error("[browse-catalogue] Database unavailable:", error);
      return [];
    });

  return (
    <main className="browse-page">
      <section className="browse-hero">
        <span className="home-kicker">
          <Compass size={14} /> EXPLORE THE CATALOGUE
        </span>

        <h1>Discover your next <span>story.</span></h1>

        <p>
          Explore manga, manhwa, manhua and novels in the ComicVerse library.
        </p>

        <form action="/browse" className="browse-search">
          <Search size={19} />

          <input
            type="search"
            name="q"
            placeholder="Search for a title..."
            defaultValue={query}
          />

          <input type="hidden" name="type" value={selectedType} />

          <button type="submit">Search</button>
        </form>
      </section>

      <section className="browse-results">
        <div className="browse-heading">
          <div>
            <span className="home-kicker">YOUR NEXT READ</span>
            <h2>{query ? `Results for "${query}"` : "Browse all stories"}</h2>
          </div>

          <span className="home-section-label">
            {results.length} titles
          </span>
        </div>

        <div className="browse-filters">
          {contentTypes.map((item) => (
            <a
              key={item.value}
              href={`/browse?${new URLSearchParams({
                ...(query ? { q: query } : {}),
                type: item.value,
              }).toString()}`}
              className={
                selectedType === item.value ? "browse-filter active" : "browse-filter"
              }
            >
              {item.label}
            </a>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="home-empty">
            <Search size={26} />
            <h3>No stories found</h3>
            <p>
              {query
                ? "Try another title or change your content filter."
                : "Published stories will appear here when added to the catalogue."}
            </p>
          </div>
        ) : (
          <div className="comic-grid">
            {results.map((item) => (
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
    </main>
  );
}
