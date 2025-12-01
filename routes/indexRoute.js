const express = require("express");
const indexController = require("../controllers/indexController");

const indexRouter = express.Router();

indexRouter.get("/", indexController.mainGet);
indexRouter.get("/dashboard", indexController.dashboardGet);
indexRouter.get("/shared/:shareId", indexController.sharedContentGet);

indexRouter.get("/logout", (req, res, next) => {
  req.logOut((error) => {
    if (error) {
      next(error);
    }
  });
  res.redirect("/");
});

module.exports = indexRouter;
