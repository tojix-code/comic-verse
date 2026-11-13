"use client";

import { FormEvent, useState } from "react";
import { Loader2, PlusCircle, BookOpen, ImagePlus, Send } from "lucide-react";

type SeriesOption = { id: string; title: string; slug: string; published: boolean };
type Props = { initialSeries: SeriesOption[] };

export function AdminCatalogue({ initialSeries }: Props) {
  const [titles, setTitles] = useState(initialSeries);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      <div className="admin-catalogue-intro">
        <span className="home-kicker">CATALOGUE CONTROL</span>
        <h1>Manage ComicVerse</h1>
        <p>Create catalogue entries, add chapters and page URLs, then publish titles to Browse.</p>
      </div>

      {message && <p className="admin-feedback" role="status">{message}</p>}

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
        {titles.length === 0 ? <p className="admin-note">No catalogue titles yet. Create your first draft above.</p> : <div className="admin-title-list">{titles.map((item) => <div key={item.id}><span>{item.title}</span><small>{item.published ? "Published" : "Draft"} · {item.slug}</small></div>)}</div>}
      </section>
    </div>
  );
}
