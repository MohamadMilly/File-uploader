const express = require("express");
// controller for authentication process
const authController = require("../controllers/authenticationController");
const passport = require("passport");
// initialzing the router for authentication
const authRouter = express.Router();

// validators
const validateSigup = require("../middlewares/signupValidator");

// get routes
authRouter.get("/signup", authController.signupGet);
authRouter.get("/login", authController.loginGet);
authRouter.get("/notAuthenticated", authController.notAuthenticatedGet);

// post routes
authRouter.post("/signup", validateSigup, authController.signupPost);
authRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true, // allowing flashs for strategyErrors
  })
);

module.exports = authRouter;
