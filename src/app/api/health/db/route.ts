import { sql } from "drizzle-orm";
import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("[database-health]", error);
    return Response.json(
      { status: "error", database: "unavailable", message: "Database connection failed." },
      { status: 503 },
    );
  }
}
