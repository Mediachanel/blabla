import mysql from "mysql2/promise";

export function createPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    dateStrings: true
  });
}

export function hasMysqlConfig() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
}

export function getPool() {
  if (!hasMysqlConfig()) return null;
  if (!globalThis.__sisdmkMysqlPool) {
    globalThis.__sisdmkMysqlPool = createPool();
  }
  return globalThis.__sisdmkMysqlPool;
}
