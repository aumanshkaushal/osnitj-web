import postgres from "postgres";
import { hashPassword } from "../lib/auth";

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
    prepare: false,
  });

  try {
    console.log("Creating admin_users table if it doesn't exist...");
    await sql`
      create table if not exists public.admin_users (
        id uuid primary key default gen_random_uuid(),
        username text not null unique,
        password_hash text not null,
        created_at timestamptz not null default now()
      );
    `;

    const username =
      process.argv[2] ||
      process.env.ADMIN_USERNAME ||
      "opensourcenitj@gmail.com";
    const password =
      process.argv[3] || process.env.ADMIN_PASSWORD || "YOUR_NEW_PASSWORD";
    const hashedPassword = hashPassword(password);

    console.log(`Seeding admin user: "${username}"...`);
    await sql`
      insert into public.admin_users (username, password_hash)
      values (${username}, ${hashedPassword})
      on conflict (username) do update
      set password_hash = excluded.password_hash;
    `;

    console.log("\n==================================================");
    console.log("Admin user seeded successfully!");
    console.log("Credentials:");
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log("==================================================\n");
  } catch (error) {
    console.error("Error during database operations:", error);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
