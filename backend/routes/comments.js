const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const logger = require("../config/logger");
const checkBlocked = require("../middleware/checkBlocked");

// Add a comment to a template
router.post("/", authenticate, checkBlocked, async (req, res, next) => {
  const { templateId, content } = req.body;
  const userId = req.user.id;

  try {
    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { author: true },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        template: { connect: { id: templateId } },
        user: { connect: { id: userId } },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Emit the new comment via Socket.io
    const socketIo = req.app.get("socketIo");
    socketIo.to(templateId).emit("newComment", comment);

    res.status(201).json(comment);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Get comments for a template
router.get("/template/:templateId", async (req, res, next) => {
  const { templateId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { templateId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
