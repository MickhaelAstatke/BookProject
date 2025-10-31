"use strict";

const express = require("express");
const router = express.Router();

const { requireAuthApi } = require("../middleware/auth");

router.get("/me", requireAuthApi, (req, res) => {
  const safeUser = req.user.toSafeJSON ? req.user.toSafeJSON() : req.user.get({ plain: true });
  return res.json({ user: safeUser });
});

module.exports = router;
