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
  });

  try {
    // 1. Create the admin_users table if it doesn't exist
    console.log("Creating admin_users table (if it doesn't exist)...");
    await sql`
      create table if not exists public.admin_users (
        id uuid primary key default gen_random_uuid(),
        username text not null unique,
        password_hash text not null,
        created_at timestamptz not null default now()
      );
    `;
    console.log("admin_users table is ready.");

    // 2. Check if an admin already exists
    const existingAdmins = await sql`
      select id, username from public.admin_users limit 1;
    `;

    if (existingAdmins.length > 0) {
      console.log(`Database already has admin user(s). First admin: "${existingAdmins[0].username}"`);
      console.log("Skipping default admin seeding to prevent overwrites.");
    } else {
      // 3. Seed with a default admin user
      const defaultUsername = "admin";
      const defaultPassword = "admin_nitj_2026";
      const hashedPassword = hashPassword(defaultPassword);

      console.log(`Seeding default admin user: "${defaultUsername}"...`);
      await sql`
        insert into public.admin_users (username, password_hash)
        values (${defaultUsername}, ${hashedPassword});
      `;
      console.log("\n==================================================");
      console.log("Admin user seeded successfully!");
      console.log("Credentials:");
      console.log(`  Username: ${defaultUsername}`);
      console.log(`  Password: ${defaultPassword}`);
      console.log("==================================================\n");
    }
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
