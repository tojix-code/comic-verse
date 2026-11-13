"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Clock3,
  LibraryBig,
  PanelsTopLeft,
  Trash2,
  Search,
  RefreshCw,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

type ReadingItem = { id:string; seriesTitle:string; chapterLabel:string|null; pageNumber:number; totalPages:number|null; updatedAt:string; slug:string|null; contentType:string|null; chapterId:string|null };

type LibraryEntry = {
  id: string;
  title: string;
  sourceKey: string;
  sourceSeriesId: string;
  coverUrl: string | null;
  contentType: string;
  createdAt: string;
};

export default function LibraryPage() {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [history, setHistory] = useState<ReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/library", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load your library");
      }

      setEntries(result.data || []);
      const progressResponse = await fetch("/api/reading-progress", { cache: "no-store" });
      const progressResult = await progressResponse.json();
      if (progressResponse.ok && progressResult.success) setHistory(progressResult.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      loadLibrary();
    }
  }, [session, loadLibrary]);

  async function removeBookmark(id: string) {
    const confirmed = window.confirm(
      "Remove this series from your library?"
    );

    if (!confirmed) return;

    setRemovingId(id);

    try {
      const response = await fetch(
        `/api/library?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to remove bookmark");
      }

      setEntries((current) =>
        current.filter((entry) => entry.id !== id)
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to remove bookmark"
      );
    } finally {
      setRemovingId(null);
    }
  }

  const filteredEntries = entries.filter((entry) =>
    entry.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isPending || !session) {
    return (
      <main className="library-loading" aria-live="polite">
        Loading your library…
      </main>
    );
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <PanelsTopLeft size={19} />
          </span>
          <span>
            Comic<span>Verse</span>
          </span>
        </Link>

        <Link href="/" className="account-link">
          <ArrowLeft size={15} />
          Back to discover
        </Link>
      </header>

      <section className="library-content">
        <p className="auth-kicker">YOUR PERSONAL SPACE</p>

        <h1>Welcome, {session.user.name}.</h1>

        <p className="library-intro">
          Your collection, all in one place. Keep track of the
          stories you love.
        </p>

        <div className="library-stats">
          <div>
            <Bookmark size={19} />
            <span>{entries.length}</span>
            <p>Saved titles</p>
          </div>

          <div>
            <BookOpen size={19} />
            <span>—</span>
            <p>Reading now</p>
          </div>

          <div>
            <Clock3 size={19} />
            <span>—</span>
            <p>Reading history</p>
          </div>
        </div>

        {history.length > 0 && (
          <section className="library-reading-history">
            <div className="library-section-header"><div><h2>Continue reading</h2><p>Recently updated reading progress.</p></div></div>
            <div className="library-history-list">
              {history.slice(0,8).map((item) => {
                const isNovel = item.contentType === "novel" || item.contentType === "light-novel";
                const base = isNovel ? "/novels" : "/comics";
                const href = item.slug && item.chapterId ? `${base}/${item.slug}/chapter/${item.chapterId}` : item.slug ? `${base}/${item.slug}` : "#";
                const progress = item.totalPages ? Math.min(100, Math.round(item.pageNumber / item.totalPages * 100)) : 0;
                return <article key={item.id}>
                  <div><h3>{item.seriesTitle}</h3><p>{item.chapterLabel || "Reading"} · Page {item.pageNumber}{item.totalPages ? ` of ${item.totalPages}` : ""}</p><div className="library-progress-track"><span style={{width:`${progress}%`}}/></div></div>
                  {href !== "#" ? <Link href={href}>Resume reading <BookOpen size={14}/></Link> : <span className="library-history-unavailable">Chapter unavailable</span>}
                </article>;
              })}
            </div>
          </section>
        )}

        <div className="library-section-header">
          <div>
            <h2>My collection</h2>
            <p>Your bookmarked series.</p>
          </div>

          <button
            type="button"
            className="library-refresh"
            onClick={loadLibrary}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? "spin" : ""}
            />
            Refresh
          </button>
        </div>

        {entries.length > 0 && (
          <div className="library-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search your collection..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div className="library-message">
            <RefreshCw className="spin" size={22} />
            <p>Loading your collection...</p>
          </div>
        ) : error ? (
          <div className="library-message library-error">
            <p>{error}</p>
            <button onClick={loadLibrary}>Try again</button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-icon">
              <LibraryBig size={25} />
            </div>

            <h2>
              {entries.length === 0
                ? "Your shelf is waiting."
                : "No matching titles."}
            </h2>

            <p>
              {entries.length === 0
                ? "You haven't bookmarked any series yet. Explore ComicVerse and save titles to build your collection."
                : "Try searching with another title."}
            </p>

            {entries.length === 0 && (
              <Link className="account-join" href="/#discover">
                <BookOpen size={15} />
                Explore ComicVerse
              </Link>
            )}
          </div>
        ) : (
          <div className="library-grid">
            {filteredEntries.map((entry) => (
              <article className="library-card" key={entry.id}>
                <div className="library-card-cover">
                  {entry.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.coverUrl}
                      alt={entry.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="library-cover-placeholder">
                      <BookOpen size={30} />
                    </div>
                  )}

                  <button
                    type="button"
                    className="library-remove"
                    title="Remove bookmark"
                    aria-label={`Remove ${entry.title} from library`}
                    disabled={removingId === entry.id}
                    onClick={() => removeBookmark(entry.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="library-card-info">
                  <span className="library-type">
                    {entry.contentType.replace("-", " ")}
                  </span>

                  <h3>{entry.title}</h3>

                  <p>
                    Source: {entry.sourceKey}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="library-feature-grid">
          <article>
            <Bookmark size={18} />
            <h3>Bookmarks</h3>
            <p>Keep the series you want to return to.</p>
          </article>

          <article>
            <Clock3 size={18} />
            <h3>Reading progress</h3>
            <p>Resume from your last saved chapter and page.</p>
          </article>
        </div>
      </section>
    </main>
  );
}