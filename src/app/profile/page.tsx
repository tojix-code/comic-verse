"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { BookOpen, Bookmark, Clock3, ArrowRight, Search, UserRound, RefreshCw } from "lucide-react";
type Entry={id:string;title:string;coverUrl:string|null;contentType:string;sourceKey:string};
type HistoryItem={id:string;seriesTitle:string;chapterLabel:string|null;pageNumber:number;totalPages:number|null;updatedAt:string;slug:string|null;contentType:string|null;chapterId:string|null};
export default function ProfilePage(){
 const router=useRouter();const {data:session,isPending}=authClient.useSession();
 const [entries,setEntries]=useState<Entry[]>([]);const [history,setHistory]=useState<HistoryItem[]>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [query,setQuery]=useState("");const [tab,setTab]=useState<"overview"|"bookmarks"|"history">("overview");
 async function load(){setLoading(true);setError("");try{const [a,b]=await Promise.all([fetch("/api/library",{cache:"no-store"}),fetch("/api/reading-progress",{cache:"no-store"})]);const [ar,br]=await Promise.all([a.json(),b.json()]);if(!a.ok||!ar.success)throw new Error(ar.message||"Could not load your library");setEntries(ar.data||[]);setHistory(b.ok&&br.success?br.data||[]:[]);}catch(e){setError(e instanceof Error?e.message:"Something went wrong");}finally{setLoading(false);}}
 useEffect(()=>{if(!isPending&&!session)router.replace("/login");else if(session)void load();},[isPending,session,router]);
 const filtered=useMemo(()=>entries.filter(x=>x.title.toLowerCase().includes(query.toLowerCase())),[entries,query]);
 if(isPending||!session)return <main className="profile-loading">Preparing your profile…</main>;
 return <main className="profile-page cv-page">
 <section className="profile-hero"><div className="profile-avatar"><UserRound size={30}/></div><div className="profile-identity"><span className="home-kicker">YOUR COMICVERSE</span><h1>{session.user.name||"Reader"}</h1><p>{session.user.email}</p><span className="profile-member">Reader account</span></div><button className="profile-refresh" onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/> Refresh</button></section>
 <section className="profile-stat-grid"><article><Bookmark/><strong>{entries.length}</strong><span>Saved titles</span></article><article><BookOpen/><strong>{history.length}</strong><span>Reading records</span></article><article><Clock3/><strong>{history.length}</strong><span>Recent activity</span></article></section>
 <nav className="profile-tabs" aria-label="Profile sections">{(["overview","bookmarks","history"] as const).map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t==="overview"?"Overview":t==="bookmarks"?"Bookmarks":"Reading history"}</button>)}</nav>
 {error&&<div className="profile-error" role="alert">{error}<button onClick={()=>void load()}>Retry</button></div>}
 {loading?<div className="profile-loading"><RefreshCw className="spin"/> Loading your activity…</div>:<>
 {(tab==="overview"||tab==="history")&&<section className="profile-section"><div className="profile-section-heading"><div><span className="home-kicker">PICK UP WHERE YOU LEFT OFF</span><h2>Reading history</h2></div>{tab==="overview"&&<button onClick={()=>setTab("history")}>View all <ArrowRight size={15}/></button>}</div>
 {history.length?<div className="profile-history-list">{history.slice(0,tab==="overview"?4:50).map(item=>{const novel=item.contentType==="novel"||item.contentType==="light-novel";const href=item.slug&&item.chapterId?((novel?"/novels":"/comics")+"/"+item.slug+"/chapter/"+item.chapterId):"#";const pct=item.totalPages?Math.min(100,Math.round(item.pageNumber/item.totalPages*100)):0;return <article key={item.id}><div className="profile-history-icon"><BookOpen/></div><div className="profile-history-info"><h3>{item.seriesTitle}</h3><p>{item.chapterLabel||"Reading"} · Page {item.pageNumber}{item.totalPages?" of "+item.totalPages:""}</p><div className="library-progress-track"><span style={{width:pct+"%"}}/></div></div>{href!=="#"?<Link href={href}>Continue <ArrowRight size={15}/></Link>:<span className="profile-unavailable">Unavailable</span>}</article>})}</div>:<div className="profile-empty"><Clock3/><h3>No reading history yet</h3><p>Open a title and start reading. Your recent progress will appear here.</p><Link href="/browse">Discover stories <ArrowRight size={15}/></Link></div>}</section>}
 {(tab==="overview"||tab==="bookmarks")&&<section className="profile-section"><div className="profile-section-heading"><div><span className="home-kicker">YOUR PERSONAL COLLECTION</span><h2>Saved titles</h2></div>{tab==="overview"&&<Link href="/library">Open library <ArrowRight size={15}/></Link>}</div>
 {tab==="bookmarks"&&<label className="profile-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search saved titles"/></label>}
 {filtered.length?<div className="profile-bookmark-grid">{filtered.slice(0,tab==="overview"?6:100).map(item=><Link href="/library" className="profile-bookmark-card" key={item.id}>{item.coverUrl?<img src={item.coverUrl} alt="" loading="lazy"/>:<div className="profile-cover-placeholder"><BookOpen/></div>}<div><span>{item.contentType.replace("-"," ")}</span><h3>{item.title}</h3><small>{item.sourceKey}</small></div></Link>)}</div>:<div className="profile-empty"><Bookmark/><h3>{entries.length?"No matching titles":"Your collection is empty"}</h3><p>{entries.length?"Try another search.":"Save titles while browsing to build your reading shelf."}</p><Link href="/browse">Explore ComicVerse <ArrowRight size={15}/></Link></div>}</section>}
 </>}
 </main>;
}
