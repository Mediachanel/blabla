import fs from "node:fs";
import pg from "pg";

function numberPort(value) {
  const port = Number(value || 5432);
  return Number.isFinite(port) ? port : 5432;
}

function loadEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(process.argv[2] || ".env");

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || process.env.PGHOST || "localhost",
  port: numberPort(process.env.POSTGRES_PORT || process.env.PGPORT),
  user: process.env.POSTGRES_USER || process.env.PGUSER || "postgres",
  password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || "",
  database: process.env.POSTGRES_DATABASE || process.env.PGDATABASE || "si_data",
  connectionTimeoutMillis: numberPort(process.env.POSTGRES_CONNECT_TIMEOUT_MS || 1500)
});

try {
  const result = await pool.query("SELECT current_database() AS database, current_user AS user");
  const row = result.rows[0];
  console.log(`PostgreSQL tersambung: database=${row.database}, user=${row.user}`);
} finally {
  await pool.end();
}
