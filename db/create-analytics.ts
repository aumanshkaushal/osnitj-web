import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

async function main() {
  console.log("Connecting to database to create analytics tables...");
  const sql = postgres(connectionString!, {
    ssl: "require",
    max: 1,
    prepare: false,
  });

  try {
    console.log("Creating public.analytics_events table if it does not exist...");
    await sql`
      create table if not exists public.analytics_events (
        id uuid primary key default gen_random_uuid(),
        timestamp timestamptz not null default now(),
        session_id uuid not null,
        event_name text not null,
        page text not null,
        metadata jsonb
      );
    `;

    console.log("Creating indexes on public.analytics_events...");
    await sql`
      create index if not exists analytics_events_event_name_idx 
      on public.analytics_events (event_name);
    `;
    await sql`
      create index if not exists analytics_events_timestamp_idx 
      on public.analytics_events (timestamp desc);
    `;
    await sql`
      create index if not exists analytics_events_session_id_idx 
      on public.analytics_events (session_id);
    `;

    console.log("Analytics tables and indexes created successfully!");
  } catch (error) {
    console.error("Database migration failed:", error);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Fatal error during migration:", err);
  process.exit(1);
});
