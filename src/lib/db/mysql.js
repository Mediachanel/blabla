import mysql from "mysql2/promise";

function numberPort(value) {
  const port = Number(value || 3306);
  return Number.isFinite(port) ? port : 3306;
}

function getEnvValue(key, fallback) {
  return process.env[key] === undefined ? fallback : process.env[key];
}

function getRequiredProductionEnvValue(key, fallback) {
  const value = getEnvValue(key, fallback);
  const allowEmptyMysqlPassword = key === "MYSQL_PASSWORD" && process.env.ALLOW_EMPTY_MYSQL_PASSWORD === "true";
  if (process.env.NODE_ENV === "production" && !allowEmptyMysqlPassword && String(value || "") === "") {
    throw new Error(`${key} wajib diset di production.`);
  }
  return value;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseHostCandidate(value, defaultPort) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const [host, port] = raw.split(":");
  return {
    host,
    port: port ? numberPort(port) : defaultPort
  };
}

export function getMysqlDatabaseCandidates() {
  const configuredDatabases = [
    ...splitList(process.env.MYSQL_DATABASES),
    process.env.MYSQL_DATABASE
  ];
  const fallbackDatabases = ["si_data"];
  const seen = new Set();

  return [...configuredDatabases, ...fallbackDatabases]
    .map((database) => String(database || "").trim())
    .filter(Boolean)
    .filter((database) => database.toLowerCase() !== "sisdmk2")
    .filter((database) => {
      if (seen.has(database)) return false;
      seen.add(database);
      return true;
    });
}

export function getMysqlCandidates() {
  const defaultPort = numberPort(process.env.MYSQL_PORT);
  const configuredHosts = [
    ...splitList(process.env.MYSQL_HOSTS),
    process.env.MYSQL_HOST
  ];
  const fallbackHosts = [
    "mariadb",
    "host.docker.internal",
    "172.17.0.1",
    "172.31.254.56",
    "127.0.0.1",
    "localhost",
    "db",
    "mysql",
  ];
  const seen = new Set();

  return [...configuredHosts, ...fallbackHosts]
    .map((host) => parseHostCandidate(host, defaultPort))
    .filter(Boolean)
    .filter((candidate) => {
      const key = `${candidate.host}:${candidate.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function createPool(config = {}) {
  return mysql.createPool({
    host: config.host === undefined ? getRequiredProductionEnvValue("MYSQL_HOST", "127.0.0.1") : config.host,
    port: numberPort(config.port || process.env.MYSQL_PORT),
    user: getRequiredProductionEnvValue("MYSQL_USER", "root"),
    password: getRequiredProductionEnvValue("MYSQL_PASSWORD", ""),
    database: config.database === undefined ? getRequiredProductionEnvValue("MYSQL_DATABASE", "si_data") : config.database,
    connectTimeout: numberPort(process.env.MYSQL_CONNECT_TIMEOUT_MS || 1500),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    dateStrings: true
  });
}

export function hasMysqlConfig() {
  return true;
}

export function getPool() {
  if (!hasMysqlConfig()) return null;
  if (!globalThis.__sisdmkMysqlPool) {
    globalThis.__sisdmkMysqlPool = createPool();
  }
  return globalThis.__sisdmkMysqlPool;
}

function getPoolMap() {
  if (!globalThis.__sisdmkMysqlPools) globalThis.__sisdmkMysqlPools = new Map();
  return globalThis.__sisdmkMysqlPools;
}

function clearGlobalPoolReference(pool, key) {
  if (globalThis.__sisdmkMysqlPool === pool) {
    globalThis.__sisdmkMysqlPool = null;
  }
  if (!key || globalThis.__sisdmkMysqlHost === key) {
    globalThis.__sisdmkMysqlHost = null;
  }
}

function isPoolClosed(pool) {
  return Boolean(pool?._closed || pool?.pool?._closed);
}

async function disposePool(pools, key, pool) {
  pools.delete(key);
  clearGlobalPoolReference(pool, key);
  await pool.end().catch(() => {});
}

export function isClosedConnectionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("closed state") || message.includes("pool is closed") || message.includes("connection is closed");
}

export async function resetMysqlPools() {
  const pools = getPoolMap();
  const entries = [...pools.entries()];
  pools.clear();
  globalThis.__sisdmkMysqlPool = null;
  globalThis.__sisdmkMysqlHost = null;
  await Promise.all(entries.map(([, pool]) => pool.end().catch(() => {})));
}

export async function getConnectedPool() {
  if (!hasMysqlConfig()) return null;

  const candidates = getMysqlCandidates();
  const databases = getMysqlDatabaseCandidates();
  const pools = getPoolMap();
  let lastError = "";

  for (const candidate of candidates) {
    for (const database of databases) {
      const key = `${candidate.host}:${candidate.port}/${database}`;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        let pool = pools.get(key);
        if (pool && isPoolClosed(pool)) {
          pools.delete(key);
          clearGlobalPoolReference(pool, key);
          pool = null;
        }
        if (!pool) {
          pool = createPool({ ...candidate, database });
          pools.set(key, pool);
        }

        try {
          await pool.query("SELECT 1");
          globalThis.__sisdmkMysqlPool = pool;
          globalThis.__sisdmkMysqlHost = key;
          return pool;
        } catch (error) {
          lastError = `host=${key} -> ${error.message}`;
          await disposePool(pools, key, pool);
          if (attempt === 0) {
            continue;
          }
        }
      }
    }
  }

  throw new Error(`Koneksi DB gagal. Terakhir mencoba: ${lastError || "tidak ada host yang dicoba"}`);
}
