export type MangaTitle = {
  id: string;
  title: string;
  contentType: "manga" | "manhwa" | "manhua" | "unknown";
  coverUrl: string;
  status: string;
  rating: string;
  genres: string[];
  themes: string[];
  description: string;
  year: number | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export async function checkApiHealth() {
  const response = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
  return response.json() as Promise<{ status: string; timestamp: string; sources: string[] }>;
}

export async function searchManga(query: string): Promise<MangaTitle[]> {
  const url = `${API_BASE}/api/manga/search?q=${encodeURIComponent(query)}&source=mangadex&limit=18`;
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (!Array.isArray(payload?.results)) throw new Error("The provider returned an unexpected response.");
  return payload.results as MangaTitle[];
}
