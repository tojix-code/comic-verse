import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { contentSource, series } from "@/db/schema";
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
  const base = process.env.COMICVERSE_API_URL?.trim().replace(/\/$/, "");
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
        upstream(`/api/manga/${encodeURIComponent(id)}/chapters?source=${provider}&lang=en&limit=500`),
      ]);
      const raw = detail as Record<string, any>;
      const chapters = Array.isArray(feed?.chapters) ? feed.chapters : Array.isArray(feed?.results) ? feed.results : [];
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
        chapters: chapters.map((item: any) => ({
          id: String(item.id ?? item.hid ?? item.slug ?? ""),
          number: String(item.number ?? item.chapter ?? item.chap ?? "") || null,
          title: textValue(item.title, 300) || null,
          publishedAt: item.publishedAt ?? item.date ?? null,
          pages: Number.isInteger(item.pages) ? item.pages : null,
        })).filter((item: any) => item.id),
        chapterCount: chapters.length,
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
