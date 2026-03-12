"use strict";

const crypto = require("crypto");
const https = require("https");

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

// Cache settings
const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MIN_REFRESH_INTERVAL_MS = 60 * 1000; // don't spam endpoint
const CACHE_TTL_MS = Number.isFinite(Number(process.env.FIREBASE_PUBLIC_KEYS_CACHE_TTL_MS))
  ? Number(process.env.FIREBASE_PUBLIC_KEYS_CACHE_TTL_MS)
  : DEFAULT_CACHE_TTL_MS;

let cachedKeys = null; // object: { kid: certPemString }
let cachedAtMs = 0;
let lastFetchAttemptMs = 0;
let inFlightFetch = null;

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

function parseEnvPublicKeys() {
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

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            // Google endpoint sometimes uses cache headers; accept json.
            Accept: "application/json",
          },
        },
        (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error("Failed to parse Firebase certs JSON"));
              }
              return;
            }
            reject(
              new Error(
                `Failed to fetch Firebase public keys (HTTP ${res.statusCode || "unknown"})`
              )
            );
          });
        }
      )
      .on("error", reject);
  });
}

function isCacheFresh() {
  return cachedKeys && Date.now() - cachedAtMs < CACHE_TTL_MS;
}

async function fetchAndCacheKeys(force = false) {
  const now = Date.now();
  if (!force && isCacheFresh()) {
    return cachedKeys;
  }

  // Throttle repeated attempts
  if (!force && now - lastFetchAttemptMs < MIN_REFRESH_INTERVAL_MS && cachedKeys) {
    return cachedKeys;
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  lastFetchAttemptMs = now;
  inFlightFetch = (async () => {
    try {
      const keys = await httpsGetJson(CERTS_URL);
      if (!keys || typeof keys !== "object" || Object.keys(keys).length === 0) {
        throw new Error("Firebase certs endpoint returned no keys");
      }
      cachedKeys = keys;
      cachedAtMs = Date.now();
      return cachedKeys;
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

async function getFirebasePublicKeys(options = {}) {
  const envOverride = parseEnvPublicKeys();
  if (envOverride) {
    // If the user provided keys explicitly, prefer those (keeps old behavior)
    return envOverride;
  }

  // Otherwise fetch and cache from Google
  return fetchAndCacheKeys(Boolean(options.forceRefresh));
}

function isServerAuthConfigured() {
  // configured if either env override exists OR we have enough to validate issuer/audience
  // (keys will be fetched on demand)
  return Boolean(parseEnvPublicKeys() || process.env.FIREBASE_PROJECT_ID);
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

  // First attempt using cached/override keys
  let publicKeys = await getFirebasePublicKeys();
  let publicKey = publicKeys ? publicKeys[header.kid] : null;

  // If key not found (rotation), force refresh once (only if not using env override)
  const usingEnvOverride = Boolean(parseEnvPublicKeys());
  if (!publicKey && !usingEnvOverride) {
    publicKeys = await getFirebasePublicKeys({ forceRefresh: true });
    publicKey = publicKeys ? publicKeys[header.kid] : null;
  }

  if (!publicKeys) {
    throw new Error("Firebase public keys are not configured");
  }
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
  return Boolean(config.apiKey && config.projectId && config.appId && config.authDomain);
}

module.exports = {
  verifyIdToken,
  getClientConfig,
  isClientConfigured,
  isServerAuthConfigured,
};