// for validating fields
const { body } = require("express-validator");
// to check username uniqueness
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const emptyError = "is required.";
const notAlphaError = "should only contain letters.";
const overCharactersError = "should not be more than 24 characters.";
const weakPasswordError =
  "Password must contain 1 number,1 symbol,1 uppercase,1 lowercase and at least 8 characters.";
const passwordConfirmationMismatch = "Password confirmation doesn't match.";
const usernameIsTakenError = "This username is already taken";

const validateSigup = [
  body("firstname")
    .trim()
    .notEmpty()
    .withMessage(`Firstname ${emptyError}`)
    .isAlpha()
    .withMessage(`Firstname ${notAlphaError}`)
    .isLength({ max: 24 })
    .withMessage(`Firstname ${overCharactersError}`),
  body("lastname")
    .trim()
    .notEmpty()
    .withMessage(`Lastname ${emptyError}`)
    .isAlpha()
    .withMessage(`Lastname ${notAlphaError}`)
    .isLength({ max: 24 })
    .withMessage(`Lastname ${overCharactersError}`),
  body("username")
    .trim()
    .notEmpty()
    .withMessage(`Username ${emptyError}`)
    .isLength({ max: 24 })
    .withMessage(`Username ${overCharactersError}`)
    .custom(async (value, { req }) => {
      const user = await prisma.user.findUnique({
        where: {
          username: value,
        },
      });
      if (user) {
        throw new Error(usernameIsTakenError);
      } else {
        return true;
      }
    }),
  body("password")
    .trim()
    .notEmpty()
    .withMessage(`Password ${emptyError}`)
    .isStrongPassword({
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 1,
      minUppercase: 1,
      minLength: 8,
    })
    .withMessage(weakPasswordError),
  body("confirm_password")
    .trim()
    .notEmpty()
    .withMessage(`Password confirmation ${emptyError}`)
    .custom((value, { req }) => {
      const match = value === req.body.password;
      if (!match) {
        throw new Error(passwordConfirmationMismatch);
      } else {
        return true;
      }
    }),
];

module.exports = validateSigup;
