import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ExternalSourcesPanel } from "@/components/admin/ExternalSourcesPanel";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin") return <main className="admin-denied"><h1>Admin access required</h1><p>Your account does not have permission to manage external sources.</p></main>;
  return <main className="admin-page"><ExternalSourcesPanel /></main>;
}
