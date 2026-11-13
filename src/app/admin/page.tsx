import { headers } from "next/headers";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { series } from "@/db/schema";
import { auth } from "@/lib/auth";
import { AdminCatalogue } from "@/components/admin/AdminCatalogue";
import Link from "next/link";
import { PlugZap, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") {
    return <main className="admin-denied"><h1>Admin access required</h1><p>Your account does not have catalogue administration permission.</p></main>;
  }

  const rows = await db.select({
    id: series.id,
    title: series.title,
    slug: series.slug,
    published: series.published,
  }).from(series).orderBy(desc(series.createdAt)).limit(100);

  return <main className="admin-page"><div className="sources-topbar"><span className="home-kicker">ADMINISTRATION</span><div className="admin-shortcuts"><Link href="/admin/review" className="source-search-link"><ClipboardCheck size={15}/> Pending Review</Link><Link href="/admin/sources" className="source-search-link"><PlugZap size={15}/> External Sources</Link></div></div><AdminCatalogue initialSeries={rows} /></main>;
}
