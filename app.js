// requiring all the packages
// initializing express
const express = require("express");
// path
const path = require("path");
// express-session
const expressSession = require("express-session");
// prisma session store
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
// prisma client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// passport
const passport = require("passport");
// initializing local strategy
const LocalStrategy = require("passport-local").Strategy;
// requiring the  .env file
require("dotenv").config();
// flash for flash messages
const flash = require("connect-flash");
// bcrypt for matching the passwords
const bcrypt = require("bcryptjs");
// requiring the routers
const authRouter = require("./routes/authenticationRoute");
const indexRouter = require("./routes/indexRoute");
const dashboardRouter = require("./routes/dashboardRoute");

const app = express();

app.use(express.urlencoded({ extended: false }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.session());
app.use(flash());

// validation function
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });
      if (!user) {
        return done(null, false, { message: "Username is incorrect." });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Password is incorrect." });
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  done(null, user);
});

app.use("/auth", authRouter);
app.use("/", indexRouter);
app.use("/dashboard", dashboardRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log("app is listening on port: ", PORT);
});
