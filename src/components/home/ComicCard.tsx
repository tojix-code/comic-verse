import Link from "next/link";
import { BookOpen } from "lucide-react";

type ComicCardProps = {
  title: string;
  slug: string;
  coverUrl: string | null;
  contentType: string;
  synopsis?: string | null;
};

export function ComicCard({
  title,
  slug,
  coverUrl,
  contentType,
  synopsis,
}: ComicCardProps) {
  return (
    <Link href={`/comics/${slug}`} className="comic-card group">
      <div className="comic-card-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={title} loading="lazy" />
        ) : (
          <div className="comic-cover-placeholder">
            <BookOpen size={30} />
            <span>ComicVerse</span>
          </div>
        )}

        <span className="comic-type">{contentType}</span>
      </div>

      <div className="comic-card-info">
        <h3>{title}</h3>
        {synopsis && <p>{synopsis}</p>}
      </div>
    </Link>
  );
}