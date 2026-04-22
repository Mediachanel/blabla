import bcrypt from "bcryptjs";
import { users } from "@/data/mock";
import { getConnectedPool, hasMysqlConfig } from "@/lib/db/mysql";

const DEMO_PASSWORD = "password123";

export const loginUsers = users.map((user) => ({
  ...user,
  passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10)
}));

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  const storedPassword = String(passwordHash);
  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
    return bcrypt.compare(password, storedPassword);
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

  if (hasMysqlConfig()) {
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

  return loginUsers.find(
    (item) => item.username === username || item.nama_ukpd.toLowerCase() === username.toLowerCase()
  );
}
