import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { libraryEntry } from "@/db/schema";

// GET: Retrieve the logged-in user's library
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const entries = await db
      .select()
      .from(libraryEntry)
      .where(eq(libraryEntry.userId, session.user.id))
      .orderBy(desc(libraryEntry.createdAt));

    return Response.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error("Library GET error:", error);

    return Response.json(
      { success: false, message: "Failed to load library" },
      { status: 500 }
    );
  }
}

// POST: Add a bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      sourceKey,
      sourceSeriesId,
      title,
      coverUrl,
      contentType,
    } = body;

    const allowedTypes = [
      "manga",
      "manhwa",
      "manhua",
      "light-novel",
      "novel",
    ];

    if (
      typeof sourceKey !== "string" ||
      !sourceKey.trim() ||
      sourceKey.length > 80 ||
      typeof sourceSeriesId !== "string" ||
      !sourceSeriesId.trim() ||
      typeof title !== "string" ||
      !title.trim() ||
      title.length > 500 ||
      !allowedTypes.includes(contentType)
    ) {
      return Response.json(
        { success: false, message: "Invalid bookmark details" },
        { status: 400 }
      );
    }

    if (
      coverUrl !== undefined &&
      coverUrl !== null &&
      (typeof coverUrl !== "string" ||
        !coverUrl.startsWith("https://"))
    ) {
      return Response.json(
        { success: false, message: "Invalid cover URL" },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(libraryEntry)
      .values({
        id: randomUUID(),
        userId: session.user.id,
        sourceKey: sourceKey.trim(),
        sourceSeriesId: sourceSeriesId.trim(),
        title: title.trim(),
        coverUrl: coverUrl ?? null,
        contentType,
      })
      .onConflictDoNothing()
      .returning();

    return Response.json({
      success: true,
      message: inserted.length
        ? "Bookmark added successfully"
        : "Already in your library",
      data: inserted[0] ?? null,
    });
  } catch (error) {
    console.error("Library POST error:", error);

    return Response.json(
      { success: false, message: "Failed to add bookmark" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a bookmark
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const sourceKey = searchParams.get("sourceKey");
    const sourceSeriesId = searchParams.get("sourceSeriesId");

    if (!id && (!sourceKey || !sourceSeriesId)) {
      return Response.json(
        { success: false, message: "Bookmark ID or source details required" },
        { status: 400 }
      );
    }

    const conditions = [
      eq(libraryEntry.userId, session.user.id),
    ];

    if (id) {
      conditions.push(eq(libraryEntry.id, id));
    } else {
      conditions.push(eq(libraryEntry.sourceKey, sourceKey!));
      conditions.push(
        eq(libraryEntry.sourceSeriesId, sourceSeriesId!)
      );
    }

    const deleted = await db
      .delete(libraryEntry)
      .where(and(...conditions))
      .returning();

    return Response.json({
      success: true,
      message: deleted.length
        ? "Bookmark removed"
        : "Bookmark not found",
    });
  } catch (error) {
    console.error("Library DELETE error:", error);

    return Response.json(
      { success: false, message: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}