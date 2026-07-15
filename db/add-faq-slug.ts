import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-"); // replace spaces with hyphens
}

async function main() {
  console.log("Connecting to database...");
  const sql = postgres(connectionString!, {
    ssl: "require",
    max: 1,
    prepare: false,
  });

  try {
    console.log("Adding 'slug' column to faq_questions table...");
    
    // 1. Add slug column as nullable first (to allow existing rows)
    await sql`
      alter table public.faq_questions
      add column if not exists slug text;
    `;

    // 2. Fetch existing questions to populate slugs
    const rows = await sql`
      select id, question from public.faq_questions;
    `;

    console.log(`Found ${rows.length} questions to migrate...`);
    for (const row of rows) {
      let slug = generateSlug(row.question);
      
      // Ensure uniqueness just in case
      let isUnique = false;
      let counter = 0;
      let tempSlug = slug;
      while (!isUnique) {
        const check = await sql`
          select id from public.faq_questions
          where slug = ${tempSlug} and id != ${row.id}
          limit 1;
        `;
        if (check.length === 0) {
          isUnique = true;
          slug = tempSlug;
        } else {
          counter++;
          tempSlug = `${slug}-${counter}`;
        }
      }

      await sql`
        update public.faq_questions
        set slug = ${slug}
        where id = ${row.id};
      `;
    }

    // 3. Make column unique and not null
    await sql`
      alter table public.faq_questions
      alter column slug set not null,
      add constraint faq_questions_slug_unique unique (slug);
    `;

    console.log("Database migration for 'slug' column completed successfully!");
  } catch (error) {
    console.error("Error during database migration:", error);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
