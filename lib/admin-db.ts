import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

const sql = connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 1,
      prepare: false,
    })
  : null;

export type AdminUser = {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
};

/**
 * Get an admin user by username from the database.
 */
export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const rows = await sql`
    select id, username, password_hash, created_at
    from public.admin_users
    where username = ${username}
    limit 1
  `;

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    username: rows[0].username,
    password_hash: rows[0].password_hash,
    created_at: new Date(rows[0].created_at),
  };
}
