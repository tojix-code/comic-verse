import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { readingProgress } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sourceKey = searchParams.get("sourceKey");
    const sourceSeriesId = searchParams.get("sourceSeriesId");

    if (!sourceKey || !sourceSeriesId) {
      return Response.json({ success: false, message: "Series details are required" }, { status: 400 });
    }

    const rows = await db.select().from(readingProgress).where(and(
      eq(readingProgress.userId, session.user.id),
      eq(readingProgress.sourceKey, sourceKey),
      eq(readingProgress.sourceSeriesId, sourceSeriesId),
    )).limit(1);

    return Response.json({ success: true, data: rows[0] ?? null });
  } catch (error) {
    console.error("Reading progress GET error:", error);
    return Response.json({ success: false, message: "Unable to load reading progress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return Response.json({ success: false, message: "Invalid progress details" }, { status: 400 });
    }

    const value = body as Record<string, unknown>;
    const { sourceKey, sourceSeriesId, sourceChapterId, seriesTitle, chapterLabel, pageNumber, totalPages } = value;

    if (
      typeof sourceKey !== "string" || !sourceKey.trim() || sourceKey.length > 80 ||
      typeof sourceSeriesId !== "string" || !sourceSeriesId.trim() ||
      typeof sourceChapterId !== "string" || !sourceChapterId.trim() ||
      typeof seriesTitle !== "string" || !seriesTitle.trim() ||
      (chapterLabel !== null && chapterLabel !== undefined && typeof chapterLabel !== "string") ||
      !Number.isInteger(pageNumber) || (pageNumber as number) < 1 ||
      (totalPages !== null && totalPages !== undefined && (!Number.isInteger(totalPages) || (totalPages as number) < 1))
    ) {
      return Response.json({ success: false, message: "Invalid progress details" }, { status: 400 });
    }

    const existing = await db.select({ id: readingProgress.id }).from(readingProgress).where(and(
      eq(readingProgress.userId, session.user.id),
      eq(readingProgress.sourceKey, sourceKey),
      eq(readingProgress.sourceChapterId, sourceChapterId),
    )).limit(1);

    const values = {
      userId: session.user.id,
      sourceKey,
      sourceSeriesId,
      sourceChapterId,
      seriesTitle,
      chapterLabel: typeof chapterLabel === "string" ? chapterLabel.slice(0, 120) : null,
      pageNumber: pageNumber as number,
      totalPages: typeof totalPages === "number" ? totalPages : null,
      updatedAt: new Date(),
    };

    if (existing[0]) {
      await db.update(readingProgress).set(values).where(eq(readingProgress.id, existing[0].id));
    } else {
      await db.insert(readingProgress).values({ id: randomUUID(), ...values });
    }

    return Response.json({ success: true, message: "Reading progress saved" });
  } catch (error) {
    console.error("Reading progress POST error:", error);
    return Response.json({ success: false, message: "Unable to save reading progress" }, { status: 500 });
  }
}
