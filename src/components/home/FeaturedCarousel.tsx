"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

type FeaturedItem = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  synopsis: string | null;
  contentType: string;
};

export function FeaturedCarousel({
  items,
}: {
  items: FeaturedItem[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const active = items[activeIndex];

  const previous = () => {
    setActiveIndex((current) =>
      (current - 1 + items.length) % items.length
    );
  };

  const next = () => {
    setActiveIndex((current) => (current + 1) % items.length);
  };

  return (
    <section className="featured-section">
      <div className="featured-heading">
        <div>
          <span className="home-kicker">YOUR NEXT OBSESSION</span>
          <h2>Featured Stories</h2>
        </div>

        <div className="carousel-controls">
          <button onClick={previous} aria-label="Previous story">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} aria-label="Next story">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="featured-carousel">
        <div className="featured-backdrop">
          {active.coverUrl && (
            <img src={active.coverUrl} alt="" aria-hidden="true" />
          )}
        </div>

        <div className="featured-content">
          <div className="featured-cover">
            {active.coverUrl ? (
              <img src={active.coverUrl} alt={active.title} />
            ) : (
              <div className="comic-cover-placeholder">
                <BookOpen size={36} />
              </div>
            )}
          </div>

          <div className="featured-info">
            <span className="featured-type">{active.contentType}</span>
            <h3>{active.title}</h3>
            <p>
              {active.synopsis ||
                "Discover this story and add it to your personal library."}
            </p>

            <Link
              href={`/comics/${active.slug}`}
              className="featured-button"
            >
              Explore story <ChevronRight size={17} />
            </Link>

            <div className="carousel-indicators">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={index === activeIndex ? "active" : ""}
                  aria-label={`Show ${item.title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}