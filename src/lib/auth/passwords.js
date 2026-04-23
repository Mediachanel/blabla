import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getConnectedPool } from "@/lib/db/mysql";

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  const storedPassword = String(passwordHash);
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return bcrypt.compare(password, storedPassword);
  }
  if (/^[a-f0-9]{64}$/i.test(storedPassword)) {
    const sha256 = crypto.createHash("sha256").update(String(password)).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sha256, "hex"), Buffer.from(storedPassword, "hex"));
  }
  return String(password) === storedPassword;
}

function normalizeLogin(value) {
  return String(value || "").trim();
}

function normalizeDbUser(row) {
  if (!row) return null;
  return {
    id: row.id_ukpd,
    username: String(row.ukpd_id ?? row.id_ukpd),
    nama_ukpd: row.nama_ukpd,
    role: row.role || "ADMIN_UKPD",
    wilayah: row.wilayah,
    passwordHash: row.password
  };
}

export async function findLoginUser(login) {
  const username = normalizeLogin(login);

  const pool = await getConnectedPool();
  const [rows] = await pool.query(
    `SELECT \`id_ukpd\`, \`ukpd_id\`, \`nama_ukpd\`, \`password\`, \`role\`, \`wilayah\`
     FROM \`ukpd\`
     WHERE LOWER(\`nama_ukpd\`) = LOWER(?)
        OR CAST(\`id_ukpd\` AS CHAR) = ?
        OR CAST(\`ukpd_id\` AS CHAR) = ?
     LIMIT 1`,
    [username, username, username]
  );
  return normalizeDbUser(rows[0]);
}
