import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { chapter, chapterPage, series } from "@/db/schema";
import { auth } from "@/lib/auth";

const contentTypes = ["manga", "manhwa", "manhua", "light-novel", "novel"];

function textValue(value: unknown, max = 500) {
  return typeof value === "string" && value.trim() && value.length <= max
    ? value.trim()
    : null;
}

function safeHttpsUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return Response.json({ success: false, message: "Invalid request" }, { status: 400 });
    }
    const data = body as Record<string, unknown>;
    const action = data.action;

    if (action === "create-series") {
      const title = textValue(data.title, 300);
      const contentType = textValue(data.contentType, 24);
      const sourceKey = textValue(data.sourceKey, 80) ?? "manual";
      const sourceSeriesId = textValue(data.sourceSeriesId, 200) ?? randomUUID();
      const coverUrl = data.coverUrl ? safeHttpsUrl(data.coverUrl) : null;
      const synopsis = textValue(data.synopsis, 10000);
      const creator = textValue(data.creator, 300);
      const publicationStatus = textValue(data.publicationStatus, 32);
      const releaseYear = data.releaseYear === "" || data.releaseYear == null ? null : Number(data.releaseYear);

      if (!title || !contentType || !contentTypes.includes(contentType) ||
          (data.coverUrl && !coverUrl) ||
          (releaseYear !== null && (!Number.isInteger(releaseYear) || releaseYear < 0 || releaseYear > 2100))) {
        return Response.json({ success: false, message: "Check the title, content type, cover URL and release year." }, { status: 400 });
      }

      const existing = await db.select({ id: series.id }).from(series).where(and(
        eq(series.sourceKey, sourceKey),
        eq(series.sourceSeriesId, sourceSeriesId),
      )).limit(1);
      if (existing.length) {
        return Response.json({ success: false, message: "A title with this source ID already exists." }, { status: 409 });
      }

      const id = randomUUID();
      const baseSlug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "series";
      const slug = `${baseSlug}-${id.slice(0, 8)}`;
      await db.insert(series).values({
        id, sourceKey, sourceSeriesId, slug, title, synopsis, coverUrl, contentType,
        creator, publicationStatus, releaseYear, published: false,
      });
      return Response.json({ success: true, message: "Draft title created. Add chapters, then publish it.", data: { id, slug } });
    }

    if (action === "create-chapter") {
      const seriesId = textValue(data.seriesId, 100);
      const sourceChapterId = textValue(data.sourceChapterId, 200) ?? randomUUID();
      const chapterNumber = textValue(data.chapterNumber, 32);
      const title = textValue(data.title, 300);
      if (!seriesId || (!chapterNumber && !title)) {
        return Response.json({ success: false, message: "Select a title and enter a chapter number or title." }, { status: 400 });
      }
      const parent = await db.select({ id: series.id }).from(series).where(eq(series.id, seriesId)).limit(1);
      if (!parent.length) return Response.json({ success: false, message: "Title not found." }, { status: 404 });
      const duplicate = await db.select({ id: chapter.id }).from(chapter).where(and(
        eq(chapter.seriesId, seriesId), eq(chapter.sourceChapterId, sourceChapterId),
      )).limit(1);
      if (duplicate.length) return Response.json({ success: false, message: "This chapter source ID already exists." }, { status: 409 });
      const id = randomUUID();
      await db.insert(chapter).values({ id, seriesId, sourceChapterId, chapterNumber, title, publishedAt: new Date() });
      return Response.json({ success: true, message: "Chapter created.", data: { id } });
    }

    if (action === "add-page") {
      const chapterId = textValue(data.chapterId, 100);
      const imageUrl = safeHttpsUrl(data.imageUrl);
      const pageNumber = Number(data.pageNumber);
      if (!chapterId || !imageUrl || !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 2000) {
        return Response.json({ success: false, message: "Enter a valid chapter, HTTPS image URL and page number." }, { status: 400 });
      }
      const parent = await db.select({ id: chapter.id }).from(chapter).where(eq(chapter.id, chapterId)).limit(1);
      if (!parent.length) return Response.json({ success: false, message: "Chapter not found." }, { status: 404 });
      await db.insert(chapterPage).values({ id: randomUUID(), chapterId, pageNumber, imageUrl });
      return Response.json({ success: true, message: "Page added." });
    }

    if (action === "set-published") {
      const seriesId = textValue(data.seriesId, 100);
      if (!seriesId || typeof data.published !== "boolean") {
        return Response.json({ success: false, message: "Invalid publish request." }, { status: 400 });
      }
      const [target] = await db.select({ id: series.id }).from(series).where(eq(series.id, seriesId)).limit(1);
      if (!target) return Response.json({ success: false, message: "Title not found." }, { status: 404 });
      await db.update(series).set({ published: data.published, updatedAt: new Date() }).where(eq(series.id, seriesId));
      return Response.json({ success: true, message: data.published ? "Title published." : "Title unpublished." });
    }

    return Response.json({ success: false, message: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    console.error("Admin catalogue API error:", error);
    return Response.json({ success: false, message: "Could not complete catalogue action." }, { status: 500 });
  }
}
