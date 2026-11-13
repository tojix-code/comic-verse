"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, BookOpen, LoaderCircle, Search, Sparkles } from "lucide-react";
import { MangaTitle, searchManga } from "@/lib/api";
import { LibraryButton } from "@/components/home/LibraryButton";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaTitle[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value || busy) return;
    setBusy(true);
    setError("");
    setResults([]);
    setSearched(true);
    try {
      setResults(await searchManga(value));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="search-panel">
      <form onSubmit={submit} className="search-form" role="search">
        <Search className="ml-2 mt-2.5 shrink-0 text-zinc-500" size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search thousands of manga, manhwa and manhua…"
          aria-label="Search manga, manhwa and manhua"
          maxLength={100}
        />
        <button type="submit" disabled={busy || !query.trim()} className="search-submit">
          {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}
          <span>{busy ? "Searching" : "Search titles"}</span>
        </button>
      </form>

      <p className="search-source-note"><Sparkles size={13} /> Search results are provided by MangaDex. Save any title to your personal library.</p>
      {busy && <div className="search-feedback" role="status"><LoaderCircle size={16} className="animate-spin" /> Searching MangaDex…</div>}
      {error && <div className="search-feedback error" role="alert"><AlertTriangle size={17} className="mt-0.5 shrink-0" /><div><strong>Search is currently unavailable.</strong><br />{error}<br /><span className="opacity-70">Check that the Manga API is running and the frontend API URL is configured.</span></div></div>}
      {!busy && !error && searched && results.length === 0 && <div className="search-feedback" role="status">No results for “{query}”. Try a shorter or alternate title.</div>}
      {results.length > 0 && <div className="search-results" aria-live="polite">{results.map((item) => (
        <article key={item.id} className="search-result">
          <div className="result-cover">{item.coverUrl ? <img src={item.coverUrl} alt={`Cover for ${item.title}`} loading="lazy" /> : <BookOpen size={22} />}</div>
          <div className="result-info">
            <h3>{item.title}</h3>
            <p>{item.contentType === "unknown" ? "Comic" : item.contentType}{item.status ? ` · ${item.status}` : ""}{item.year ? ` · ${item.year}` : ""}</p>
            {item.genres.length > 0 && <p className="result-genres">{item.genres.slice(0, 3).join(" · ")}</p>}
            <LibraryButton sourceKey="mangadex" sourceSeriesId={item.id} title={item.title} coverUrl={item.coverUrl || null} contentType={item.contentType === "unknown" ? "manga" : item.contentType} />
          </div>
        </article>
      ))}</div>}
    </div>
  );
}
