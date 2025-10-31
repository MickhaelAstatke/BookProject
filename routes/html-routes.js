"use strict";

const express = require("express");
const router = express.Router();
const db = require("../models");

function serializePlan(planInstance) {
  const plan = planInstance.get({ plain: true });
  plan.displayPrice = (plan.priceCents / 100).toFixed(2);
  plan.featuredBooks = (plan.availableBooks || []).map((book) => ({
    ...book,
    authorName: book.Author
      ? `${book.Author.firstName} ${book.Author.lastName}`
      : null,
  }));
  return plan;
}

router.get("/", async (_req, res, next) => {
  try {
    const planInstances = await db.Plan.findAll({
      include: [
        {
          model: db.Benefit,
          as: "benefits",
          through: { attributes: [] },
        },
        {
          model: db.Book,
          as: "availableBooks",
          through: { attributes: ["accessType"] },
          include: [db.Author],
          where: { isFeatured: true },
          required: false,
        },
      ],
      order: [["priceCents", "ASC"]],
    });

    const featuredBooks = await db.Book.findAll({
      where: { isFeatured: true },
      include: [db.Author],
      limit: 6,
    });

    res.render("plan-selection", {
      plans: planInstances.map(serializePlan),
      featuredBooks: featuredBooks.map((bookInstance) => {
        const book = bookInstance.get({ plain: true });
        return {
          ...book,
          authorName: `${book.Author.firstName} ${book.Author.lastName}`,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/onboarding", async (_req, res, next) => {
  try {
    const plans = await db.Plan.findAll({
      where: { trialDays: { [db.Sequelize.Op.gt]: 0 } },
      include: [{ model: db.Benefit, as: "benefits", through: { attributes: [] } }],
      order: [["trialDays", "DESC"]],
    });

    res.render("onboarding", {
      trialPlans: plans.map(serializePlan),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/account", async (req, res, next) => {
  try {
    const { subscriptionId } = req.query;
    let subscription = null;

    if (subscriptionId) {
      const subscriptionInstance = await db.Subscription.findByPk(subscriptionId, {
        include: [
          { model: db.Plan, as: "plan", include: [{ model: db.Benefit, as: "benefits", through: { attributes: [] } }] },
        ],
      });
      if (subscriptionInstance) {
        subscription = subscriptionInstance.get({ plain: true });
        if (subscriptionInstance.plan) {
          subscription.plan = serializePlan(subscriptionInstance.plan);
        }
        if (subscription.renewsOn) {
          subscription.renewsOnFormatted = new Date(subscription.renewsOn).toDateString();
        }
        if (subscription.trialEndsAt) {
          subscription.trialEndsAtFormatted = new Date(subscription.trialEndsAt).toDateString();
        }
      }
    }

    const plans = await db.Plan.findAll({ order: [["priceCents", "ASC"]] });

    res.render("account", {
      subscription,
      plans: plans.map(serializePlan),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/collections/:tag", async (req, res, next) => {
  try {
    const tag = req.params.tag;
    const books = await db.Book.findAll({
      where: { collectionTag: tag },
      include: [db.Author, { model: db.Plan, as: "plans", through: { attributes: ["accessType"] } }],
    });

    res.render("collection", {
      tag,
      books: books.map((bookInstance) => {
        const book = bookInstance.get({ plain: true });
        return {
          ...book,
          authorName: `${book.Author.firstName} ${book.Author.lastName}`,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/gallery", (_req, res) => {
  res.render("gallery");
});

module.exports = router;
