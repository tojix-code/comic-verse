"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, ExternalLink, Loader2, PlugZap, RefreshCw, Search, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";

type Provider = { sourceKey: string; displayName: string; homepageUrl: string; accessMode: string; notes: string; enabled: boolean; approved: boolean; configured: boolean };

export function ExternalSourcesPanel() {
  const [sources, setSources] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/sources", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not load providers.");
      setSources(result.sources);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load providers.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggle(source: Provider) {
    setSaving(source.sourceKey);
    setMessage("");
    try {
      const response = await fetch("/api/admin/sources", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKey: source.sourceKey, enabled: !source.enabled }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not update provider.");
      setMessage(result.message);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update provider.");
    } finally { setSaving(null); }
  }

  return <div className="sources-admin">
    <div className="sources-topbar"><Link href="/admin" className="sources-back"><ArrowLeft size={16}/> Admin dashboard</Link><button onClick={() => void load()} className="sources-refresh"><RefreshCw size={15}/> Refresh</button></div>
    <header className="sources-heading"><span className="home-kicker">INTEGRATIONS / CONTENT PROVIDERS</span><h1>External Sources</h1><p>Choose which verified content providers are available to your admin catalogue workflow. Provider availability and access permissions are shown separately.</p></header>
    <div className="sources-summary"><div><PlugZap/><span><b>{sources.filter(s=>s.enabled).length}</b><small>Enabled providers</small></span></div><div><ShieldCheck/><span><b>{sources.filter(s=>s.configured).length}</b><small>Configured integrations</small></span></div><div><Activity/><span><b>{sources.length}</b><small>Registered providers</small></span></div></div>
    {message && <div className="sources-message" role="status">{message}</div>}
    {loading ? <div className="sources-loading"><Loader2 className="animate-spin"/> Loading provider settings…</div> : <div className="sources-grid">{sources.map(source=><article className="source-card" key={source.sourceKey}>
      <div className="source-card-head"><div className={`source-mark source-${source.sourceKey}`}>{source.displayName.slice(0,1)}</div><div className="source-name"><h2>{source.displayName}</h2><a href={source.homepageUrl} target="_blank" rel="noreferrer">{new URL(source.homepageUrl).hostname}<ExternalLink size={12}/></a></div><span className={`source-status ${source.enabled ? "is-enabled" : ""}`}>{source.enabled ? "Enabled" : "Disabled"}</span></div>
      <p>{source.notes}</p>
      <div className="source-meta"><span>{source.accessMode === "public-api" ? "Public API" : "Manual / pending integration"}</span><span>{source.configured ? "Connector configured" : "Connector not configured"}</span></div>
      <div className="source-card-actions"><button disabled={!!saving || !source.configured} onClick={()=>void toggle(source)} className={source.enabled ? "source-toggle active" : "source-toggle"}>{saving===source.sourceKey ? <Loader2 size={16} className="animate-spin"/> : source.enabled ? <ToggleRight size={19}/> : <ToggleLeft size={19}/>} {source.enabled ? "Disable provider" : "Enable provider"}</button>{source.sourceKey==="mangadex" && <Link href="/admin" className="source-search-link"><Search size={14}/> Search catalogue</Link>}</div>
    </article>)}</div>}
    <div className="sources-footnote"><CheckCircle2 size={16}/><p>ComicVerse only enables integrations with an available, permitted connector. A provider appearing here does not imply permission to scrape its website or reuse its chapters. Unconfigured providers remain visible for manual reference and future integration.</p></div>
  </div>;
}
