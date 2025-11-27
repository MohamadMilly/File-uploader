const express = require("express");
const indexController = require("../controllers/indexController");

const indexRouter = express.Router();

indexRouter.get("/upload", indexController.uploadGet);

module.exports = indexRouter;
