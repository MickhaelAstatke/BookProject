"use strict";

function parseNumber(value, fallback) {
  if (typeof value === "undefined" || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const development = {
  username: process.env.DB_USER || "root",
  password: typeof process.env.DB_PASSWORD === "undefined" ? "yomk2005" : process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "bookstore",
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseNumber(process.env.DB_PORT, 3306),
  dialect: "mysql",
};

module.exports = {
  development,
  test: {
    username: process.env.TEST_DB_USER || development.username,
    password:
      typeof process.env.TEST_DB_PASSWORD === "undefined"
        ? development.password
        : process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME || "database_test",
    host: process.env.TEST_DB_HOST || development.host,
    port: parseNumber(process.env.TEST_DB_PORT, development.port),
    dialect: "mysql",
  },
  production: {
    use_env_variable: "JAWSDB_URL",
    dialect: "mysql",
  },
};
