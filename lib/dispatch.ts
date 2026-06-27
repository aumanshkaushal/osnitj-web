export type Dispatch = {
  id: string;
  slug: string;
  title: string;
  author: { name: string; github: string };
  date: string;
  readTime: number;
  markdownContent: string;
};

async function fetchDispatchJson<T>(path: string): Promise<T> {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      : "";

  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Dispatch request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getDispatchesFromPostgres(): Promise<Dispatch[]> {
  return fetchDispatchJson<Dispatch[]>("/api/dispatches");
}

export async function getDispatchBySlug(slug: string): Promise<Dispatch | null> {
  try {
    return await fetchDispatchJson<Dispatch>(
      `/api/dispatch/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}
