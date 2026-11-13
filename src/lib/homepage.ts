import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { chapter, libraryEntry, series } from "@/db/schema";

export async function getHomepageData() {
  try {
  const publishedSeries = await db
    .select()
    .from(series)
    .where(eq(series.published, true))
    .orderBy(desc(series.createdAt))
    .limit(50);

  const latestUpdates = await db
    .select({
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.title,
      publishedAt: chapter.publishedAt,
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      coverUrl: series.coverUrl,
      contentType: series.contentType,
    })
    .from(chapter)
    .innerJoin(series, eq(chapter.seriesId, series.id))
    .where(eq(series.published, true))
    .orderBy(desc(chapter.publishedAt))
    .limit(10);

  const trending = await db
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      coverUrl: series.coverUrl,
      synopsis: series.synopsis,
      contentType: series.contentType,
      bookmarkCount: count(libraryEntry.id),
    })
    .from(series)
    .leftJoin(
      libraryEntry,
      and(
        eq(libraryEntry.sourceKey, series.sourceKey),
        eq(libraryEntry.sourceSeriesId, series.sourceSeriesId)
      )
    )
    .where(eq(series.published, true))
    .groupBy(series.id)
    .orderBy(desc(count(libraryEntry.id)))
    .limit(10);

  const weeklyPopular = await db
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      coverUrl: series.coverUrl,
      synopsis: series.synopsis,
      contentType: series.contentType,
      bookmarkCount: count(libraryEntry.id),
    })
    .from(series)
    .innerJoin(
      libraryEntry,
      and(
        eq(libraryEntry.sourceKey, series.sourceKey),
        eq(libraryEntry.sourceSeriesId, series.sourceSeriesId),
        gte(
          libraryEntry.createdAt,
          new Date(Date.now() - 7 * 86400000)
        )
      )
    )
    .where(eq(series.published, true))
    .groupBy(series.id)
    .orderBy(desc(count(libraryEntry.id)))
    .limit(10);

  const monthlyPopular = await db
    .select({
      id: series.id,
      slug: series.slug,
      title: series.title,
      coverUrl: series.coverUrl,
      synopsis: series.synopsis,
      contentType: series.contentType,
      bookmarkCount: count(libraryEntry.id),
    })
    .from(series)
    .innerJoin(
      libraryEntry,
      and(
        eq(libraryEntry.sourceKey, series.sourceKey),
        eq(libraryEntry.sourceSeriesId, series.sourceSeriesId),
        gte(
          libraryEntry.createdAt,
          new Date(Date.now() - 30 * 86400000)
        )
      )
    )
    .where(eq(series.published, true))
    .groupBy(series.id)
    .orderBy(desc(count(libraryEntry.id)))
    .limit(10);

  return {
    databaseAvailable: true,
    featured: publishedSeries.slice(0, 7),
    latestUpdates,
    recentlyAdded: publishedSeries.slice(0, 10),
    trending,
    popular: {
      weekly: weeklyPopular,
      monthly: monthlyPopular,
      allTime: trending,
    },
  };
  } catch (error) {
    console.error("[homepage-catalogue] Database unavailable:", error);
    return {
      databaseAvailable: false,
      featured: [],
      latestUpdates: [],
      recentlyAdded: [],
      trending: [],
      popular: { weekly: [], monthly: [], allTime: [] },
    };
  }
}
