"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../models");
const { requireAdminApi, requireAdminPage } = require("../middleware/auth");

const router = express.Router();

const uploadDirectory = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname || "");
    cb(null, `${timestamp}-${random}${extension}`);
  },
});

const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "asset", maxCount: 1 },
]);

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
  }
  return false;
}

function fileUrlFromUpload(file) {
  if (!file) {
    return null;
  }
  return `/uploads/${file.filename}`;
}

function buildMaterialResponse(materialInstance) {
  const material = materialInstance.get({ plain: true });
  if (material.uploader && material.uploader.firebaseUid) {
    delete material.uploader.firebaseUid;
  }
  return material;
}

async function fetchMaterials() {
  const materials = await db.Material.findAll({
    include: [
      { model: db.Author, attributes: ["id", "firstName", "lastName"] },
      { model: db.User, as: "uploader", attributes: ["id", "displayName", "email", "isAdmin"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  return materials.map(buildMaterialResponse);
}

async function fetchAuthors() {
  const authors = await db.Author.findAll({
    attributes: ["id", "firstName", "lastName"],
    order: [
      ["lastName", "ASC"],
      ["firstName", "ASC"],
    ],
  });
  return authors.map((author) => {
    const plain = author.get({ plain: true });
    return {
      ...plain,
      fullName: `${plain.firstName} ${plain.lastName}`,
    };
  });
}

function resolveUploadPath(url) {
  if (!url || !url.startsWith("/uploads/")) {
    return null;
  }
  const fileName = url.replace("/uploads/", "");
  return path.join(uploadDirectory, fileName);
}

async function removeFileIfExists(url) {
  const filePath = resolveUploadPath(url);
  if (!filePath) {
    return;
  }
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Failed to remove upload", filePath, error.message);
    }
  }
}

function validateType(type) {
  const allowedTypes = ["book", "audiobook", "video"];
  const normalized = typeof type === "string" ? type.trim().toLowerCase() : "";
  if (!allowedTypes.includes(normalized)) {
    const error = new Error(`Invalid material type: ${type}`);
    error.status = 400;
    throw error;
  }
  return normalized;
}

function extractMaterialPayload(req, existingMaterial) {
  const title = req.body.title ? req.body.title.trim() : "";
  if (!title) {
    const error = new Error("Title is required");
    error.status = 400;
    throw error;
  }

  const authorId = parseInt(req.body.AuthorId, 10);
  if (Number.isNaN(authorId)) {
    const error = new Error("An author must be selected");
    error.status = 400;
    throw error;
  }

  const type = validateType(req.body.type);
  const description = req.body.description ? req.body.description.trim() : null;
  const isPremium = normalizeBoolean(req.body.isPremium);

  const thumbnailFile = req.files && Array.isArray(req.files.thumbnail) ? req.files.thumbnail[0] : null;
  const assetFile = req.files && Array.isArray(req.files.asset) ? req.files.asset[0] : null;

  const bodyThumbnailUrl = req.body.thumbnailUrl ? req.body.thumbnailUrl.trim() : null;
  const bodyAssetUrl = req.body.assetUrl ? req.body.assetUrl.trim() : null;

  const thumbnailUrl = thumbnailFile
    ? fileUrlFromUpload(thumbnailFile)
    : bodyThumbnailUrl || (existingMaterial ? existingMaterial.thumbnailUrl : null);

  const assetUrl = assetFile
    ? fileUrlFromUpload(assetFile)
    : bodyAssetUrl || (existingMaterial ? existingMaterial.assetUrl : null);

  if (!assetUrl) {
    const error = new Error("An asset file or URL is required");
    error.status = 400;
    throw error;
  }

  const uploaderId = existingMaterial ? existingMaterial.UserId : req.user.id;

  return {
    title,
    type,
    description,
    thumbnailUrl,
    assetUrl,
    isPremium,
    AuthorId: authorId,
    UserId: uploaderId,
  };
}

router.get("/admin/materials", requireAdminPage, async (req, res, next) => {
  try {
    const [materials, authors] = await Promise.all([fetchMaterials(), fetchAuthors()]);
    res.render("admin/materials", {
      pageTitle: "Manage Materials",
      materials,
      authors,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/api/admin/materials", requireAdminApi, async (req, res, next) => {
  try {
    const materials = await fetchMaterials();
    res.json({ materials });
  } catch (error) {
    next(error);
  }
});

router.post("/api/admin/materials", requireAdminApi, uploadFields, async (req, res, next) => {
  try {
    const payload = extractMaterialPayload(req, null);
    payload.UserId = req.user.id;
    const material = await db.Material.create(payload);
    const created = await db.Material.findByPk(material.id, {
      include: [
        { model: db.Author, attributes: ["id", "firstName", "lastName"] },
        { model: db.User, as: "uploader", attributes: ["id", "displayName", "email", "isAdmin"] },
      ],
    });
    res.status(201).json({ material: buildMaterialResponse(created) });
  } catch (error) {
    if (req.files) {
      const uploadedThumbnail = req.files.thumbnail && req.files.thumbnail[0];
      const uploadedAsset = req.files.asset && req.files.asset[0];
      const cleanupTasks = [];
      if (uploadedThumbnail) {
        cleanupTasks.push(removeFileIfExists(fileUrlFromUpload(uploadedThumbnail)));
      }
      if (uploadedAsset) {
        cleanupTasks.push(removeFileIfExists(fileUrlFromUpload(uploadedAsset)));
      }
      await Promise.all(cleanupTasks);
    }
    if (!error.status) {
      console.error("Failed to create material", error);
    }
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Failed to create material" });
  }
});

router.put("/api/admin/materials/:id", requireAdminApi, uploadFields, async (req, res, next) => {
  try {
    const material = await db.Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    const existingValues = material.get({ plain: true });
    const payload = extractMaterialPayload(req, existingValues);

    const oldThumbnail = existingValues.thumbnailUrl;
    const oldAsset = existingValues.assetUrl;

    await material.update(payload);
    if (payload.thumbnailUrl !== oldThumbnail) {
      await removeFileIfExists(oldThumbnail);
    }
    if (payload.assetUrl !== oldAsset) {
      await removeFileIfExists(oldAsset);
    }
    const refreshed = await db.Material.findByPk(material.id, {
      include: [
        { model: db.Author, attributes: ["id", "firstName", "lastName"] },
        { model: db.User, as: "uploader", attributes: ["id", "displayName", "email", "isAdmin"] },
      ],
    });
    res.json({ material: buildMaterialResponse(refreshed) });
  } catch (error) {
    if (req.files) {
      const uploadedThumbnail = req.files.thumbnail && req.files.thumbnail[0];
      const uploadedAsset = req.files.asset && req.files.asset[0];
      const cleanupTasks = [];
      if (uploadedThumbnail) {
        cleanupTasks.push(removeFileIfExists(fileUrlFromUpload(uploadedThumbnail)));
      }
      if (uploadedAsset) {
        cleanupTasks.push(removeFileIfExists(fileUrlFromUpload(uploadedAsset)));
      }
      await Promise.all(cleanupTasks);
    }
    if (!error.status) {
      console.error("Failed to update material", error);
    }
    const status = error.status || 500;
    res.status(status).json({ error: error.message || "Failed to update material" });
  }
});

router.delete("/api/admin/materials/:id", requireAdminApi, async (req, res, next) => {
  try {
    const material = await db.Material.findByPk(req.params.id);
    if (!material) {
      return res.status(404).json({ error: "Material not found" });
    }

    const values = material.get({ plain: true });
    await material.destroy();
    await Promise.all([removeFileIfExists(values.thumbnailUrl), removeFileIfExists(values.assetUrl)]);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete material", error);
    res.status(500).json({ error: "Failed to delete material" });
  }
});

module.exports = router;
