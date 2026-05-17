export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  author: { name: string; github: string };
  date: string;
  readTime: number;
  markdownContent: string;
};

async function fetchBlogJson<T>(path: string): Promise<T> {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      : "";

  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Blog request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getPostsFromPostgres(): Promise<BlogPost[]> {
  return fetchBlogJson<BlogPost[]>("/api/blog");
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await fetchBlogJson<BlogPost>(
      `/api/blog/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}
