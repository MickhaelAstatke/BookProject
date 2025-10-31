"use strict";

const express = require("express");
const router = express.Router();

const db = require("../models");
const { requireAuthApi } = require("../middleware/auth");

router.use(requireAuthApi);

router.post("/", async (req, res) => {
  try {
    const { bookId, quantity, childProfileId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: "A bookId is required" });
    }

    const numericBookId = Number(bookId);
    if (!Number.isFinite(numericBookId) || numericBookId <= 0) {
      return res.status(400).json({ error: "bookId must be a number" });
    }

    const book = await db.Book.findByPk(numericBookId);
    if (!book) {
      return res.status(404).json({ error: "Unable to locate requested book" });
    }

    const parsedChildProfileId = childProfileId !== undefined && childProfileId !== null && childProfileId !== ""
      ? Number(childProfileId)
      : null;

    if (parsedChildProfileId !== null && Number.isNaN(parsedChildProfileId)) {
      return res.status(400).json({ error: "childProfileId must be a number" });
    }

    if (parsedChildProfileId !== null) {
      const childProfile = await db.ChildProfile.findOne({
        where: { id: parsedChildProfileId, UserId: req.user.id },
      });
      if (!childProfile) {
        return res.status(404).json({ error: "Child profile not found" });
      }
    }

    const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;
    const basePrice = Number(book.price);
    if (Number.isNaN(basePrice)) {
      return res.status(500).json({ error: "Book price is not configured" });
    }
    const totalPrice = Number((basePrice * qty).toFixed(2));
    const cartItem = await db.Cart.create({
      quantity: qty,
      price: totalPrice,
      UserId: req.user.id,
      ChildProfileId: parsedChildProfileId,
    });

    await cartItem.addBook(book);

    const createdItem = await db.Cart.findByPk(cartItem.id, {
      include: [
        {
          model: db.Book,
        },
        {
          model: db.ChildProfile,
          as: "childProfile",
        },
      ],
    });

    return res.status(201).json({ cartItem: createdItem.get({ plain: true }) });
  } catch (error) {
    console.error("Failed to create cart entry", error);
    return res.status(500).json({ error: "Unable to add book to cart" });
  }
});

router.get("/", async (req, res) => {
  try {
    const items = await db.Cart.findAll({
      where: { UserId: req.user.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: db.Book,
        },
        {
          model: db.ChildProfile,
          as: "childProfile",
        },
      ],
    });

    const total = await db.Cart.sum("price", {
      where: { UserId: req.user.id },
    });

    return res.json({
      items: items.map((item) => item.get({ plain: true })),
      total: Number(total || 0),
    });
  } catch (error) {
    console.error("Failed to fetch cart items", error);
    return res.status(500).json({ error: "Unable to retrieve cart" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await db.Cart.destroy({
      where: { id: req.params.id, UserId: req.user.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete cart item", error);
    return res.status(500).json({ error: "Unable to remove cart item" });
  }
});

router.delete("/", async (req, res) => {
  try {
    await db.Cart.destroy({ where: { UserId: req.user.id } });
    return res.status(204).send();
  } catch (error) {
    console.error("Failed to clear cart", error);
    return res.status(500).json({ error: "Unable to clear cart" });
  }
});

module.exports = router;
