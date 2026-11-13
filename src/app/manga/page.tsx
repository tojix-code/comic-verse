import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { Search, BookOpen } from "lucide-react";
import { db } from "@/db";
import { series } from "@/db/schema";
import { ComicCard } from "@/components/home/ComicCard";

export const dynamic = "force-dynamic";

type MangaPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

const mangaTypes = ["manga", "manhwa", "manhua"];

export default async function MangaPage({
  searchParams,
}: MangaPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const selectedType = mangaTypes.includes(params.type ?? "")
    ? params.type!
    : "all";

  const conditions = [
    eq(series.published, true),
    inArray(
      series.contentType,
      selectedType === "all" ? mangaTypes : [selectedType]
    ),
  ];

  if (query) {
    conditions.push(ilike(series.title, `%${query}%`));
  }

  const results = await db
    .select()
    .from(series)
    .where(and(...conditions))
    .orderBy(desc(series.createdAt))
    .limit(60)
    .catch((error) => {
      console.error("[manga-catalogue] Database unavailable:", error);
      return [];
    });

  const filters = [
    { label: "All", value: "all" },
    { label: "Manga", value: "manga" },
    { label: "Manhwa", value: "manhwa" },
    { label: "Manhua", value: "manhua" },
  ];

  return (
    <main className="browse-page">
      <section className="browse-hero">
        <span className="home-kicker">
          <BookOpen size={14} /> THE MANGA COLLECTION
        </span>

        <h1>Explore the world of <span>Manga.</span></h1>

        <p>
          Discover manga, manhwa and manhua from the ComicVerse catalogue.
        </p>

        <form action="/manga" className="browse-search">
          <Search size={19} />
          <input
            type="search"
            name="q"
            placeholder="Search manga titles..."
            defaultValue={query}
          />
          <input type="hidden" name="type" value={selectedType} />
          <button type="submit">Search</button>
        </form>
      </section>

      <section className="browse-results">
        <div className="browse-heading">
          <div>
            <span className="home-kicker">FIND YOUR NEXT READ</span>
            <h2>
              {selectedType === "all"
                ? "All Manga"
                : selectedType.charAt(0).toUpperCase() +
                  selectedType.slice(1)}
            </h2>
          </div>

          <span className="home-section-label">
            {results.length} titles
          </span>
        </div>

        <div className="browse-filters">
          {filters.map((filter) => (
            <a
              key={filter.value}
              href={`/manga?${new URLSearchParams({
                ...(query ? { q: query } : {}),
                type: filter.value,
              }).toString()}`}
              className={
                selectedType === filter.value
                  ? "browse-filter active"
                  : "browse-filter"
              }
            >
              {filter.label}
            </a>
          ))}
        </div>

        {results.length === 0 ? (
          <div className="home-empty">
            <BookOpen size={26} />
            <h3>No manga found</h3>
            <p>
              Published manga will appear here when added to the catalogue.
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
