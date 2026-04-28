import fs from "node:fs";
import mysql from "mysql2/promise";

function readEnvFile(path) {
  if (!path || !fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberPort(value) {
  const port = Number(value || 3306);
  return Number.isFinite(port) ? port : 3306;
}

function parseHost(value, defaultPort) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const [host, port] = raw.split(":");
  return { host, port: port ? numberPort(port) : defaultPort };
}

function uniqBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getEnvValue(key, fallback) {
  return process.env[key] === undefined ? fallback : process.env[key];
}

readEnvFile(process.argv[2] || ".env.casaos");
readEnvFile(".env");

const defaultPort = numberPort(process.env.MYSQL_PORT);
const connectTimeout = Number(process.env.MYSQL_CONNECT_TIMEOUT_MS || 1500);
const hosts = uniqBy(
  [
    ...splitList(process.env.MYSQL_HOSTS),
    process.env.MYSQL_HOST,
    "mariadb",
    "host.docker.internal",
    "172.17.0.1",
    "172.31.254.56",
    "127.0.0.1",
    "localhost",
    "db",
    "mysql"
  ]
    .map((host) => parseHost(host, defaultPort))
    .filter(Boolean),
  (item) => `${item.host}:${item.port}`
);
const databases = uniqBy(
  [...splitList(process.env.MYSQL_DATABASES), process.env.MYSQL_DATABASE, "si_data", "sisdmk2"].filter(Boolean),
  (item) => item
);
const user = getEnvValue("MYSQL_USER", "root");
const password = getEnvValue("MYSQL_PASSWORD", "");

let lastError = "";
for (const host of hosts) {
  for (const database of databases) {
    const label = `${user}@${host.host}:${host.port}/${database}`;
    try {
      const connection = await mysql.createConnection({
        host: host.host,
        port: host.port,
        user,
        password,
        database,
        connectTimeout
      });
      const [[version]] = await connection.query("SELECT VERSION() AS version, DATABASE() AS database_name");
      const [[ukpd]] = await connection.query("SELECT COUNT(*) AS total FROM `ukpd`");
      const [[pegawai]] = await connection.query("SELECT COUNT(*) AS total FROM `pegawai`");
      await connection.end();
      console.log(`OK ${label}`);
      console.log(`Server: ${version.version}`);
      console.log(`Database: ${version.database_name}`);
      console.log(`ukpd: ${ukpd.total}`);
      console.log(`pegawai: ${pegawai.total}`);
      process.exit(0);
    } catch (error) {
      lastError = `${label} -> ${error.code || error.name}: ${error.message}`;
      console.log(`FAIL ${lastError}`);
    }
  }
}

console.error(`Tidak ada koneksi MySQL yang berhasil. Terakhir: ${lastError || "tidak ada kandidat"}`);
process.exit(1);
