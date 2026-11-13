import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Copy .env.local.example to .env.local and add your Neon PostgreSQL connection string.",
  );
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
