import postgres from "postgres";
import type { BlogPost } from "@/lib/blog";

type BlogPostRow = {
  id: string | number;
  slug: string;
  title: string;
  author_name: string | null;
  author_github: string | null;
  date: string | Date;
  read_time: number | null;
  markdown_content: string | null;
};

const connectionString = process.env.DATABASE_URL;

const sql = connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 1,
    })
  : null;

function mapPost(row: BlogPostRow): BlogPost {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    author: {
      name: row.author_name || "OpenSource @ NITJ",
      github: row.author_github || "Opensource-NITJ",
    },
    date:
      row.date instanceof Date
        ? row.date.toISOString()
        : new Date(row.date).toISOString(),
    readTime: row.read_time ?? 1,
    markdownContent: row.markdown_content || "",
  };
}

export async function getBlogPostsFromDb(): Promise<BlogPost[]> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const rows = await sql<BlogPostRow[]>`
    select
      id,
      slug,
      title,
      author_name,
      author_github,
      date,
      read_time,
      markdown_content
    from blog_posts
    order by date desc
  `;

  return rows.map(mapPost);
}

export async function getBlogPostBySlugFromDb(
  slug: string,
): Promise<BlogPost | null> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const rows = await sql<BlogPostRow[]>`
    select
      id,
      slug,
      title,
      author_name,
      author_github,
      date,
      read_time,
      markdown_content
    from blog_posts
    where slug = ${slug}
    limit 1
  `;

  return rows[0] ? mapPost(rows[0]) : null;
}
