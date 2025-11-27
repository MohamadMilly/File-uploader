// PrismaClient
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// bcryptjs for hashing passwords
const bcrypt = require("bcryptjs");
// passport
const passport = require("passport");

const { validationResult, matchedData } = require("express-validator");

// rendering the signup form
const signupGet = (req, res) => {
  res.render("signup");
};

// getting the data from the sign up form
const signupPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("signup", { errors: errors.array() });
  }
  const { firstname, lastname, username, password } = matchedData(req);
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({
      data: {
        firstname,
        lastname,
        username,
        password: hashedPassword,
      },
    });
  } catch (error) {
    next(error);
  }
  res.redirect("/");
};

// rendering the login form
const loginGet = (req, res) => {
  const errors = req.flash("error"); // getting the error message from the strategy
  res.render("login", { errors: errors });
};

module.exports = {
  signupGet,
  signupPost,
  loginGet,
};
