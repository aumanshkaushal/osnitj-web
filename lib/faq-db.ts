import postgres from "postgres";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;

const sql = connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 1,
      prepare: false,
    })
  : null;

export type FaqTag = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  created_at: Date;
};

export type FaqQuestion = {
  id: string;
  slug: string;
  tag_slug: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
};

export async function getFaqTagsFromDb(): Promise<FaqTag[]> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const rows = await sql`
    select id, slug, label, icon, created_at
    from public.faq_tags
    order by slug asc
  `;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    created_at: new Date(row.created_at),
  }));
}

export async function createFaqTagInDb(tag: {
  slug: string;
  label: string;
  icon: string;
}): Promise<FaqTag> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const [row] = await sql`
    insert into public.faq_tags (slug, label, icon)
    values (${tag.slug}, ${tag.label}, ${tag.icon})
    returning id, slug, label, icon, created_at
  `;

  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    icon: row.icon,
    created_at: new Date(row.created_at),
  };
}

export async function updateFaqTagInDb(
  slug: string,
  tag: {
    label: string;
    icon: string;
  }
): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    update public.faq_tags
    set label = ${tag.label}, icon = ${tag.icon}
    where slug = ${slug}
  `;
}

export async function deleteFaqTagFromDb(slug: string): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    delete from public.faq_tags
    where slug = ${slug}
  `;
}

export async function getFaqQuestionsFromDb(): Promise<FaqQuestion[]> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const rows = await sql`
    select id, slug, tag_slug, question, answer, order_index, created_at, updated_at
    from public.faq_questions
    order by order_index asc, created_at desc
  `;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    tag_slug: row.tag_slug,
    question: row.question,
    answer: row.answer,
    order_index: row.order_index,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

export async function createFaqQuestionInDb(question: {
  slug: string;
  tag_slug: string;
  question: string;
  answer: string;
  order_index: number;
}): Promise<FaqQuestion> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const [row] = await sql`
    insert into public.faq_questions (slug, tag_slug, question, answer, order_index)
    values (${question.slug}, ${question.tag_slug}, ${question.question}, ${question.answer}, ${question.order_index})
    returning id, slug, tag_slug, question, answer, order_index, created_at, updated_at
  `;

  return {
    id: row.id,
    slug: row.slug,
    tag_slug: row.tag_slug,
    question: row.question,
    answer: row.answer,
    order_index: row.order_index,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function updateFaqQuestionInDb(
  id: string,
  question: {
    slug: string;
    tag_slug: string;
    question: string;
    answer: string;
    order_index: number;
  }
): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    update public.faq_questions
    set
      slug = ${question.slug},
      tag_slug = ${question.tag_slug},
      question = ${question.question},
      answer = ${question.answer},
      order_index = ${question.order_index},
      updated_at = now()
    where id = ${id}
  `;
}

export async function deleteFaqQuestionFromDb(id: string): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    delete from public.faq_questions
    where id = ${id}
  `;
}

const CACHE_PATH = path.join(process.cwd(), "node_modules", ".faq-cache.json");

export async function getCachedFaqData(): Promise<{ tags: FaqTag[]; questions: FaqQuestion[] }> {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const stats = fs.statSync(CACHE_PATH);
      const ageMs = Date.now() - stats.mtimeMs;
      if (ageMs < 120000) {
        const fileContent = fs.readFileSync(CACHE_PATH, "utf8");
        const parsed = JSON.parse(fileContent);
        
        const tags = parsed.tags;
        const questions = parsed.questions.map((q: any) => ({
          ...q,
          created_at: new Date(q.created_at),
          updated_at: new Date(q.updated_at)
        }));
        
        return { tags, questions };
      }
    }
  } catch (e) {
    console.warn("Failed to read FAQ cache:", e);
  }

  const tags = await getFaqTagsFromDb();
  const questions = await getFaqQuestionsFromDb();

  try {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      CACHE_PATH,
      JSON.stringify({ tags, questions, timestamp: Date.now() }),
      "utf8"
    );
  } catch (e) {
    console.warn("Failed to write FAQ cache:", e);
  }

  return { tags, questions };
}
