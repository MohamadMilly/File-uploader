const express = require("express");
// multer for getting the files from the form
const multer = require("multer");
// the dashboard router for (new folder , upload file,all folders,all files,files in folder)
// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const dashboardRouter = express.Router();
// dashboard controller
const dashboardController = require("../controllers/dashboardController");

// get requests routes

dashboardRouter.get("/folders/:folderId", dashboardController.filesInFolderGet);
dashboardRouter.get("/newfolder", dashboardController.newFolderGet);
dashboardRouter.get("/files", dashboardController.allFilesGet);
dashboardRouter.get("/upload", dashboardController.uploadGet);
dashboardRouter.get("/folders", dashboardController.allFoldersGet);
dashboardRouter.get("/files/:fileId", dashboardController.fileDetailsGet);
dashboardRouter.get("/delete/file/:fileId", dashboardController.deleteFileGet);
dashboardRouter.get(
  "/delete/folder/:folderId",
  dashboardController.deleteFolderGet
);
dashboardRouter.get("/update/file/:fileId", dashboardController.updateFileGet);
dashboardRouter.get(
  "/update/folder/:folderId",
  dashboardController.updateFolderGet
);
dashboardRouter.get("/share/:folderId", dashboardController.sharePageGet);

// post requests routes
dashboardRouter.post(
  "/upload",
  upload.single("file"),
  dashboardController.uploadPost
);
dashboardRouter.post("/newFolder", dashboardController.newFolderPost);
dashboardRouter.post(
  "/delete/file/:fileId",
  dashboardController.deleteFilePost
);
dashboardRouter.post(
  "/delete/folder/:folderId",
  dashboardController.deleteFolderPost
);
dashboardRouter.post(
  "/update/file/:fileId",
  dashboardController.updateFilePost
);
dashboardRouter.post(
  "/update/folder/:folderId",
  dashboardController.updateFolderPost
);
dashboardRouter.post("/share/:folderId", dashboardController.sharePagePost);
module.exports = dashboardRouter;
