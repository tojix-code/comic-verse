import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { chapter, contentSource, series } from "@/db/schema";
import { auth } from "@/lib/auth";

const PROVIDERS = ["comick", "weebcentral", "asura"] as const;
type Provider = typeof PROVIDERS[number];
type Ctx = { params: Promise<{ provider: string }> };

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}
function textValue(value: unknown, max = 10000): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}
function normalizeType(value: unknown): "manga" | "manhwa" | "manhua" {
  return value === "manhwa" || value === "manhua" ? value : "manga";
}
function backendUrl(path: string) {
  const base = (process.env.COMICVERSE_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL)?.trim().replace(/\/$/, "");
  if (!base) throw new Error("COMICVERSE_API_URL is not configured on the ComicVerse web deployment.");
  return `${base}${path}`;
}
async function upstream(path: string) {
  const response = await fetch(backendUrl(path), { cache: "no-store", signal: AbortSignal.timeout(18000) });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Provider denied access. Use its source link or an authorized integration.");
    if (response.status === 429) throw new Error("Provider rate limit reached. Try again shortly.");
    throw new Error(`Provider API returned HTTP ${response.status}.`);
  }
  return response.json();
}

type NormalizedChapter = { id: string; number: string | null; title: string | null; publishedAt: string | null; pages: number | null };

function chapterRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.chapters)) return payload.chapters;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.chapters)) return payload.data.chapters;
  return [];
}

function normalizeChapters(rows: any[]): NormalizedChapter[] {
  return rows.map((item: any) => {
    const id = item.hid ?? item.id ?? item.slug ?? item.chapterId ?? item.chapter_id;
    const number = item.chap ?? item.chapter ?? item.number ?? item.chapterNumber ?? item.chapter_number;
    const publishedAt = item.created_at ?? item.publish_at ?? item.publishedAt ?? item.date ?? null;
    const pageCount = item.page_count ?? item.pageCount ?? item.pages;
    return {
      id: String(id ?? ""),
      number: number === undefined || number === null || number === "" ? null : String(number),
      title: textValue(item.title ?? item.name, 300) || null,
      publishedAt: typeof publishedAt === "string" ? publishedAt : null,
      pages: Number.isInteger(pageCount) ? pageCount : null,
    };
  }).filter((item) => item.id);
}

async function fetchChapterCatalogue(provider: Provider, id: string) {
  // ComicK's upstream chapter endpoint is reliably paginated in small pages.
  // The backend accepts larger limits but caps ComicK requests; don't assume
  // one oversized request contains the complete catalogue.
  const pageSize = provider === "comick" ? 20 : 500;
  const maxPages = provider === "comick" ? 5 : 1;
  const collected: NormalizedChapter[] = [];
  let reportedTotal: number | null = null;
  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await upstream(`/api/manga/${encodeURIComponent(id)}/chapters?source=${provider}&lang=en&page=${page}&limit=${pageSize}`);
    const rows = chapterRows(payload);
    const normalized = normalizeChapters(rows);
    collected.push(...normalized);
    const total = Number(payload?.total ?? payload?.totalChapters ?? payload?.pagination?.total);
    if (Number.isFinite(total) && total >= 0) reportedTotal = total;
    if (rows.length < pageSize || (reportedTotal !== null && collected.length >= reportedTotal)) break;
  }
  const unique = [...new Map(collected.map((item) => [item.id, item])).values()];
  return { chapters: unique, total: reportedTotal ?? unique.length, hasMore: reportedTotal !== null ? unique.length < reportedTotal : unique.length >= pageSize * maxPages };
}

function enabled(provider: Provider) {
  return db.select({ enabled: contentSource.enabled }).from(contentSource).where(eq(contentSource.sourceKey, provider)).limit(1);
}

export async function GET(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  const { provider: rawProvider } = await params;
  if (!PROVIDERS.includes(rawProvider as Provider)) return Response.json({ success: false, message: "Unsupported provider." }, { status: 404 });
  const provider = rawProvider as Provider;
  const [setting] = await enabled(provider);
  if (!setting?.enabled) return Response.json({ success: false, message: `Enable ${provider} in Admin → External Sources first.` }, { status: 409 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const query = searchParams.get("q")?.trim();
  try {
    if (id) {
      const [detail, feed] = await Promise.all([
        upstream(`/api/manga/${encodeURIComponent(id)}?source=${provider}`),
        fetchChapterCatalogue(provider, id),
      ]);
      const raw = (detail?.data ?? detail?.manga ?? detail?.comic ?? detail) as Record<string, any>;
      const chapters = feed.chapters;
      const title = textValue(raw.title ?? raw.name ?? raw.comic?.title, 300) || id;
      const coverUrl = raw.coverUrl ?? raw.cover ?? raw.thumbnail ?? raw.image ?? null;
      return Response.json({
        success: true,
        title: {
          id, title, synopsis: textValue(raw.description ?? raw.synopsis, 10000),
          coverUrl: typeof coverUrl === "string" && coverUrl.startsWith("https://") ? coverUrl : null,
          contentType: normalizeType(raw.contentType ?? raw.type),
          status: textValue(raw.status, 32) || null, year: Number.isInteger(raw.year) ? raw.year : null,
          authors: Array.isArray(raw.authors) ? raw.authors.map(String) : [],
          artists: Array.isArray(raw.artists) ? raw.artists.map(String) : [],
          genres: Array.isArray(raw.genres) ? raw.genres.map((g: any) => typeof g === "string" ? g : g?.name).filter(Boolean) : [],
          sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl : null,
        },
        chapters,
        chapterCount: feed.total,
        chapterHasMore: feed.hasMore,
      });
    }
    if (!query || query.length < 2 || query.length > 100) return Response.json({ success: false, message: "Enter a title search between 2 and 100 characters." }, { status: 400 });
    const payload = await upstream(`/api/manga/search?q=${encodeURIComponent(query)}&source=${provider}&type=manga&page=1&limit=24`);
    const rawResults = Array.isArray(payload?.results) ? payload.results : [];
    const results = rawResults.map((item: any) => ({
      id: String(item.id ?? item.hid ?? item.slug ?? ""),
      title: textValue(item.title ?? item.name, 300),
      synopsis: textValue(item.description ?? item.synopsis, 3000),
      coverUrl: typeof (item.coverUrl ?? item.cover ?? item.thumbnail ?? item.image) === "string" && String(item.coverUrl ?? item.cover ?? item.thumbnail ?? item.image).startsWith("https://") ? (item.coverUrl ?? item.cover ?? item.thumbnail ?? item.image) : null,
      contentType: normalizeType(item.contentType ?? item.type),
      status: textValue(item.status, 32) || null,
      year: Number.isInteger(item.year) ? item.year : null,
      tags: Array.isArray(item.genres) ? item.genres.map((g: any) => typeof g === "string" ? g : g?.name).filter(Boolean).slice(0, 12) : [],
    })).filter((item: any) => item.id && item.title);
    return Response.json({ success: true, provider, results });
  } catch (error) {
    return Response.json({ success: false, message: error instanceof Error ? error.message : "Provider request failed." }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  const { provider: rawProvider } = await params;
  if (!PROVIDERS.includes(rawProvider as Provider)) return Response.json({ success: false, message: "Unsupported provider." }, { status: 404 });
  const provider = rawProvider as Provider;
  const [setting] = await enabled(provider);
  if (!setting?.enabled) return Response.json({ success: false, message: "Enable this provider before importing." }, { status: 409 });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "import-chapters") {
      if (typeof body.providerId !== "string" || !Array.isArray(body.chapterIds) || body.chapterIds.length < 1 || body.chapterIds.length > 500 || body.chapterIds.some((id) => typeof id !== "string")) {
        return Response.json({ success: false, message: "Select between 1 and 500 chapter records." }, { status: 400 });
      }
      const chapterIds = body.chapterIds as string[];
      const [parent] = await db.select({ id: series.id }).from(series).where(and(eq(series.sourceKey, provider), eq(series.sourceSeriesId, body.providerId))).limit(1);
      if (!parent) return Response.json({ success: false, message: "Import the title as a draft first." }, { status: 409 });
      const feed = await fetchChapterCatalogue(provider, body.providerId);
      const selected = feed.chapters.filter((item) => chapterIds.includes(item.id));
      const values = selected.map((item) => ({
        id: randomUUID(), seriesId: parent.id,
        sourceChapterId: item.id,
        chapterNumber: textValue(item.number, 32),
        title: item.title,
        publishedAt: item.publishedAt && !Number.isNaN(Date.parse(item.publishedAt)) ? new Date(item.publishedAt) : null,
      }));
      if (values.length) await db.insert(chapter).values(values).onConflictDoNothing();
      return Response.json({ success: true, message: `Imported ${values.length} chapter metadata record(s). Page content is not copied.`, imported: values.length });
    }
    if (typeof body.providerId !== "string" || !body.providerId.trim() || typeof body.title !== "string" || !body.title.trim()) {
      return Response.json({ success: false, message: "Invalid provider title." }, { status: 400 });
    }
    const [existing] = await db.select({ id: series.id }).from(series).where(and(eq(series.sourceKey, provider), eq(series.sourceSeriesId, body.providerId))).limit(1);
    if (existing) return Response.json({ success: false, message: "This title is already in your catalogue or review queue." }, { status: 409 });
    const id = randomUUID();
    const slugBase = body.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 75) || "series";
    const coverUrl = typeof body.coverUrl === "string" && body.coverUrl.startsWith("https://") ? body.coverUrl : null;
    await db.insert(series).values({
      id, sourceKey: provider, sourceSeriesId: body.providerId,
      slug: `${slugBase}-${id.slice(0, 8)}`, title: body.title.trim().slice(0, 300),
      synopsis: textValue(body.synopsis, 10000) || null, coverUrl,
      contentType: normalizeType(body.contentType),
      publicationStatus: textValue(body.status, 32) || null,
      releaseYear: Number.isInteger(body.year) && Number(body.year) >= 0 && Number(body.year) <= 2100 ? Number(body.year) : null,
      published: false,
    });
    return Response.json({ success: true, message: "Imported as a draft for admin review.", data: { id, slug: `${slugBase}-${id.slice(0, 8)}` } });
  } catch (error) {
    return Response.json({ success: false, message: error instanceof Error ? error.message : "Could not import provider title." }, { status: 502 });
  }
}
