import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "src", "data", "generated", "ukpd.json");
const outputPath = path.join(rootDir, "sql", "ukpd_password_123.sql");
const DEFAULT_PASSWORD_LABEL = "admin123";
const DEFAULT_PASSWORD_HASH = "$2b$10$.VgTG22czHv9lIJUkYiDCuggux2JDK/gsaVxxgnSOajPJnz.G/p6G";

const columns = [
  "id_ukpd",
  "ukpd_id",
  "nama_ukpd",
  "password",
  "jenis_ukpd",
  "role",
  "wilayah",
  "created_at",
];

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function sqlIdentifier(name) {
  return `\`${name}\``;
}

const rows = JSON.parse(await fs.readFile(sourcePath, "utf8"))
  .slice()
  .sort((left, right) => Number(left.id_ukpd) - Number(right.id_ukpd));

const columnSql = columns.map(sqlIdentifier).join(", ");
const valuesSql = rows
  .map((row) => {
    const values = [
      row.id_ukpd,
      row.ukpd_id,
      row.nama_ukpd,
      DEFAULT_PASSWORD_HASH,
      row.jenis_ukpd,
      row.role,
      row.wilayah,
      row.created_at,
    ];
    return `(${values.map(sqlValue).join(", ")})`;
  })
  .join(",\n");

const updateSql = columns
  .filter((column) => column !== "id_ukpd")
  .map((column) => `${sqlIdentifier(column)} = VALUES(${sqlIdentifier(column)})`)
  .join(", ");

const sql = `-- Auto generated on ${new Date().toISOString()}
-- Seed lengkap tabel ukpd dengan password hash bcrypt untuk ${DEFAULT_PASSWORD_LABEL}
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS \`si_data\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`si_data\`;

CREATE TABLE IF NOT EXISTS \`ukpd\` (
  \`id_ukpd\` INT NOT NULL,
  \`ukpd_id\` INT NULL,
  \`nama_ukpd\` VARCHAR(255) NOT NULL,
  \`password\` VARCHAR(255) NULL,
  \`jenis_ukpd\` VARCHAR(100) NULL,
  \`role\` VARCHAR(50) NULL,
  \`wilayah\` VARCHAR(100) NULL,
  \`created_at\` DATE NULL,
  PRIMARY KEY (\`id_ukpd\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`ukpd\` (${columnSql}) VALUES
${valuesSql}
ON DUPLICATE KEY UPDATE ${updateSql};
`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, sql);

console.log(`Generated ${path.relative(rootDir, outputPath)} with ${rows.length} ukpd rows.`);
