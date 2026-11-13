import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { contentSource } from "@/db/schema";
import { auth } from "@/lib/auth";

const PROVIDERS = [
  { sourceKey: "weebcentral", displayName: "WeebCentral", homepageUrl: "https://weebcentral.com", accessMode: "provider-api", notes: "Uses the configured ComicVerse provider API; availability depends on upstream access and permissions." },
  { sourceKey: "asura", displayName: "Asura Scans", homepageUrl: "https://asuracomic.net", accessMode: "provider-api", notes: "Uses the configured ComicVerse provider API; availability depends on upstream access and permissions." },
  { sourceKey: "comick", displayName: "ComicK", homepageUrl: "https://comick.io", accessMode: "provider-api", notes: "Uses the configured ComicVerse provider API; availability depends on upstream access and permissions." },
  { sourceKey: "mangadex", displayName: "MangaDex", homepageUrl: "https://mangadex.org", accessMode: "public-api", notes: "Public API metadata search is available. Chapter-page reuse is subject to source terms and content rights." },
] as const;

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}

export async function GET() {
  if (!(await isAdmin())) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  try {
    const rows = await db.select().from(contentSource);
    const byKey = new Map(rows.map((row) => [row.sourceKey, row]));
    const sources = PROVIDERS.map((provider) => {
      const saved = byKey.get(provider.sourceKey);
      return {
        ...provider,
        id: saved?.id ?? null,
        enabled: saved?.enabled ?? false,
        approved: saved?.approved ?? false,
        accessMode: saved?.accessMode ?? provider.accessMode,
        notes: saved?.notes ?? provider.notes,
        configured: provider.sourceKey === "mangadex" || (!!(process.env.COMICVERSE_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL) && ["comick", "asura", "weebcentral"].includes(provider.sourceKey)),
      };
    });
    return Response.json({ success: true, sources });
  } catch (error) {
    console.error("Admin source settings GET:", error);
    return Response.json({ success: false, message: "Could not load provider settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ success: false, message: "Invalid request." }, { status: 400 });
    const data = body as Record<string, unknown>;
    const provider = PROVIDERS.find((item) => item.sourceKey === data.sourceKey);
    if (!provider || typeof data.enabled !== "boolean") return Response.json({ success: false, message: "Invalid provider setting." }, { status: 400 });
    if (data.enabled && provider.sourceKey !== "mangadex") {
      return Response.json({ success: false, message: "This provider cannot be enabled until an authorized connector is configured." }, { status: 409 });
    }
    const values = {
      id: randomUUID(),
      sourceKey: provider.sourceKey,
      displayName: provider.displayName,
      homepageUrl: provider.homepageUrl,
      accessMode: provider.accessMode,
      approved: provider.sourceKey === "mangadex",
      enabled: data.enabled,
      notes: provider.notes,
      updatedAt: new Date(),
    };
    await db.insert(contentSource).values(values).onConflictDoUpdate({
      target: contentSource.sourceKey,
      set: {
        displayName: values.displayName,
        homepageUrl: values.homepageUrl,
        accessMode: values.accessMode,
        approved: values.approved,
        enabled: values.enabled,
        notes: values.notes,
        updatedAt: values.updatedAt,
      },
    });
    return Response.json({ success: true, message: `${provider.displayName} settings updated.` });
  } catch (error) {
    console.error("Admin source settings PATCH:", error);
    return Response.json({ success: false, message: "Could not update provider settings." }, { status: 500 });
  }
}
