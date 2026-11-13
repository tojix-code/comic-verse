"use client";

import { FormEvent, useState } from "react";
import { Loader2, PlusCircle, BookOpen, ImagePlus, Send, Search, CheckCircle2 } from "lucide-react";

type SeriesOption = { id: string; title: string; slug: string; published: boolean };
type ProviderTitle = { id: string; title: string; synopsis: string; coverUrl: string | null; contentType: string; status: string | null; year: number | null; tags: string[] };
type Props = { initialSeries: SeriesOption[] };
type ProviderChapter = { id: string; number: string | null; title: string | null; publishedAt: string | null; pages: number | null };
type ProviderDetail = { title: { id: string; title: string; synopsis: string; coverUrl: string | null; status: string | null; year: number | null; contentType: string; authors: string[]; artists: string[]; genres: string[]; sourceUrl: string | null }; chapters: ProviderChapter[]; chapterCount: number };

export function AdminCatalogue({ initialSeries }: Props) {
  const [titles, setTitles] = useState(initialSeries);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState("mangadex");
  const [providerQuery, setProviderQuery] = useState("");
  const [providerResults, setProviderResults] = useState<ProviderTitle[]>([]);
  const [searchingProvider, setSearchingProvider] = useState(false);
  const [providerDetail, setProviderDetail] = useState<ProviderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [importingChapters, setImportingChapters] = useState(false);

  async function searchProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (providerQuery.trim().length < 2) return;
    setSearchingProvider(true);
    setMessage("");
    setProviderResults([]);
    try {
      const response = await fetch(provider === "mangadex" ? `/api/admin/providers/mangadex?q=${encodeURIComponent(providerQuery.trim())}` : `/api/admin/providers/${provider}?q=${encodeURIComponent(providerQuery.trim())}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Provider search failed.");
      setProviderResults(result.results);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Provider search failed.");
    } finally {
      setSearchingProvider(false);
    }
  }

  async function inspectProviderTitle(item: ProviderTitle) {
    setLoadingDetail(true); setProviderDetail(null); setSelectedChapterIds([]); setMessage("");
    try {
      const response = await fetch(provider === "mangadex" ? `/api/admin/providers/mangadex/${encodeURIComponent(item.id)}` : `/api/admin/providers/${provider}?id=${encodeURIComponent(item.id)}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not load title details.");
      setProviderDetail(result);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load title details."); }
    finally { setLoadingDetail(false); }
  }

  async function importSelectedChapters() {
    if (!providerDetail || selectedChapterIds.length === 0) return;
    setImportingChapters(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/providers/mangadex/${encodeURIComponent(providerDetail.title.id)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chapterIds: selectedChapterIds }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Chapter import failed.");
      setMessage(result.message); setSelectedChapterIds([]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chapter import failed."); }
    finally { setImportingChapters(false); }
  }

  async function importProviderTitle(item: ProviderTitle) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(provider === "mangadex" ? "/api/admin/providers/mangadex" : `/api/admin/providers/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, providerId: item.id, title: item.title, synopsis: item.synopsis, coverUrl: item.coverUrl, contentType: item.contentType, status: item.status, year: item.year }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Import failed.");
      setMessage(result.message);
      setTitles((items) => [{ id: result.data.id, title: item.title, slug: result.data.slug, published: false }, ...items]);
      setProviderResults((items) => items.filter((candidate) => candidate.id !== item.id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function setVisibility(item: SeriesOption, published: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-published", seriesId: item.id, published }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not update visibility.");
      setTitles((items) => items.map((entry) => entry.id === item.id ? { ...entry, published } : entry));
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update visibility.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, action }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Request failed.");
      setMessage(result.data?.id ? `${result.message} ID: ${result.data.id}` : result.message);
      form.reset();
      if (action === "create-series") window.location.reload();
      if (action === "set-published") {
        setTitles((items) => items.map((item) => item.id === values.seriesId ? { ...item, published: values.published === "true" } : item));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const options = titles.map((item) => <option value={item.id} key={item.id}>{item.title} {item.published ? "(Published)" : "(Draft)"}</option>);

  return (
    <div className="admin-catalogue">
      <div className="admin-catalogue-intro" id="catalogue">
        <span className="home-kicker">CATALOGUE CONTROL</span>
        <h1>Manage ComicVerse</h1>
        <p>Create catalogue entries, add chapters and page URLs, then publish titles to Browse.</p>
      </div>

      {message && <p className="admin-feedback" role="status">{message}</p>}

      <section className="admin-panel">
        <h2><Search size={19} /> Search external catalogues</h2>
        <form onSubmit={searchProvider} className="admin-form">
          <label className="admin-full">Search title<input value={providerQuery} onChange={(event)=>setProviderQuery(event.target.value)} minLength={2} maxLength={100} placeholder="Search MangaDex titles…" /></label>
          <button type="submit" disabled={searchingProvider || providerQuery.trim().length<2}>{searchingProvider ? <Loader2 className="animate-spin" size={16}/> : <Search size={16}/>} Search MangaDex</button>
        </form>
        {providerResults.length>0 && <div className="admin-provider-results">{providerResults.map((item)=><article key={item.id} className="admin-provider-result">
          {item.coverUrl && <img src={item.coverUrl} alt="" />}
          <div className="admin-provider-result-copy"><h3>{item.title}</h3><p>{item.contentType} · {item.status || "Status unknown"}{item.year ? ` · ${item.year}` : ""}</p><p>{item.synopsis.slice(0,220)}</p></div>
          <div className="admin-provider-actions"><button type="button" disabled={loadingDetail} onClick={()=>void inspectProviderTitle(item)}>Inspect title &amp; chapters</button><button type="button" disabled={busy} onClick={()=>void importProviderTitle(item)}>Import draft</button></div>
        </article>)}</div>}
        {loadingDetail && <p className="admin-note">Loading title and chapter metadata…</p>}
        {providerDetail && <div className="admin-provider-detail">
          <div className="admin-provider-detail-head">{providerDetail.title.coverUrl && <img src={providerDetail.title.coverUrl} alt=""/>}<div><h3>{providerDetail.title.title}</h3><p>{providerDetail.title.contentType} · {providerDetail.title.status || "Status unknown"} · {providerDetail.title.year || "Year unknown"}</p><p>Authors: {providerDetail.title.authors.join(", ") || "Unknown"} · Artists: {providerDetail.title.artists.join(", ") || "Unknown"}</p>{providerDetail.title.sourceUrl && <a href={providerDetail.title.sourceUrl} target="_blank" rel="noreferrer">Open source title ↗</a>}</div></div>
          <p>{providerDetail.title.synopsis || "No synopsis available."}</p><p className="admin-note">{providerDetail.chapterCount} English chapter records available. Import the title as a draft first, then import selected chapter metadata.</p>
          <div className="admin-provider-chapter-list">{providerDetail.chapters.map((item)=><label key={item.id}><input type="checkbox" checked={selectedChapterIds.includes(item.id)} onChange={(event)=>setSelectedChapterIds((current)=>event.target.checked?[...current,item.id]:current.filter((id)=>id!==item.id))}/><span>Chapter {item.number || "Special"}{item.title ? ` · ${item.title}` : ""}</span><small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-IN") : "Date unavailable"}</small></label>)}</div>
          <button type="button" disabled={importingChapters || selectedChapterIds.length===0} onClick={()=>void importSelectedChapters()}>{importingChapters ? "Importing…" : `Import ${selectedChapterIds.length} selected chapter(s)`}</button>
        </div>}
      </section>

      <section className="admin-panel">
        <h2><PlusCircle size={19} /> Add a title</h2>
        <form onSubmit={(event) => submit(event, "create-series")} className="admin-form">
          <label>Title<input name="title" required maxLength={300} placeholder="e.g. Example title" /></label>
          <label>Content type<select name="contentType" required><option value="manga">Manga</option><option value="manhwa">Manhwa</option><option value="manhua">Manhua</option><option value="light-novel">Light Novel</option><option value="novel">Novel</option></select></label>
          <label>Source key<input name="sourceKey" defaultValue="manual" maxLength={80} /></label>
          <label>Source ID (optional)<input name="sourceSeriesId" placeholder="Leave blank for a generated ID" maxLength={200} /></label>
          <label>Cover image URL (HTTPS)<input name="coverUrl" type="url" placeholder="https://..." /></label>
          <label>Creator<input name="creator" maxLength={300} /></label>
          <label>Release year<input name="releaseYear" type="number" min="0" max="2100" /></label>
          <label>Publication status<input name="publicationStatus" maxLength={32} placeholder="Ongoing / Completed" /></label>
          <label className="admin-full">Synopsis<textarea name="synopsis" rows={4} maxLength={10000} /></label>
          <button disabled={busy} type="submit">{busy ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />} Create draft title</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2><BookOpen size={19} /> Add a chapter</h2>
        <form onSubmit={(event) => submit(event, "create-chapter")} className="admin-form">
          <label className="admin-full">Title<select name="seriesId" required defaultValue=""><option value="" disabled>Select a title</option>{options}</select></label>
          <label>Chapter number<input name="chapterNumber" placeholder="1 / 1.5 / 10" maxLength={32} /></label>
          <label>Chapter title<input name="title" maxLength={300} placeholder="Optional chapter name" /></label>
          <label className="admin-full">Source chapter ID (optional)<input name="sourceChapterId" placeholder="Leave blank for a generated ID" maxLength={200} /></label>
          <button disabled={busy} type="submit">{busy ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />} Create chapter</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2><ImagePlus size={19} /> Add a reading page</h2>
        <form onSubmit={(event) => submit(event, "add-page")} className="admin-form">
          <label className="admin-full">Chapter ID<input name="chapterId" required placeholder="Paste the chapter ID returned after creating it" /></label>
          <label>Page number<input name="pageNumber" type="number" min="1" max="2000" required /></label>
          <label>Page image URL (HTTPS)<input name="imageUrl" type="url" required placeholder="https://..." /></label>
          <button disabled={busy} type="submit">{busy ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />} Add page</button>
        </form>
        <p className="admin-note">Only add page URLs you own or are authorized to display. This form does not scrape third-party sites.</p>
      </section>

      <section className="admin-panel">
        <h2><Send size={19} /> Publish a title</h2>
        <form onSubmit={(event) => submit(event, "set-published")} className="admin-form">
          <label className="admin-full">Title<select name="seriesId" required defaultValue=""><option value="" disabled>Select a title</option>{options}</select></label>
          <label>Visibility<select name="published"><option value="true">Published</option><option value="false">Draft / hidden</option></select></label>
          <button disabled={busy} type="submit">{busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Update visibility</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Existing titles</h2>
        {titles.length === 0 ? <p className="admin-note">No catalogue titles yet. Create your first draft above.</p> : <div className="admin-title-list">{titles.map((item) => <div key={item.id}><span>{item.title}</span><small>{item.published ? "Published" : "Draft"} · {item.slug}</small>{item.published && <button type="button" disabled={busy} onClick={() => void setVisibility(item, false)}>Unpublish</button>}</div>)}</div>}
      </section>
    </div>
  );
}
