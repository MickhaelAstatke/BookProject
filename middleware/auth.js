"use strict";

const db = require("../models");
const firebaseService = require("../services/firebase");

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((accumulator, pair) => {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) {
      return accumulator;
    }
    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (!key) {
      return accumulator;
    }
    try {
      accumulator[key] = decodeURIComponent(value);
    } catch (error) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function extractToken(req) {
  const authHeader = req.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  const cookies = parseCookies(req.get("cookie"));
  if (cookies.__session) {
    return cookies.__session;
  }

  return null;
}

function parseBooleanHeader(value) {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

async function resolveMockUser(req) {
  if (process.env.ALLOW_MOCK_AUTH !== "true") {
    return null;
  }

  const mockIdentity = req.get("x-mock-user");
  if (!mockIdentity) {
    return null;
  }

  const [user] = await db.User.findOrCreate({
    where: { firebaseUid: `mock-${mockIdentity}` },
    defaults: {
      email: mockIdentity.includes("@") ? mockIdentity : null,
      displayName: mockIdentity,
      guardianName: mockIdentity,
      subscriptionStatus: "trial",
      subscriptionPlan: "free",
    },
  });
  const isAdminHeader = parseBooleanHeader(req.get("x-mock-admin"));
  if (isAdminHeader !== user.isAdmin) {
    user.isAdmin = isAdminHeader;
    await user.save();
  }
  return user;
}

async function upsertFirebaseUser(payload) {
  const firebaseUid = payload.sub || payload.user_id;
  if (!firebaseUid) {
    throw new Error("Firebase token payload missing subject");
  }

  const [user] = await db.User.findOrCreate({
    where: { firebaseUid },
    defaults: {
      email: payload.email || null,
      displayName: payload.name || payload.email || "Guardian",
      guardianName: payload.name || payload.email || "Guardian",
      subscriptionStatus: "trial",
      subscriptionPlan: "free",
    },
  });

  let hasChanges = false;
  const adminRolesClaim = payload["https://hasura.io/jwt/claims"];
  const allowedRoles =
    adminRolesClaim &&
    typeof adminRolesClaim === "object" &&
    Array.isArray(adminRolesClaim["x-hasura-allowed-roles"])
      ? adminRolesClaim["x-hasura-allowed-roles"]
      : [];
  const rolesIncludeAdmin =
    (Array.isArray(payload.roles) && payload.roles.includes("admin")) ||
    allowedRoles.includes("admin");
  const adminClaim = Boolean(payload.admin || payload.isAdmin || rolesIncludeAdmin);

  const hasExplicitBooleanClaim =
    Object.prototype.hasOwnProperty.call(payload, "admin") ||
    Object.prototype.hasOwnProperty.call(payload, "isAdmin");

  if (adminClaim && !user.isAdmin) {
    user.isAdmin = true;
    hasChanges = true;
  } else if (hasExplicitBooleanClaim && !adminClaim && user.isAdmin) {
    user.isAdmin = false;
    hasChanges = true;
  }
  if (payload.email && user.email !== payload.email) {
    user.email = payload.email;
    hasChanges = true;
  }
  if (payload.name && user.displayName !== payload.name) {
    user.displayName = payload.name;
    if (!user.guardianName) {
      user.guardianName = payload.name;
    }
    hasChanges = true;
  }

  if (hasChanges) {
    await user.save();
  }

  return user;
}

async function authenticateRequest(req, res, next) {
  res.locals.currentUser = null;
  req.user = null;
  req.authError = null;

  try {
    const mockUser = await resolveMockUser(req);
    if (mockUser) {
      req.user = mockUser;
      res.locals.currentUser = mockUser.toSafeJSON ? mockUser.toSafeJSON() : mockUser.get({ plain: true });
      return next();
    }

    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const payload = await firebaseService.verifyIdToken(token);
    const user = await upsertFirebaseUser(payload);
    req.user = user;
    res.locals.currentUser = user.toSafeJSON ? user.toSafeJSON() : user.get({ plain: true });
    return next();
  } catch (error) {
    console.warn("Authentication error", error.message);
    req.authError = error;
    return next();
  }
}

function requireAuthApi(req, res, next) {
  if (req.user) {
    return next();
  }

  const message = req.authError
    ? "Invalid or expired authentication token"
    : "Authentication required";
  return res.status(401).json({ error: message });
}

function requireAuthPage(req, res, next) {
  if (req.user) {
    return next();
  }

  if (req.method && req.method.toUpperCase() !== "GET") {
    return res.status(401).send("Authentication required");
  }

  const redirectUrl = req.originalUrl && req.originalUrl !== "/"
    ? `/?authRequired=true&next=${encodeURIComponent(req.originalUrl)}`
    : "/?authRequired=true";
  return res.redirect(redirectUrl);
}

function requireAdminApi(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  if (!req.user) {
    return requireAuthApi(req, res, next);
  }

  return res.status(403).json({ error: "Administrator access required" });
}

function requireAdminPage(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  if (!req.user) {
    return requireAuthPage(req, res, next);
  }

  if (req.accepts("html")) {
    res.status(403);
    return res.render("error", {
      message: "Administrator access required",
      status: 403,
    });
  }

  return res.status(403).send("Administrator access required");
}

module.exports = {
  authenticateRequest,
  requireAuthApi,
  requireAuthPage,
  requireAdminApi,
  requireAdminPage,
};
