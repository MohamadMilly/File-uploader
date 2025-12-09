// prisma client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

require("dotenv").config();

// supabase client for uploading the file
const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;

// getting the url and role-key from .env
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// utility functions
const utilities = require("../utilities");

// getting all users files
const allFilesGet = async (req, res) => {
  const userFiles = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        files: {
          include: {
            folder: true,
          },
        },
      },
    })
  ).files;

  res.render("dashboard", {
    section: "files",
    files: userFiles,
    formatBytes: utilities.formatBytes,
  });
};

// rendering the upload form with a list a folders to choose from
const uploadGet = async (req, res) => {
  const userwithFolders = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      folders: true,
    },
  });
  res.render("uploadform", { user: userwithFolders });
};

// uploading the file to supabase after getting the file from the form via multer middleware
const uploadPost = async (req, res) => {
  const { name, folderId } = req.body;
  const { buffer, mimetype, size } = req.file;
  const filePath = `uploads/${Date.now()}-${name}-${req.file.originalname}`;

  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: true,
    });
  // getting the file url to store it in the database
  const { data: publicUrlData } = supabase.storage
    .from("files")
    .getPublicUrl(filePath);
  if (error) {
    console.error("Error uploading to Supabase:", error);

    return res.status(500).send("Error uploading file");
  }
  // creating the file record with the url string from before
  await prisma.file.create({
    data: {
      name: name,
      URL: publicUrlData.publicUrl,
      size: size,
      folder: {
        connect: {
          id: parseInt(folderId),
        },
      },

      user: {
        connect: {
          id: req.user.id,
        },
      },
    },
  });
  res.redirect("/dashboard/files");
};

// rendering new folder form
const newFolderGet = (req, res) => {
  res.render("newfolder");
};

// handling new form addition
const newFolderPost = async (req, res, next) => {
  const { name } = req.body;
  try {
    await prisma.folder.create({
      data: {
        name: name,
        user: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });
  } catch (error) {
    console.error("Unexpected Error: ", error);
    next(error);
  }
  res.redirect("/dashboard/folders");
};

// getting all the folder when visiting /dashboard/folders
const allFoldersGet = async (req, res) => {
  const allUserFolders = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: true,
      },
    })
  ).folders;
  res.render("dashboard", { section: "folders", folders: allUserFolders });
};

const filesInFolderGet = async (req, res) => {
  const folderId = req.params.folderId;
  const folderWithFiles = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: {
          where: {
            id: parseInt(folderId),
          },
          include: {
            files: {
              include: {
                folder: true,
              },
            },
          },
        },
      },
    })
  ).folders[0];
  res.render("dashboard", {
    section: "files",
    title: `All Files In ${folderWithFiles.name}`,
    files: folderWithFiles.files,
    formatBytes: utilities.formatBytes,
  });
};

// rendering file details with download link
const fileDetailsGet = async (req, res) => {
  const { fileId } = req.params;
  const visitedFile = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        files: {
          where: {
            id: parseInt(fileId),
          },
          include: {
            folder: true,
          },
        },
      },
    })
  ).files[0];
  res.render("filedetails", {
    file: visitedFile,
    formatBytes: utilities.formatBytes,
  });
};

const deleteFileGet = async (req, res) => {
  const { fileId } = req.params;

  const file = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        files: {
          where: {
            id: parseInt(fileId),
          },
          include: {
            folder: true,
          },
        },
      },
    })
  ).files[0];
  res.render("CRUD/deletefile", { file: file });
};

const deleteFolderGet = async (req, res) => {
  const { folderId } = req.params;
  const folder = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: {
          where: {
            id: parseInt(folderId),
          },
        },
      },
    })
  ).folders[0];
  res.render("CRUD/deletefolder", { folder: folder });
};

const deleteFilePost = async (req, res) => {
  const { fileId } = req.params;
  const deletedFile = await prisma.file.delete({
    where: {
      id: parseInt(fileId),
    },
  });
  const publicUrl = deletedFile.URL;
  const filePath = publicUrl.split(`public/files/`)[1];
  const { data, error } = await supabase.storage
    .from("files")
    .remove([filePath]);
  if (error) {
    console.error("Error Deleting from Supabase:", error);

    return res.status(500).send("Error Deleting file");
  }
  res.redirect("/dashboard/files");
};

const deleteFolderPost = async (req, res) => {
  const { folderId } = req.params;

  const deletedFilesDataPromise = prisma.file.findMany({
    where: {
      folderId: parseInt(folderId),
    },
  });
  const deletedFilesCountPromise = prisma.file.deleteMany({
    where: {
      folderId: parseInt(folderId),
    },
  });
  const deleteShareLinkPromise = prisma.sharedLink.delete({
    where: {
      folderId: parseInt(folderId),
    },
  });
  const deletedFolderPromise = prisma.folder.delete({
    where: {
      id: parseInt(folderId),
    },
  });

  const [deletedFiles, deletedFilesCount, deletedShare, deletedFolder] =
    await prisma.$transaction([
      deletedFilesDataPromise,
      deletedFilesCountPromise,
      deleteShareLinkPromise,
      deletedFolderPromise,
    ]);
  const deletedFilesPublicURLs = deletedFiles.map((file) => file.URL);
  const deletedFilesPaths =
    deletedFilesPublicURLs.length !== 0
      ? deletedFilesPublicURLs.map((URL) => URL.split("public/files/")[1])
      : "";
  const { data, error } = await supabase.storage
    .from("files")
    .remove(deletedFilesPaths);
  if (error) {
    console.error("Error Deleting from Supabase:", error);

    return res.status(500).send("Error Deleting Folder");
  }

  res.redirect("/dashboard/folders");
};

const updateFileGet = async (req, res) => {
  const { fileId } = req.params;
  const file = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        files: {
          where: {
            id: parseInt(fileId),
          },
          include: {
            folder: true,
          },
        },
      },
    })
  ).files[0];
  const folders = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: true,
      },
    })
  ).folders;

  res.render("CRUD/updatefile", { file: file, folders: folders });
};

const updateFilePost = async (req, res) => {
  const { fileId } = req.params;
  const { name, folderId } = req.body;

  await prisma.file.update({
    where: {
      id: parseInt(fileId),
    },
    data: {
      name: name,
      folder: {
        connect: {
          id: parseInt(folderId),
        },
      },
    },
  });
  res.redirect("/dashboard/files");
};

const updateFolderGet = async (req, res) => {
  const { folderId } = req.params;
  const folder = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: {
          where: {
            id: parseInt(folderId),
          },
        },
      },
    })
  ).folders[0];
  res.render("CRUD/updatefolder", { folder: folder });
};

const updateFolderPost = async (req, res) => {
  const { name } = req.body;
  const { folderId } = req.params;
  await prisma.folder.update({
    where: {
      id: parseInt(folderId),
    },
    data: {
      name: name,
    },
  });
  res.redirect("/dashboard/folders");
};

const sharePageGet = async (req, res) => {
  const { folderId } = req.params;
  const folder = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: {
          where: {
            id: parseInt(folderId),
          },
        },
      },
    })
  ).folders[0];
  res.render("shareform", { folder: folder });
};

const sharePagePost = async (req, res) => {
  const { folderId } = req.params;
  const { duration } = req.body;
  const shareId = crypto.randomUUID();
  const base_url = process.env.APP_URL;
  const sharedLink = `${base_url}/shared/${shareId}`;
  const folder = (
    await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        folders: {
          where: {
            id: parseInt(folderId),
          },
          include: {
            shareLink: true,
          },
        },
      },
    })
  ).folders[0];
  const existingLinkData = await prisma.sharedLink.findUnique({
    where: { folderId: parseInt(folderId) },
  });
  if (existingLinkData) {
    const linkCreatedAt = existingLinkData.createdAt;
    const expireDate = new Date(linkCreatedAt);
    expireDate.setDate(linkCreatedAt + parseInt(existingLinkData.duration));
    const isExpired = new Date() < expireDate;
    if (isExpired) {
      await prisma.sharedLink.delete({
        where: {
          shareId: shareId,
        },
      });
      await createShareLink(duration, shareId, folderId, req.user.id);
      return res.render("shareform", {
        sharedLink: sharedLink,
        folder: folder,
      });
    } else {
    }
    const existingShareUrl = `${base_url}/shared/${existingLinkData.shareId}`;
    return res.render("shareform", {
      sharedLink: existingShareUrl,
      folder: folder,
      message: "You already have a share link",
    });
  } else {
    await createShareLink(duration, shareId, folderId, req.user.id);

    res.render("shareform", { sharedLink: sharedLink, folder: folder });
  }
};

// instead of repeating the share link creation code block , i am going to use a utility function
async function createShareLink(duration, shareId, folderId, userId) {
  await prisma.sharedLink.create({
    data: {
      duration: parseInt(duration),
      shareId: shareId,
      user: {
        connect: {
          id: userId,
        },
      },
      folder: {
        connect: { id: parseInt(folderId) },
      },
    },
  });
}

module.exports = {
  allFilesGet,
  uploadGet,
  uploadPost,
  newFolderGet,
  newFolderPost,
  allFoldersGet,
  filesInFolderGet,
  fileDetailsGet,
  deleteFileGet,
  deleteFolderGet,
  deleteFilePost,
  deleteFolderPost,
  updateFileGet,
  updateFilePost,
  updateFolderGet,
  updateFolderPost,
  sharePageGet,
  sharePagePost,
};
