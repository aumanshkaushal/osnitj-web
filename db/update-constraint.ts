import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

async function main() {
  console.log("Connecting to database to update constraints...");
  const sql = postgres(connectionString!, {
    ssl: "require",
    max: 1,
    prepare: false,
  });

  try {
    console.log("Altering sprints table (removing status constraint and column)...");
    // Since we now determine status dynamically based on dates, we can either ignore the status column or drop the constraint.
    // Let's drop the status check constraint on sprints so it can hold anything, or just keep start_date/end_date as source of truth.
    await sql`
      alter table public.sprints drop constraint if exists sprints_status_check;
    `;

    console.log("Altering sprint_tasks status constraint...");
    await sql`
      alter table public.sprint_tasks drop constraint if exists sprint_tasks_status_check;
    `;
    await sql`
      alter table public.sprint_tasks add constraint sprint_tasks_status_check 
      check (status in ('completed', 'carried-forward', 'rejected', 'pending', 'in-progress'));
    `;

    console.log("Database constraints updated successfully!");
  } catch (error) {
    console.error("Database constraint migration failed:", error);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
