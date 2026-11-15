"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Maximize2, Moon, Sun, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

type Width = "compact" | "comfortable" | "wide";
type Theme = "dark" | "black" | "sepia";

export function ReaderControls({ previousHref, nextHref }: { previousHref?: string; nextHref?: string }) {
  const [width, setWidth] = useState<Width>("comfortable");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedWidth = localStorage.getItem("cv-reader-width") as Width | null;
    const savedTheme = localStorage.getItem("cv-reader-theme") as Theme | null;
    if (savedWidth && ["compact", "comfortable", "wide"].includes(savedWidth)) setWidth(savedWidth);
    if (savedTheme && ["dark", "black", "sepia"].includes(savedTheme)) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("cv-reader-width", width);
    localStorage.setItem("cv-reader-theme", theme);
    document.documentElement.dataset.readerWidth = width;
    document.documentElement.dataset.readerTheme = theme;
    return () => {
      delete document.documentElement.dataset.readerWidth;
      delete document.documentElement.dataset.readerTheme;
    };
  }, [width, theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable)) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft" && previousHref) window.location.assign(previousHref);
      if (event.key === "ArrowRight" && nextHref) window.location.assign(nextHref);
      if (event.key === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previousHref, nextHref]);

  return (
    <div className="reader-controls" aria-label="Reader settings">
      <div className="reader-control-group" aria-label="Reading width">
        <span>Width</span>
        {(["compact", "comfortable", "wide"] as Width[]).map((option) => (
          <button key={option} type="button" className={width === option ? "active" : ""} onClick={() => setWidth(option)} aria-pressed={width === option}>
            {option === "compact" ? "Narrow" : option === "comfortable" ? "Default" : "Wide"}
          </button>
        ))}
      </div>
      <div className="reader-control-group" aria-label="Reader theme">
        <span>Theme</span>
        <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")} aria-label="Dark theme" aria-pressed={theme === "dark"}><Moon size={14} /> Dark</button>
        <button type="button" className={theme === "black" ? "active" : ""} onClick={() => setTheme("black")} aria-label="Black theme" aria-pressed={theme === "black"}><Sun size={14} /> Black</button>
        <button type="button" className={theme === "sepia" ? "active" : ""} onClick={() => setTheme("sepia")} aria-label="Sepia theme" aria-pressed={theme === "sepia"}><Sun size={14} /> Sepia</button>
      </div>
      <div className="reader-control-group reader-key-help">
        {previousHref ? <Link href={previousHref} aria-label="Previous chapter"><ChevronLeft size={16} /> Previous</Link> : null}
        {nextHref ? <Link href={nextHref} aria-label="Next chapter">Next <ChevronRight size={16} /></Link> : null}
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={14} /> Top</button>
      </div>
      <span className="reader-shortcut-hint"><Maximize2 size={12} /> Use ← / → to change chapters · Home to return to top</span>
    </div>
  );
}
