"use strict";

const express = require("express");
const router = express.Router();

const db = require("../models");
const { requireAuthApi } = require("../middleware/auth");

const SUBSCRIPTION_STATUSES = ["inactive", "trial", "active", "past_due", "canceled"];

router.use(requireAuthApi);

function sanitizeUser(userInstance) {
  const user = userInstance.toSafeJSON ? userInstance.toSafeJSON() : userInstance.get({ plain: true });
  if (user.children && Array.isArray(user.children)) {
    user.children = user.children.map((child) => (child && typeof child.get === "function" ? child.get({ plain: true }) : child));
  }
  if (user.subscriptions && Array.isArray(user.subscriptions)) {
    user.subscriptions = user.subscriptions.map((subscription) =>
      subscription && typeof subscription.get === "function" ? subscription.get({ plain: true }) : subscription
    );
  }
  if (user.readingProgress && Array.isArray(user.readingProgress)) {
    user.readingProgress = user.readingProgress.map((progress) =>
      progress && typeof progress.get === "function" ? progress.get({ plain: true }) : progress
    );
  }
  return user;
}

router.get("/", async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      include: [
        { model: db.ChildProfile, as: "children" },
        {
          model: db.Subscription,
          as: "subscriptions",
          separate: true,
          order: [["updatedAt", "DESC"]],
        },
        {
          model: db.ReadingProgress,
          as: "readingProgress",
          include: [
            { model: db.Book, as: "book", attributes: ["id", "title"] },
            { model: db.ChildProfile, as: "childProfile", attributes: ["id", "firstName", "lastName"] },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Failed to load account", error);
    return res.status(500).json({ error: "Unable to load account information" });
  }
});

router.put("/", async (req, res) => {
  try {
    const {
      guardianName,
      billingEmail,
      billingPhone,
      subscriptionPlan,
      subscriptionStatus,
      subscriptionRenewalDate,
      paymentMethod,
      billingReference,
    } = req.body;

    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (guardianName !== undefined) {
      user.guardianName = guardianName && guardianName.trim() ? guardianName.trim() : null;
    }
    if (billingEmail !== undefined) {
      user.billingEmail = billingEmail && billingEmail.trim() ? billingEmail.trim() : null;
    }
    if (billingPhone !== undefined) {
      user.billingPhone = billingPhone && billingPhone.trim() ? billingPhone.trim() : null;
    }
    if (subscriptionPlan !== undefined) {
      user.subscriptionPlan = subscriptionPlan && subscriptionPlan.trim() ? subscriptionPlan.trim() : "free";
    }
    if (subscriptionStatus !== undefined) {
      if (!SUBSCRIPTION_STATUSES.includes(subscriptionStatus)) {
        return res.status(400).json({ error: "Invalid subscriptionStatus" });
      }
      user.subscriptionStatus = subscriptionStatus;
    }
    if (subscriptionRenewalDate !== undefined) {
      if (subscriptionRenewalDate) {
        const parsedDate = new Date(subscriptionRenewalDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: "Invalid subscriptionRenewalDate" });
        }
        user.subscriptionRenewalDate = parsedDate;
      } else {
        user.subscriptionRenewalDate = null;
      }
    }

    await user.save();

    const normalizedPaymentMethod = paymentMethod && paymentMethod.trim() ? paymentMethod : null;
    const normalizedBillingReference = billingReference && billingReference.trim() ? billingReference : null;

    if (
      subscriptionPlan !== undefined ||
      subscriptionStatus !== undefined ||
      subscriptionRenewalDate !== undefined ||
      paymentMethod !== undefined ||
      billingReference !== undefined
    ) {
      const [subscription] = await db.Subscription.findOrCreate({
        where: { UserId: user.id },
        defaults: {
          planName: subscriptionPlan || user.subscriptionPlan,
          status: subscriptionStatus || user.subscriptionStatus,
          renewalDate: user.subscriptionRenewalDate,
          paymentMethod: normalizedPaymentMethod,
          billingReference: normalizedBillingReference,
          UserId: user.id,
        },
      });

      let hasChanges = false;
      if (subscriptionPlan !== undefined) {
        subscription.planName = subscriptionPlan;
        hasChanges = true;
      }
      if (subscriptionStatus !== undefined) {
        subscription.status = subscriptionStatus;
        hasChanges = true;
      }
      if (subscriptionRenewalDate !== undefined) {
        subscription.renewalDate = user.subscriptionRenewalDate;
        hasChanges = true;
      }
      if (paymentMethod !== undefined) {
        subscription.paymentMethod = normalizedPaymentMethod;
        hasChanges = true;
      }
      if (billingReference !== undefined) {
        subscription.billingReference = normalizedBillingReference;
        hasChanges = true;
      }

      if (hasChanges) {
        await subscription.save();
      }
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Failed to update account", error);
    if (error.name === "SequelizeValidationError") {
      const message = error.errors && error.errors.length ? error.errors[0].message : "Validation error";
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Unable to update account" });
  }
});

router.post("/children", async (req, res) => {
  try {
    const { firstName, lastName, birthdate, readingLevel, avatarUrl, interests } = req.body;
    const trimmedFirstName = firstName && firstName.trim();
    if (!trimmedFirstName) {
      return res.status(400).json({ error: "firstName is required" });
    }

    const child = await db.ChildProfile.create({
      firstName: trimmedFirstName,
      lastName: lastName && lastName.trim() ? lastName.trim() : null,
      birthdate: birthdate && birthdate.trim() ? birthdate : null,
      readingLevel: readingLevel && readingLevel.trim() ? readingLevel.trim() : null,
      avatarUrl: avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : null,
      interests: interests && interests.trim() ? interests.trim() : null,
      UserId: req.user.id,
    });

    return res.status(201).json({ child: child.get({ plain: true }) });
  } catch (error) {
    console.error("Failed to create child profile", error);
    if (error.name === "SequelizeValidationError") {
      const message = error.errors && error.errors.length ? error.errors[0].message : "Validation error";
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Unable to create child profile" });
  }
});

router.put("/children/:id", async (req, res) => {
  try {
    const child = await db.ChildProfile.findOne({
      where: { id: req.params.id, UserId: req.user.id },
    });

    if (!child) {
      return res.status(404).json({ error: "Child profile not found" });
    }

    if (req.body.firstName !== undefined && (!req.body.firstName || !req.body.firstName.trim())) {
      return res.status(400).json({ error: "firstName cannot be empty" });
    }

    const updatableFields = ["firstName", "lastName", "birthdate", "readingLevel", "avatarUrl", "interests"];
    const normalizers = {
      firstName: (value) => value && value.trim() ? value.trim() : child.firstName,
      lastName: (value) => (value && value.trim() ? value : null),
      birthdate: (value) => (value && value.trim() ? value : null),
      readingLevel: (value) => (value && value.trim() ? value : null),
      avatarUrl: (value) => (value && value.trim() ? value : null),
      interests: (value) => (value && value.trim() ? value : null),
    };
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const transformer = normalizers[field] || ((value) => value);
        child[field] = transformer(req.body[field]);
      }
    });

    await child.save();
    return res.json({ child: child.get({ plain: true }) });
  } catch (error) {
    console.error("Failed to update child profile", error);
    if (error.name === "SequelizeValidationError") {
      const message = error.errors && error.errors.length ? error.errors[0].message : "Validation error";
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Unable to update child profile" });
  }
});

router.delete("/children/:id", async (req, res) => {
  try {
    const deleted = await db.ChildProfile.destroy({
      where: { id: req.params.id, UserId: req.user.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Child profile not found" });
    }

    await db.ReadingProgress.destroy({
      where: { ChildProfileId: req.params.id, UserId: req.user.id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete child profile", error);
    return res.status(500).json({ error: "Unable to delete child profile" });
  }
});

router.put("/progress", async (req, res) => {
  try {
    const { bookId, progressPercent, childProfileId, lastReadAt } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    const numericBookId = Number(bookId);
    if (!Number.isFinite(numericBookId) || numericBookId <= 0) {
      return res.status(400).json({ error: "bookId must be a valid number" });
    }

    const book = await db.Book.findByPk(numericBookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const hasProgressValue = progressPercent !== undefined && progressPercent !== null && `${progressPercent}`.trim() !== "";
    const progressValue = hasProgressValue ? Number(progressPercent) : undefined;
    if (progressValue !== undefined && (Number.isNaN(progressValue) || progressValue < 0 || progressValue > 100)) {
      return res.status(400).json({ error: "progressPercent must be between 0 and 100" });
    }

    const normalizedChildProfileId = childProfileId && `${childProfileId}`.trim() !== "" ? Number(childProfileId) : null;
    if (normalizedChildProfileId !== null && (Number.isNaN(normalizedChildProfileId) || normalizedChildProfileId <= 0)) {
      return res.status(400).json({ error: "childProfileId must be a valid number" });
    }

    if (normalizedChildProfileId !== null) {
      const child = await db.ChildProfile.findOne({ where: { id: normalizedChildProfileId, UserId: req.user.id } });
      if (!child) {
        return res.status(404).json({ error: "Child profile not found" });
      }
    }

    const [progress] = await db.ReadingProgress.findOrCreate({
      where: {
        UserId: req.user.id,
        BookId: numericBookId,
        ChildProfileId: normalizedChildProfileId,
      },
      defaults: {
        progressPercent: progressValue !== undefined ? progressValue : 0,
        lastReadAt: lastReadAt && `${lastReadAt}`.trim() ? new Date(lastReadAt) : new Date(),
        UserId: req.user.id,
        BookId: numericBookId,
        ChildProfileId: normalizedChildProfileId,
      },
    });

    if (progressValue !== undefined) {
      progress.progressPercent = progressValue;
    }
    if (lastReadAt !== undefined) {
      progress.lastReadAt = lastReadAt && `${lastReadAt}`.trim() ? new Date(lastReadAt) : new Date();
    }

    await progress.save();

    const progressWithBook = await db.ReadingProgress.findByPk(progress.id, {
      include: [
        { model: db.Book, as: "book", attributes: ["id", "title"] },
        { model: db.ChildProfile, as: "childProfile", attributes: ["id", "firstName", "lastName"] },
      ],
    });

    return res.json({ progress: progressWithBook.get({ plain: true }) });
  } catch (error) {
    console.error("Failed to update reading progress", error);
    if (error.name === "SequelizeValidationError") {
      const message = error.errors && error.errors.length ? error.errors[0].message : "Validation error";
      return res.status(400).json({ error: message });
    }
    return res.status(500).json({ error: "Unable to update reading progress" });
  }
});

router.delete("/progress/:id", async (req, res) => {
  try {
    const deleted = await db.ReadingProgress.destroy({
      where: { id: req.params.id, UserId: req.user.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Reading progress entry not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete reading progress", error);
    return res.status(500).json({ error: "Unable to delete reading progress" });
  }
});

module.exports = router;
