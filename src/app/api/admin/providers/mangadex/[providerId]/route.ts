import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { chapter, contentSource, series } from "@/db/schema";
import { auth } from "@/lib/auth";

type Context = { params: Promise<{ providerId: string }> };
async function admin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}
async function enabled() {
  const [row] = await db.select({ enabled: contentSource.enabled }).from(contentSource).where(eq(contentSource.sourceKey, "mangadex")).limit(1);
  return !!row?.enabled;
}
async function mdFetch(path: string) {
  const response = await fetch(`https://api.mangadex.org${path}`, {
    headers: { "User-Agent": "ComicVerse/1.0 (catalogue management)" },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(response.status === 429 ? "MangaDex rate limit reached. Try again shortly." : "MangaDex is temporarily unavailable.");
  return response.json();
}
function clean(value: unknown, max=3000) { return typeof value === "string" ? value.slice(0,max) : ""; }

export async function GET(_request: Request, { params }: Context) {
  if (!(await admin())) return Response.json({ success:false, message:"Forbidden" }, { status:403 });
  if (!(await enabled())) return Response.json({ success:false, message:"Enable MangaDex in Admin → External Sources first." }, { status:409 });
  const { providerId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(providerId)) return Response.json({ success:false, message:"Invalid MangaDex title ID." }, { status:400 });
  try {
    const [detail, feed] = await Promise.all([
      mdFetch(`/manga/${providerId}?includes[]=cover_art&includes[]=author&includes[]=artist`),
      mdFetch(`/manga/${providerId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&offset=0`),
    ]);
    const item = detail.data;
    if (!item?.id) return Response.json({ success:false, message:"Title not found on MangaDex." }, { status:404 });
    const attrs = item.attributes ?? {};
    const titleMap = attrs.title ?? {};
    const cover = item.relationships?.find((r:any)=>r.type==="cover_art")?.attributes?.fileName;
    const names = (type:string) => item.relationships?.filter((r:any)=>r.type===type).map((r:any)=>r.attributes?.name).filter(Boolean) ?? [];
    const title = String(titleMap.en ?? Object.values(titleMap)[0] ?? "Untitled");
    const existing = await db.select({id:series.id,slug:series.slug,published:series.published}).from(series).where(and(eq(series.sourceKey,"mangadex"),eq(series.sourceSeriesId,providerId))).limit(1);
    const chapters = (Array.isArray(feed.data)?feed.data:[]).map((ch:any)=>({
      id:ch.id,
      number:ch.attributes?.chapter ?? null,
      title:ch.attributes?.title ?? null,
      volume:ch.attributes?.volume ?? null,
      publishedAt:ch.attributes?.publishAt ?? null,
      pages:Number.isInteger(ch.attributes?.pages)?ch.attributes.pages:null,
      language:ch.attributes?.translatedLanguage ?? null,
    }));
    return Response.json({success:true,title:{
      id:item.id,title,synopsis:clean(attrs.description?.en,10000),status:attrs.status??null,year:attrs.year??null,
      contentType:attrs.originalLanguage==="ko"?"manhwa":attrs.originalLanguage?.startsWith("zh")?"manhua":"manga",
      coverUrl:cover?`https://uploads.mangadex.org/covers/${item.id}/${encodeURIComponent(cover)}.256.jpg`:null,
      authors:names("author"),artists:names("artist"),genres:(attrs.tags??[]).map((t:any)=>t.attributes?.name?.en).filter(Boolean),
      sourceUrl:`https://mangadex.org/title/${item.id}`,
    },chapters,chapterCount:feed.total??chapters.length,existing:existing[0]??null});
  } catch(error) {
    return Response.json({success:false,message:error instanceof Error?error.message:"Could not load MangaDex details."},{status:502});
  }
}

export async function POST(request:Request,{params}:Context) {
  if (!(await admin())) return Response.json({success:false,message:"Forbidden"},{status:403});
  if (!(await enabled())) return Response.json({success:false,message:"Enable MangaDex in Admin → External Sources first."},{status:409});
  const {providerId}=await params;
  try {
    const body:unknown=await request.json();
    if (body && typeof body === "object" && (body as Record<string,unknown>).action === "sync") {
      const [parent]=await db.select({id:series.id}).from(series).where(and(eq(series.sourceKey,"mangadex"),eq(series.sourceSeriesId,providerId))).limit(1);
      if(!parent) return Response.json({success:false,message:"Import the MangaDex title into the catalogue first."},{status:404});
      const synced:any[]=[];
      for(let offset=0;offset<2000;offset+=500) {
        const params=new URLSearchParams();
        params.set("limit","500"); params.set("offset",String(offset)); params.set("order[chapter]","asc"); params.append("translatedLanguage[]","en");
        const feed=await mdFetch(`/manga/${providerId}/feed?${params.toString()}`);
        const batch=Array.isArray(feed.data)?feed.data:[];
        synced.push(...batch);
        if(batch.length<500 || offset+500>=Number(feed.total??0)) break;
      }
      const values=synced.map((item:any)=>({
        id:randomUUID(),seriesId:parent.id,sourceChapterId:item.id,
        chapterNumber:item.attributes?.chapter??null,title:item.attributes?.title??null,
        publishedAt:item.attributes?.publishAt?new Date(item.attributes.publishAt):null,
      }));
      if(values.length) await db.insert(chapter).values(values).onConflictDoNothing();
      return Response.json({success:true,message:`Checked ${values.length} English chapter record(s). Existing chapters were left unchanged; new records were added.`,checked:values.length});
    }
    if(!body||typeof body!=="object") return Response.json({success:false,message:"Invalid request."},{status:400});
    const ids=(body as Record<string,unknown>).chapterIds;
    if(!Array.isArray(ids)||ids.length<1||ids.length>500||ids.some(id=>typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))) return Response.json({success:false,message:"Select between 1 and 500 valid chapter IDs."},{status:400});
    const [parent]=await db.select({id:series.id}).from(series).where(and(eq(series.sourceKey,"mangadex"),eq(series.sourceSeriesId,providerId))).limit(1);
    if(!parent) return Response.json({success:false,message:"Import the manga title into the draft catalogue first."},{status:409});
    const params=new URLSearchParams();
    params.set("limit","500");
    params.set("order[chapter]","asc");
    params.append("translatedLanguage[]","en");
    const feed=await mdFetch(`/manga/${providerId}/feed?${params.toString()}`);
    const selected=(Array.isArray(feed.data)?feed.data:[]).filter((item:any)=>ids.includes(item.id));
    if(selected.length===0) return Response.json({success:false,message:"No selected chapters were found in the English chapter feed."},{status:404});
    const values=selected.map((item:any)=>({
      id:randomUUID(),seriesId:parent.id,sourceChapterId:item.id,
      chapterNumber:item.attributes?.chapter??null,title:item.attributes?.title??null,
      publishedAt:item.attributes?.publishAt?new Date(item.attributes.publishAt):null,
    }));
    await db.insert(chapter).values(values).onConflictDoNothing();
    return Response.json({success:true,message:`Imported ${selected.length} chapter record(s). Chapter images are not copied; add authorized page URLs through the chapter manager.`,imported:selected.length});
  } catch(error) {
    return Response.json({success:false,message:error instanceof Error?error.message:"Could not import selected chapters."},{status:502});
  }
}
