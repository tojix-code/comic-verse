import { and, desc, eq, ilike, inArray } from "drizzle-orm";
import { Search, BookOpen } from "lucide-react";
import { db } from "@/db";
import { series } from "@/db/schema";
import { ComicCard } from "@/components/home/ComicCard";

export const dynamic = "force-dynamic";

type NovelsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
};

const novelTypes = ["light-novel", "novel"];

export default async function NovelsPage({
  searchParams,
}: NovelsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const selectedType = novelTypes.includes(params.type ?? "")
    ? params.type!
    : "all";

  const conditions = [
    eq(series.published, true),
    inArray(
      series.contentType,
      selectedType === "all" ? novelTypes : [selectedType]
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
      console.error("[novel-catalogue] Database unavailable:", error);
      return [];
    });

  const filters = [
    { label: "All Novels", value: "all" },
    { label: "Light Novels", value: "light-novel" },
    { label: "Novels", value: "novel" },
  ];

  return (
    <main id="main-content" className="browse-page">
      <section className="browse-hero">
        <span className="home-kicker">
          <BookOpen size={14} /> THE WRITTEN COLLECTION
        </span>

        <h1>Stories beyond <span>panels.</span></h1>

        <p>
          Explore light novels and written stories in the ComicVerse
          catalogue.
        </p>

        <form action="/novels" className="browse-search">
          <Search size={19} />

          <input
            type="search"
            name="q"
            placeholder="Search novel titles..."
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
                ? "All Novels"
                : selectedType === "light-novel"
                  ? "Light Novels"
                  : "Novels"}
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
              href={`/novels?${new URLSearchParams({
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
            <h3>No novels found</h3>
            <p>
              Published novels will appear here when added to the
              ComicVerse catalogue.
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
