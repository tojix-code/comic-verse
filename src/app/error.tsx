"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[ComicVerse] Application error:", error); }, [error]);
  return <main className="app-state-page">
    <div className="app-state-card">
      <span className="home-kicker"><AlertTriangle size={14}/> SOMETHING WENT WRONG</span>
      <h1>We hit a small plot twist.</h1>
      <p>The page could not be loaded right now. Your account and saved library have not been intentionally changed.</p>
      {error.digest && <small>Reference: {error.digest}</small>}
      <div className="app-state-actions">
        <button type="button" className="button-primary" onClick={reset}><RefreshCw size={15}/> Try again</button>
        <Link href="/" className="button-secondary"><Home size={15}/> Back home</Link>
      </div>
    </div>
  </main>;
}
