import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { chapter, series } from "@/db/schema";
import { ReviewQueue } from "@/components/admin/ReviewQueue";

export const dynamic="force-dynamic";

export default async function AdminReviewPage() {
  const session=await auth.api.getSession({headers:await headers()});
  if(!session) redirect("/login");
  if(session.user.role!=="admin") return <main className="admin-denied"><h1>Admin access required</h1><p>You do not have permission to review catalogue titles.</p></main>;
  const drafts=await db.select({id:series.id,title:series.title,slug:series.slug,contentType:series.contentType,sourceKey:series.sourceKey,sourceSeriesId:series.sourceSeriesId,createdAt:series.createdAt}).from(series).where(eq(series.published,false)).orderBy(desc(series.createdAt)).limit(200);
  const items=await Promise.all(drafts.map(async item=>{
    const rows=await db.select({id:chapter.id}).from(chapter).where(eq(chapter.seriesId,item.id));
    return {...item,chapters:rows.length,createdAt:item.createdAt.toISOString()};
  }));
  return <main className="admin-page"><ReviewQueue initialItems={items}/></main>;
}
