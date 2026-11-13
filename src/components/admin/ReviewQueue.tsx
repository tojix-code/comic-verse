"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

type Item={id:string;title:string;slug:string;contentType:string;sourceKey:string;createdAt:string;chapters:number};
export function ReviewQueue({initialItems}:{initialItems:Item[]}) {
  const [items,setItems]=useState(initialItems);
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  async function publish(item:Item) {
    setBusy(item.id);setMessage("");
    try {
      const response=await fetch("/api/admin/catalogue",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"set-published",seriesId:item.id,published:true})});
      const result=await response.json();
      if(!response.ok||!result.success) throw new Error(result.message||"Could not publish title.");
      setItems(current=>current.filter(row=>row.id!==item.id));setMessage(`${item.title} has been published.`);
    } catch(error) {setMessage(error instanceof Error?error.message:"Could not publish title.");}
    finally {setBusy(null);}
  }
  return <div className="review-queue">
    <header><span className="home-kicker">CATALOGUE MODERATION</span><h1>Pending review</h1><p>Draft titles imported from provider search or created manually. Review the metadata and chapters before publishing.</p></header>
    {message&&<p className="admin-feedback" role="status">{message}</p>}
    {items.length===0?<div className="home-empty"><CheckCircle2 size={28}/><h2>Queue is clear</h2><p>There are no unpublished titles waiting for review.</p><Link href="/admin">Return to catalogue management</Link></div>:
      <div className="review-list">{items.map(item=><article key={item.id}>
        <div className="review-list-main"><div><h2>{item.title}</h2><p>{item.contentType} · Source: {item.sourceKey} · {item.chapters} chapter records</p><small>Added {new Date(item.createdAt).toLocaleDateString("en-IN")}</small></div><span className="review-pending">DRAFT</span></div>
        <div className="review-actions"><Link href={`/admin#catalogue`}>Edit catalogue <ExternalLink size={13}/></Link><button disabled={!!busy} onClick={()=>void publish(item)}>{busy===item.id?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Approve &amp; publish</button></div>
      </article>)}</div>}
  </div>;
}
