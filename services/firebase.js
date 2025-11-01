"use strict";

const loadEnv = require("../config/loadEnv");

const ENV_SOURCE = loadEnv();
const FIREBASE_WARNING_FLAG = Symbol.for("bookProject.firebaseConfigWarned");

const crypto = require("crypto");

function warnMissingFirebaseConfig() {
  if (global[FIREBASE_WARNING_FLAG]) {
    return;
  }

  const hasClientConfig = Boolean(
    process.env.FIREBASE_API_KEY &&
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_APP_ID
  );

  if (!hasClientConfig) {
    const sourceSuffix = ENV_SOURCE ? ` from ${ENV_SOURCE}` : "";
    console.warn(
      `Firebase client configuration is incomplete${sourceSuffix}. ` +
        "Provide FIREBASE_API_KEY, FIREBASE_PROJECT_ID, and FIREBASE_APP_ID so sign-in works."
    );
    global[FIREBASE_WARNING_FLAG] = true;
  }
}

function decodeBase64Url(input) {
  if (!input) {
    throw new Error("Invalid base64url input");
  }
  let normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  if (padding) {
    normalized += "=".repeat(4 - padding);
  }
  return Buffer.from(normalized, "base64");
}

function getFirebasePublicKeys() {
  if (!process.env.FIREBASE_AUTH_PUBLIC_KEYS) {
    return null;
  }

  try {
    const parsed = JSON.parse(process.env.FIREBASE_AUTH_PUBLIC_KEYS);
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse FIREBASE_AUTH_PUBLIC_KEYS", error);
  }
  return null;
}

async function verifyIdToken(idToken) {
  if (!idToken) {
    throw new Error("No Firebase ID token supplied");
  }

  const [headerPart, payloadPart, signaturePart] = idToken.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error("Malformed Firebase ID token");
  }

  const header = JSON.parse(decodeBase64Url(headerPart).toString("utf8"));
  if (!header.kid) {
    throw new Error("Firebase token header missing key identifier");
  }
  const payload = JSON.parse(decodeBase64Url(payloadPart).toString("utf8"));
  const signature = decodeBase64Url(signaturePart);

  const publicKeys = getFirebasePublicKeys();
  if (!publicKeys) {
    throw new Error("Firebase public keys are not configured");
  }

  const publicKey = publicKeys[header.kid];
  if (!publicKey) {
    throw new Error("Unable to locate Firebase public key for token");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerPart}.${payloadPart}`);
  verifier.end();

  const isValid = verifier.verify(publicKey, signature);
  if (!isValid) {
    throw new Error("Firebase token signature is invalid");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId) {
    const issuer = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== issuer) {
      throw new Error("Firebase token issuer mismatch");
    }
    if (payload.aud !== projectId) {
      throw new Error("Firebase token audience mismatch");
    }
  }

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error("Firebase token has expired");
  }

  return payload;
}

function getClientConfig() {
  warnMissingFirebaseConfig();
  return {
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  };
}

function isClientConfigured() {
  const config = getClientConfig();
  return Boolean(config.apiKey && config.projectId && config.appId);
}

module.exports = {
  verifyIdToken,
  getClientConfig,
  isClientConfigured,
};
