"use strict";

const express = require("express");
const db = require("../models");
const { requireAdminApi, requireAdminPermission, ADMIN_ROLE_PERMISSIONS } = require("../middleware/auth");

const router = express.Router();

router.get("/api/admin/users", requireAdminApi, requireAdminPermission("users:manage"), async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: ["id", "email", "displayName", "isAdmin", "adminRole", "emailVerified", "lastLoginAt"],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });
    return res.json({ users: users.map((user) => user.get({ plain: true })) });
  } catch (error) {
    console.error("Failed to fetch admin user list", error);
    return res.status(500).json({ error: "Unable to load users" });
  }
});

router.put("/api/admin/users/:id/role", requireAdminApi, requireAdminPermission("users:manage"), async (req, res) => {
  try {
    const role = typeof req.body.adminRole === "string" ? req.body.adminRole.trim().toLowerCase() : "";
    const isAdmin = Boolean(req.body.isAdmin);

    if (isAdmin && !ADMIN_ROLE_PERMISSIONS[role]) {
      return res.status(400).json({ error: "Invalid adminRole" });
    }

    const user = await db.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isAdmin = isAdmin;
    user.adminRole = isAdmin ? role : null;
    await user.save();

    return res.json({
      user: user.get({ plain: true }),
      availableRoles: Object.keys(ADMIN_ROLE_PERMISSIONS),
    });
  } catch (error) {
    console.error("Failed to update admin role", error);
    return res.status(500).json({ error: "Unable to update admin role" });
  }
});

module.exports = router;
