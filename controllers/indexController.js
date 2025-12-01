const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const utilities = require("../utilities");

const dashboardGet = (req, res) => {
  if (req.isAuthenticated()) {
    // if the user is authenticated render dashboard
    return res.render("dashboard");
  } else {
    // if not , notify the user to login via notAuthenticated view
    res.redirect("/auth/notAuthenticated");
  }
};

// rendering the main page (landing page)
const mainGet = (req, res) => {
  res.render("main", { user: req.user });
};

const sharedContentGet = async (req, res) => {
  const { shareId } = req.params;
  const sharedLink = await prisma.sharedLink.findFirst({
    where: {
      shareId: shareId,
    },
  });
  if (!shareId) {
    return res.send("Your share link is invalid");
  }
  const linkCreatedAt = sharedLink.createdAt;
  const expireDate = new Date(linkCreatedAt);
  expireDate.setDate(linkCreatedAt + parseInt(sharedLink.duration));
  const isExpired = new Date() < expireDate;
  if (isExpired) {
    await prisma.sharedLink.delete({
      where: {
        shareId: shareId,
      },
    });
    return res.send("Your share link has expired");
  } else {
    const { folderId } = sharedLink;
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId,
      },
      include: {
        files: true,
      },
    });
    res.render("sharedcontent", {
      folder: folder,
      formatBytes: utilities.formatBytes,
    });
  }
};

module.exports = {
  dashboardGet,
  mainGet,
  sharedContentGet,
};
