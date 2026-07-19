import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

const globalForPostgres = global as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

export const sql =
  globalForPostgres.sql ??
  (connectionString
    ? postgres(connectionString, {
        ssl: "require",
        max: 8,
        prepare: false,
        connect_timeout: 10,
        idle_timeout: 15,
      })
    : null);

if (process.env.NODE_ENV !== "production") {
  if (sql) globalForPostgres.sql = sql;
}
