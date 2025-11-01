"use strict";

const fs = require("fs");
const path = require("path");
const CANDIDATE_FILES = [".env", ".env.local", ".env.development", ".env.example"];
const ENV_SOURCE_FLAG = Symbol.for("bookProject.envSource");

function parseEnv(content) {
  const result = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function getCachedEnvSource() {
  if (Object.prototype.hasOwnProperty.call(global, ENV_SOURCE_FLAG)) {
    return global[ENV_SOURCE_FLAG];
  }
  return undefined;
}

function loadEnv() {
  const cached = getCachedEnvSource();
  if (typeof cached !== "undefined") {
    return cached;
  }

  const projectRoot = path.resolve(__dirname, "..");

  for (const filename of CANDIDATE_FILES) {
    const filePath = path.join(projectRoot, filename);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const parsed = parseEnv(content);
    Object.keys(parsed).forEach((key) => {
      if (typeof process.env[key] === "undefined") {
        process.env[key] = parsed[key];
      }
    });

    if (filename === ".env.example") {
      console.warn(
        "Loaded environment variables from .env.example. " +
          "For production deployments, copy this file to .env and supply real secrets."
      );
    }

    global[ENV_SOURCE_FLAG] = filename;
    return filename;
  }

  console.warn(
    "No environment file found. Ensure Firebase keys are supplied via process.env before starting the server."
  );
  global[ENV_SOURCE_FLAG] = null;
  return null;
}

module.exports = loadEnv;
