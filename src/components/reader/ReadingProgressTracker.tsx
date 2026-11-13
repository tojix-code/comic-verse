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

export function ReadingProgressTracker({
  sourceKey,
  sourceSeriesId,
  sourceChapterId,
  seriesTitle,
  chapterLabel,
  totalPages,
}: ReadingProgressTrackerProps) {
  const [status, setStatus] = useState<"restoring" | "saving" | "saved" | "signed-out" | "error">("restoring");
  const lastSaved = useRef(0);

  useEffect(() => {
    let active = true;
    let observer: IntersectionObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;

    const save = async (pageNumber: number) => {
      if (pageNumber === lastSaved.current || !active) return;
      try {
        const response = await fetch("/api/reading-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceKey, sourceSeriesId, sourceChapterId, seriesTitle,
            chapterLabel, pageNumber, totalPages,
          }),
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

    const queueSave = (pageNumber: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void save(pageNumber), 650);
    };

    const startTracking = () => {
      const pageElements = Array.from(
        document.querySelectorAll<HTMLElement>("[data-reader-page]")
      );
      if (!pageElements.length || !active) return;

      observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const pageNumber = Number((visible.target as HTMLElement).dataset.readerPage);
        if (Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
          queueSave(pageNumber);
        }
      }, { threshold: [0.2, 0.45, 0.7] });

      pageElements.forEach((element) => observer?.observe(element));
    };

    const restore = async () => {
      try {
        const query = new URLSearchParams({ sourceKey, sourceSeriesId });
        const response = await fetch(`/api/reading-progress?${query.toString()}`, { cache: "no-store" });
        if (response.status === 401) {
          if (active) setStatus("signed-out");
          startTracking();
          return;
        }
        const result = await response.json();
        const savedPage = Number(result?.data?.sourceChapterId === sourceChapterId ? result.data.pageNumber : 1);
        const pageNumber = Number.isInteger(savedPage) ? Math.min(totalPages, Math.max(1, savedPage)) : 1;

        if (active && result?.success && result.data?.sourceChapterId === sourceChapterId && pageNumber > 1) {
          setStatus("saved");
          restoreTimer = setTimeout(() => {
            document.querySelector<HTMLElement>(`[data-reader-page="${pageNumber}"]`)
              ?.scrollIntoView({ behavior: "instant", block: "start" });
            startTracking();
          }, 120);
        } else {
          if (active) setStatus("saving");
          startTracking();
        }
      } catch {
        if (active) setStatus("error");
        startTracking();
      }
    };

    void restore();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      if (restoreTimer) clearTimeout(restoreTimer);
      observer?.disconnect();
    };
  }, [sourceKey, sourceSeriesId, sourceChapterId, seriesTitle, chapterLabel, totalPages]);

  const label = status === "saved" ? "Progress synced" : status === "signed-out" ? "Sign in to sync progress" : status === "error" ? "Progress sync unavailable" : status === "restoring" ? "Restoring your place…" : "Saving progress…";
  const Icon = status === "saved" ? Check : status === "error" ? CloudOff : Cloud;

  return <p className="reader-progress-status" role="status"><Icon size={14} /> {label}</p>;
}
