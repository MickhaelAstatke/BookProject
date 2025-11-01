"use strict";

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const projectRoot = process.cwd();
let envFile = null;

if (fs.existsSync(path.join(projectRoot, ".env"))) {
  envFile = ".env";
} else if (fs.existsSync(path.join(projectRoot, ".env.example"))) {
  envFile = ".env.example";
}

if (envFile) {
  const envPath = path.join(projectRoot, envFile);
  dotenv.config({ path: envPath });

  if (envFile === ".env.example") {
    console.warn(
      "Loaded environment variables from .env.example. For production deployments, copy this file to .env and supply real secrets."
    );
  }
} else {
  console.warn(
    "No .env or .env.example file found. Firebase config will default to empty values."
  );
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
};

function getFirebaseConfig() {
  return { ...firebaseConfig };
}

module.exports = {
  getFirebaseConfig,
};
