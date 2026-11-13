import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return <main className="app-state-page">
    <div className="app-state-card">
      <span className="home-kicker">404 · PAGE NOT FOUND</span>
      <h1>This chapter isn’t here.</h1>
      <p>The page may have moved, the title may no longer be available, or the address may be incorrect.</p>
      <div className="app-state-actions">
        <Link href="/browse" className="button-primary"><Compass size={15}/> Explore stories</Link>
        <Link href="/" className="button-secondary"><ArrowLeft size={15}/> Back home</Link>
      </div>
    </div>
  </main>;
}
