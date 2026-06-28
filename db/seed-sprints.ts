import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

async function main() {
  console.log("Connecting to database...");
  const sql = postgres(connectionString!, {
    ssl: "require",
    max: 1,
  });

  try {
    // 1. Create Sprints Tables
    console.log("Creating public.sprints table...");
    await sql`
      create table if not exists public.sprints (
        id uuid primary key default gen_random_uuid(),
        sprint_number integer not null unique,
        start_date timestamptz not null,
        end_date timestamptz not null,
        status text not null check (status in ('retro', 'active', 'upcoming')),
        retro_notes text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `;

    console.log("Creating public.sprint_projects table...");
    await sql`
      create table if not exists public.sprint_projects (
        id uuid primary key default gen_random_uuid(),
        sprint_id uuid references public.sprints(id) on delete cascade,
        project_name text not null,
        github_repo text not null,
        created_at timestamptz not null default now()
      );
    `;

    console.log("Creating public.sprint_tasks table...");
    await sql`
      create table if not exists public.sprint_tasks (
        id uuid primary key default gen_random_uuid(),
        project_id uuid references public.sprint_projects(id) on delete cascade,
        task_text text not null,
        status text not null check (status in ('completed', 'carried-forward', 'rejected', 'pending', 'in-progress')),
        pr_link text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `;

    await sql`
      create index if not exists sprints_number_idx on public.sprints (sprint_number desc);
    `;

    // 2. Clear old dummy records to reset cleanly
    console.log("Clearing old sprint records...");
    await sql`truncate public.sprints, public.sprint_projects, public.sprint_tasks cascade;`;

    // 3. Seed Sprint #1
    console.log("Seeding Sprint #1 (Retrospective)...");
    const [sprint1] = await sql`
      insert into public.sprints (sprint_number, start_date, end_date, status, retro_notes)
      values (1, '2026-06-21T00:00:00Z', '2026-06-27T23:59:59Z', 'retro', 'First successful ship cycle of osnitj workspaces.')
      returning id;
    `;

    const projects1 = [
      { name: "asknitj", repo: "asknitj", tasks: [
        { text: "initial core search setup", status: "completed" },
        { text: "integrate context formatting parser", status: "completed" }
      ]},
      { name: "guessr", repo: "guessr", tasks: [
        { text: "setup basic routing & map views", status: "completed" },
        { text: "implement location guess validation", status: "completed" }
      ]},
      { name: "osnitj-web", repo: "osnitj-web", tasks: [
        { text: "make admin panel base & auth", status: "completed" },
        { text: "seed default admin user credentials", status: "completed" },
        { text: "rename all blog instances to dispatch", status: "completed" }
      ]}
    ];

    for (const p of projects1) {
      const [proj] = await sql`
        insert into public.sprint_projects (sprint_id, project_name, github_repo)
        values (${sprint1.id}, ${p.name}, ${p.repo})
        returning id;
      `;
      for (const t of p.tasks) {
        await sql`
          insert into public.sprint_tasks (project_id, task_text, status)
          values (${proj.id}, ${t.text}, ${t.status});
        `;
      }
    }

    // 4. Seed Sprint #2
    console.log("Seeding Sprint #2 (Active)...");
    const [sprint2] = await sql`
      insert into public.sprints (sprint_number, start_date, end_date, status)
      values (2, '2026-06-28T00:00:00Z', '2026-07-04T23:59:59Z', 'active')
      returning id;
    `;

    const projects2 = [
      { name: "asknitj", repo: "asknitj", tasks: [
        { text: "refine context calls", status: "in-progress" },
        { text: "give structured data in the form of messages in chatCompletions for commentThreads and dMThreads", status: "pending" }
      ]},
      { name: "guessr", repo: "guessr", tasks: [
        { text: "make the game playable by completing photo mode", status: "in-progress" }
      ]},
      { name: "osnitj-web", repo: "osnitj-web", tasks: [
        { text: "add sprints section to website", status: "completed" }
      ]}
    ];

    for (const p of projects2) {
      const [proj] = await sql`
        insert into public.sprint_projects (sprint_id, project_name, github_repo)
        values (${sprint2.id}, ${p.name}, ${p.repo})
        returning id;
      `;
      for (const t of p.tasks) {
        await sql`
          insert into public.sprint_tasks (project_id, task_text, status)
          values (${proj.id}, ${t.text}, ${t.status});
        `;
      }
    }

    // 5. Seed Sprint #3
    console.log("Seeding Sprint #3 (Upcoming)...");
    await sql`
      insert into public.sprints (sprint_number, start_date, end_date, status)
      values (3, '2026-07-05T00:00:00Z', '2026-07-11T23:59:59Z', 'upcoming');
    `;

    console.log("Sprint tables successfully created and seeded!");
  } catch (error) {
    console.error("Database Seeding Error:", error);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
