"use strict";

const loadEnv = require("./config/loadEnv");

const loadedEnvFile = loadEnv();

const express = require("express");
const exphbs = require("express-handlebars");

// Requiring our models for syncing
const db = require("./models");
const firebaseService = require("./services/firebase");
const { authenticateRequest } = require("./middleware/auth");

const htmlRoutes = require("./routes/html-routes");
const cartApiRoutes = require("./routes/cart-api-routes");
const accountApiRoutes = require("./routes/account-api-routes");
const authRoutes = require("./routes/auth-routes");

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== "production" && !loadedEnvFile) {
  console.warn(
    "Starting server without a .env file. Create one (or copy .env.example) so Firebase keys are available."
  );
}

const app = express();

const hbs = exphbs.create({
  defaultLayout: "main",
  helpers: {
    json: function (context) {
      return JSON.stringify(context || null);
    },
  },
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// Parse application body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.firebaseConfig = firebaseService.getClientConfig();
  res.locals.isFirebaseConfigured = firebaseService.isClientConfigured();
  res.locals.currentUser = null;
  res.locals.serverKnowsUser = false;
  next();
});

app.use(authenticateRequest);

app.use((req, res, next) => {
  if (req.user) {
    res.locals.serverKnowsUser = true;
  }
  next();
});

app.use("/api/cart", cartApiRoutes);
app.use("/api/account", accountApiRoutes);
app.use("/api/auth", authRoutes);
app.use("/", htmlRoutes);

const syncOptions = {};
if (process.env.DB_SYNC_FORCE === "true") {
  syncOptions.force = true;
} else if (process.env.DB_SYNC_ALTER !== "false") {
  syncOptions.alter = true;
}

db.sequelize.sync(syncOptions).then(function () {
  app.listen(PORT, function () {
    console.log("App listening on PORT " + PORT);
  });
});
