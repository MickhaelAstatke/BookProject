"use strict";

const db = require("../models");

function addDays(baseDate, amount) {
  const date = new Date(baseDate.getTime());
  date.setDate(date.getDate() + amount);
  return date;
}

function calculateRenewalDate(plan) {
  const now = new Date();
  if (!plan) {
    return null;
  }
  if (plan.billingInterval === "yearly") {
    const renewal = new Date(now.getTime());
    renewal.setFullYear(renewal.getFullYear() + 1);
    return renewal;
  }
  // default monthly
  const renewal = new Date(now.getTime());
  renewal.setMonth(renewal.getMonth() + 1);
  return renewal;
}

function subscriptionIsActive(subscription) {
  if (!subscription) {
    return false;
  }
  if (subscription.status === "canceled" || subscription.status === "expired") {
    return false;
  }

  if (subscription.status === "trialing" && subscription.trialEndsAt) {
    return new Date(subscription.trialEndsAt) >= new Date();
  }

  if (subscription.status === "active") {
    if (subscription.renewsOn) {
      return new Date(subscription.renewsOn) >= new Date();
    }
    return true;
  }

  return false;
}

module.exports = function (app) {
  app.get("/api/plans", async function (_req, res) {
    const plans = await db.Plan.findAll({
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
        },
      ],
      order: [["priceCents", "ASC"]],
    });

    res.json(plans);
  });

  app.post("/api/trials", async function (req, res) {
    const { planId, userReference } = req.body;
    const plan = await db.Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const now = new Date();
    const trialEndsAt = plan.trialDays ? addDays(now, plan.trialDays) : null;

    const subscription = await db.Subscription.create({
      status: plan.trialDays > 0 ? "trialing" : "active",
      trialEndsAt,
      renewsOn: calculateRenewalDate(plan),
      userReference: userReference || null,
      PlanId: plan.id,
    });

    res.status(201).json(subscription);
  });

  app.post("/api/subscriptions", async function (req, res) {
    const { planId, userReference } = req.body;
    const plan = await db.Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const subscription = await db.Subscription.create({
      status: "active",
      trialEndsAt: plan.trialDays ? addDays(new Date(), plan.trialDays) : null,
      renewsOn: calculateRenewalDate(plan),
      userReference: userReference || null,
      PlanId: plan.id,
    });

    res.status(201).json(subscription);
  });

  app.patch("/api/subscriptions/:id/renew", async function (req, res) {
    const subscription = await db.Subscription.findByPk(req.params.id, {
      include: [{ model: db.Plan, as: "plan" }],
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const renewalDate = calculateRenewalDate(subscription.plan);
    await subscription.update({
      status: "active",
      renewsOn: renewalDate,
      canceledOn: null,
    });

    res.json(subscription);
  });

  app.post("/api/subscriptions/:id/cancel", async function (req, res) {
    const subscription = await db.Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    await subscription.update({
      status: "canceled",
      canceledOn: new Date(),
    });

    res.json(subscription);
  });

  app.get("/api/catalog/premium", async function (req, res) {
    const { subscriptionId } = req.query;
    if (!subscriptionId) {
      return res.status(400).json({ message: "A subscriptionId is required" });
    }

    const subscription = await db.Subscription.findByPk(subscriptionId, {
      include: [
        {
          model: db.Plan,
          as: "plan",
          include: [
            {
              model: db.Book,
              as: "availableBooks",
              through: { attributes: ["accessType"] },
              where: { isPremium: true },
              required: false,
              include: [db.Author],
            },
          ],
        },
      ],
    });

    if (!subscription || !subscriptionIsActive(subscription)) {
      return res.status(403).json({ message: "Subscription is not active" });
    }

    res.json({
      subscription,
      premiumBooks: subscription.plan ? subscription.plan.availableBooks : [],
    });
  });
};
