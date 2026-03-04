"use strict";

const express = require("express");
const router = express.Router();

const { requireAuthApi, resolveUserAdminRole, hasAdminPermission } = require("../middleware/auth");

router.get("/me", requireAuthApi, (req, res) => {
  const safeUser = req.user.toSafeJSON ? req.user.toSafeJSON() : req.user.get({ plain: true });
  const role = resolveUserAdminRole(req.user);
  return res.json({
    user: safeUser,
    admin: {
      role,
      canReadMaterials: hasAdminPermission(req.user, "materials:read"),
      canWriteMaterials: hasAdminPermission(req.user, "materials:write"),
      canManageUsers: hasAdminPermission(req.user, "users:manage"),
    },
  });
});

module.exports = router;
