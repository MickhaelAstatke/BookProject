"use strict";

const express = require("express");
const router = express.Router();
const accounting = require("accounting");
const lodash = require("lodash");

const db = require("../models");
const { requireAuthPage } = require("../middleware/auth");

const COVER_PLACEHOLDER = "/assets/img/cover-placeholder.svg";

async function getDistinctCategories() {
  return db.Book.aggregate("genre", "DISTINCT", { plain: false });
}

async function getCartMeta(userId) {
  if (!userId) {
    return { cartCount: 0, totalPrice: 0 };
  }

  const [cartCount, totalPrice] = await Promise.all([
    db.Cart.count({ where: { UserId: userId } }),
    db.Cart.sum("price", { where: { UserId: userId } }),
  ]);

  return {
    cartCount: cartCount || 0,
    totalPrice: Number(totalPrice || 0),
  };
}

async function fetchGalleryMaterials() {
  const materials = await db.Material.findAll({
    include: [
      {
        model: db.Author,
        attributes: ["id", "firstName", "lastName"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return materials.map((material) => {
    const plain = material.get({ plain: true });
    const author = plain.Author;
    plain.authorName = author ? `${author.firstName} ${author.lastName}`.trim() : "Unknown";
    plain.typeLabel = plain.type ? plain.type.charAt(0).toUpperCase() + plain.type.slice(1) : "";
    return plain;
  });
}

function formatBookForDisplay(book) {
  const dataValues = book.get({ plain: true });
  dataValues.price = accounting.formatMoney(dataValues.price);
  dataValues.modalhref = `#modal-book-${dataValues.id}`;
  dataValues.modalId = `modal-book-${dataValues.id}`;
  dataValues.coverImageUrl = dataValues.coverImageUrl || COVER_PLACEHOLDER;

  if (dataValues.Author) {
    const firstName = dataValues.Author.firstName || "";
    const lastName = dataValues.Author.lastName || "";
    const combinedName = `${firstName} ${lastName}`.trim();
    dataValues.Author.name = combinedName || dataValues.Author.name;
    if (!dataValues.Author.name) {
      dataValues.Author = null;
    }
  }

  return dataValues;
}

router.get("/", async (req, res) => {
  try {
    const [books, categories, cartMeta] = await Promise.all([
      db.Book.findAll({
        limit: 9,
        include: [db.Author],
      }),
      getDistinctCategories(),
      getCartMeta(req.user ? req.user.id : null),
    ]);

    const formattedBooks = lodash.map(books, formatBookForDisplay);

    const salutationName = req.user
      ? req.user.displayName || req.user.guardianName || req.user.email
      : null;

    return res.render("index", {
      books: formattedBooks,
      categories,
      cartCount: cartMeta.cartCount,
      salutationName,
    });
  } catch (error) {
    console.error("Failed to render index", error);
    return res.status(500).render("error", {
      message: "We were unable to load the catalog. Please try again later.",
      categories: [],
      cartCount: 0,
    });
  }
});

router.post("/category/:categoryName", requireAuthPage, async (req, res) => {
  try {
    const [booksByCategory, categories, cartMeta] = await Promise.all([
      db.Book.findAll({
        where: { genre: req.body.genre },
        include: [db.Author],
      }),
      getDistinctCategories(),
      getCartMeta(req.user.id),
    ]);

    const formattedBooks = lodash.map(booksByCategory, formatBookForDisplay);

    return res.render("category", {
      books: formattedBooks,
      categories,
      cartCount: cartMeta.cartCount,
    });
  } catch (error) {
    console.error("Failed to render category page", error);
    return res.status(500).render("error", {
      message: "We were unable to load the selected category.",
      categories: [],
      cartCount: 0,
    });
  }
});

router.get("/cart", requireAuthPage, async (req, res) => {
  try {
    const [cartItems, categories, cartMeta] = await Promise.all([
      db.Cart.findAll({
        where: { UserId: req.user.id },
        include: [
          {
            model: db.Book,
          },
          {
            model: db.ChildProfile,
            as: "childProfile",
          },
        ],
      }),
      getDistinctCategories(),
      getCartMeta(req.user.id),
    ]);

    const cart = cartItems.map((item) => {
      const plain = item.get({ plain: true });
      plain.priceDisplay = accounting.formatMoney(plain.price);
      plain.books = plain.Books.map((book) => {
        const bookPlain = { ...book };
        bookPlain.priceDisplay = accounting.formatMoney(bookPlain.price);
        return bookPlain;
      });
      delete plain.Books;
      return plain;
    });

    return res.render("cart", {
      cart,
      categories,
      cartCount: cartMeta.cartCount,
      subTotal: accounting.formatMoney(cartMeta.totalPrice),
    });
  } catch (error) {
    console.error("Failed to render cart", error);
    return res.status(500).render("error", {
      message: "We were unable to load your cart.",
      categories: [],
      cartCount: 0,
    });
  }
});

router.get("/gallery", requireAuthPage, async (req, res) => {
  try {
    const [categories, cartMeta, materials] = await Promise.all([
      getDistinctCategories(),
      getCartMeta(req.user.id),
      fetchGalleryMaterials(),
    ]);

    return res.render("gallery", {
      categories,
      cartCount: cartMeta.cartCount,
      materials,
    });
  } catch (error) {
    console.error("Failed to render gallery", error);
    return res.status(500).render("error", {
      message: "We were unable to load the gallery.",
      categories: [],
      cartCount: 0,
    });
  }
});

router.get("/account", requireAuthPage, async (req, res) => {
  try {
    const [categories, cartMeta, subscription] = await Promise.all([
      getDistinctCategories(),
      getCartMeta(req.user.id),
      db.Subscription.findOne({
        where: { UserId: req.user.id },
        order: [["updatedAt", "DESC"]],
      }),
    ]);

    return res.render("account", {
      categories,
      cartCount: cartMeta.cartCount,
      subscription: subscription ? subscription.get({ plain: true }) : null,
      user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user.get({ plain: true }),
    });
  } catch (error) {
    console.error("Failed to render account page", error);
    return res.status(500).render("error", {
      message: "We were unable to load your account settings.",
      categories: [],
      cartCount: 0,
    });
  }
});

module.exports = router;
