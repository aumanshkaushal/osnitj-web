import postgres from "postgres";
import type { Dispatch } from "@/lib/dispatch";

type DispatchRow = {
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

function mapDispatch(row: DispatchRow): Dispatch {
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

export async function getDispatchesFromDb(): Promise<Dispatch[]> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const rows = await sql<DispatchRow[]>`
    select
      id,
      slug,
      title,
      author_name,
      author_github,
      date,
      read_time,
      markdown_content
    from dispatches
    order by date desc
  `;

  return rows.map(mapDispatch);
}

export async function getDispatchBySlugFromDb(
  slug: string,
): Promise<Dispatch | null> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const rows = await sql<DispatchRow[]>`
    select
      id,
      slug,
      title,
      author_name,
      author_github,
      date,
      read_time,
      markdown_content
    from dispatches
    where slug = ${slug}
    limit 1
  `;

  return rows[0] ? mapDispatch(rows[0]) : null;
}

export async function createDispatchInDb(
  dispatch: Omit<Dispatch, "id">,
): Promise<Dispatch> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [row] = await sql<DispatchRow[]>`
    insert into dispatches (
      slug,
      title,
      author_name,
      author_github,
      date,
      read_time,
      markdown_content
    ) values (
      ${dispatch.slug},
      ${dispatch.title},
      ${dispatch.author.name},
      ${dispatch.author.github},
      ${dispatch.date || new Date().toISOString()},
      ${dispatch.readTime},
      ${dispatch.markdownContent}
    )
    returning
      id,
      slug,
      title,
      author_name,
      author_github,
      date,
      read_time,
      markdown_content
  `;

  return mapDispatch(row);
}

export async function updateDispatchInDb(
  id: string,
  dispatch: Partial<Dispatch>,
): Promise<void> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await sql`
    update dispatches
    set
      slug = ${dispatch.slug},
      title = ${dispatch.title},
      author_name = ${dispatch.author?.name},
      author_github = ${dispatch.author?.github},
      date = ${dispatch.date},
      read_time = ${dispatch.readTime},
      markdown_content = ${dispatch.markdownContent},
      updated_at = now()
    where id = ${id}
  `;
}

export async function deleteDispatchFromDb(id: string): Promise<void> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await sql`
    delete from dispatches
    where id = ${id}
  `;
}
