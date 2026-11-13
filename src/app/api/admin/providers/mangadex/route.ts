import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { contentSource, series } from "@/db/schema";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    const [sourceConfig] = await db.select({ enabled: contentSource.enabled }).from(contentSource).where(eq(contentSource.sourceKey, "mangadex")).limit(1);
    if (!sourceConfig?.enabled) return Response.json({ success: false, message: "Enable MangaDex in Admin → External Sources before searching." }, { status: 409 });
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    if (!query || query.length < 2 || query.length > 100) {
      return Response.json({ success: false, message: "Enter at least 2 characters." }, { status: 400 });
    }

    const url = new URL("https://api.mangadex.org/manga");
    url.searchParams.set("title", query);
    url.searchParams.set("limit", "20");
    url.searchParams.set("includes[]", "cover_art");
    url.searchParams.set("order[relevance]", "desc");
    url.searchParams.append("contentRating[]", "safe");
    url.searchParams.append("contentRating[]", "suggestive");
    const response = await fetch(url, {
      headers: { "User-Agent": "ComicVerse/1.0 (catalogue admin search)" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      return Response.json({ success: false, message: response.status === 429 ? "MangaDex search is rate limited. Try again shortly." : "MangaDex search is unavailable right now." }, { status: 502 });
    }
    const payload = await response.json();
    const results = (Array.isArray(payload.data) ? payload.data : []).map((item: any) => {
      const attrs = item.attributes ?? {};
      const titleMap = attrs.title ?? {};
      const title = titleMap.en ?? Object.values(titleMap)[0] ?? "Untitled";
      const descriptionMap = attrs.description ?? {};
      const description = descriptionMap.en ?? Object.values(descriptionMap)[0] ?? "";
      const cover = item.relationships?.find((rel: any) => rel.type === "cover_art")?.attributes?.fileName;
      const language = attrs.originalLanguage;
      const contentType = language === "ko" ? "manhwa" : language === "zh" || language === "zh-hk" ? "manhua" : "manga";
      return {
        id: item.id,
        title: String(title).slice(0, 300),
        synopsis: String(description).slice(0, 10000),
        coverUrl: cover ? `https://uploads.mangadex.org/covers/${item.id}/${encodeURIComponent(cover)}.256.jpg` : null,
        contentType,
        status: attrs.status ?? null,
        year: attrs.year ?? null,
        tags: (attrs.tags ?? []).map((tag: any) => tag.attributes?.name?.en).filter(Boolean).slice(0, 12),
        originalLanguage: language ?? null,
      };
    });
    return Response.json({ success: true, provider: "mangadex", results });
  } catch (error) {
    console.error("MangaDex admin search error:", error);
    return Response.json({ success: false, message: "Could not reach MangaDex. Try again later." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    const [sourceConfig] = await db.select({ enabled: contentSource.enabled }).from(contentSource).where(eq(contentSource.sourceKey, "mangadex")).limit(1);
    if (!sourceConfig?.enabled) return Response.json({ success: false, message: "Enable MangaDex in Admin → External Sources before importing." }, { status: 409 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ success: false, message: "Invalid request" }, { status: 400 });
    const data = body as Record<string, unknown>;
    if (data.provider !== "mangadex" || typeof data.providerId !== "string" ||
        typeof data.title !== "string" || !data.title.trim() ||
        typeof data.contentType !== "string" ||
        !["manga", "manhwa", "manhua"].includes(data.contentType)) {
      return Response.json({ success: false, message: "Invalid provider title." }, { status: 400 });
    }

    const [existing] = await db.select({ id: series.id, published: series.published }).from(series).where(and(
      eq(series.sourceKey, "mangadex"), eq(series.sourceSeriesId, data.providerId),
    )).limit(1);
    if (existing) return Response.json({ success: false, message: existing.published ? "This title is already published." : "This title is already in your review queue." }, { status: 409 });

    const id = randomUUID();
    const baseSlug = data.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "series";
    const slug = `${baseSlug}-${id.slice(0, 8)}`;
    const coverUrl = typeof data.coverUrl === "string" && data.coverUrl.startsWith("https://") ? data.coverUrl : null;
    const releaseYear = Number.isInteger(data.year) && Number(data.year) >= 0 && Number(data.year) <= 2100 ? Number(data.year) : null;
    await db.insert(series).values({
      id, sourceKey: "mangadex", sourceSeriesId: data.providerId,
      slug, title: data.title.trim().slice(0, 300),
      synopsis: typeof data.synopsis === "string" ? data.synopsis.slice(0, 10000) : null,
      coverUrl, contentType: data.contentType,
      publicationStatus: typeof data.status === "string" ? data.status.slice(0, 32) : null,
      releaseYear, published: false,
    });
    return Response.json({ success: true, message: "Imported to the pending review queue. It is not public until you approve it.", data: { id, slug } });
  } catch (error) {
    console.error("Provider import error:", error);
    return Response.json({ success: false, message: "Could not import this title." }, { status: 500 });
  }
}
