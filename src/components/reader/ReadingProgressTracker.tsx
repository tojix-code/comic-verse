"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Cloud, CloudOff } from "lucide-react";

type ReadingProgressTrackerProps = {
  sourceKey: string;
  sourceSeriesId: string;
  sourceChapterId: string;
  seriesTitle: string;
  chapterLabel: string;
  totalPages: number;
};

export function ReadingProgressTracker(props: ReadingProgressTrackerProps) {
  const [status, setStatus] = useState<"saving" | "saved" | "signed-out" | "error">("saving");
  const lastSaved = useRef(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const save = async (pageNumber: number) => {
      if (pageNumber === lastSaved.current) return;
      try {
        const response = await fetch("/api/reading-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...props, pageNumber }),
        });
        if (response.status === 401) {
          if (active) setStatus("signed-out");
          return;
        }
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        lastSaved.current = pageNumber;
        if (active) setStatus("saved");
      } catch {
        if (active) setStatus("error");
      }
    };

    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const page = Math.min(props.totalPages, Math.max(1, Math.ceil(ratio * props.totalPages) || 1));
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void save(page), 700);
    };

    void save(1);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", update);
    };
  }, [props]);

  const label = status === "saved" ? "Progress synced" : status === "signed-out" ? "Sign in to sync progress" : status === "error" ? "Progress not synced" : "Saving progress…";
  const Icon = status === "saved" ? Check : status === "error" ? CloudOff : Cloud;

  return <p className="reader-progress-status" role="status"><Icon size={14} /> {label}</p>;
}
