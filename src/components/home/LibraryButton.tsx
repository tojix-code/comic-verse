"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type LibraryButtonProps = {
  sourceKey: string;
  sourceSeriesId: string;
  title: string;
  coverUrl: string | null;
  contentType: string;
};

export function LibraryButton({
  sourceKey,
  sourceSeriesId,
  title,
  coverUrl,
  contentType,
}: LibraryButtonProps) {
  const { data: session, isPending } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  async function addToLibrary() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceKey,
          sourceSeriesId,
          title,
          coverUrl,
          contentType,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not add to library.");
      }

      setSaved(true);
      setMessage(result.message || "Added to your library!");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {isPending ? (
        <button type="button" disabled className="details-library-button"><Loader2 size={15} className="animate-spin" /> Checking account…</button>
      ) : !session ? (
        <Link href="/login" className="details-library-button"><Bookmark size={15} /> Sign in to save</Link>
      ) : <button
        onClick={addToLibrary}
        disabled={loading || saved}
        className="details-library-button"
        type="button"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : saved ? (
          <Check size={18} />
        ) : (
          <Bookmark size={18} />
        )}

        {loading
          ? "Adding..."
          : saved
            ? "In My Library"
            : "Add to My Library"}
      </button>}

      {message && (
        <p className="details-library-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
