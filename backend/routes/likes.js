const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");
const checkBlocked = require("../middleware/checkBlocked");

// Add a like to a template
router.post("/", authenticate, checkBlocked, async (req, res, next) => {
  const { templateId } = req.body;
  const userId = req.user.id;

  try {
    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if like already exists
    const existingLike = await prisma.like.findFirst({
      where: {
        templateId,
        userId,
      },
    });

    if (existingLike) {
      return res
        .status(400)
        .json({ message: "You have already liked this template" });
    }

    // Create like
    const like = await prisma.like.create({
      data: {
        template: { connect: { id: templateId } },
        user: { connect: { id: userId } },
      },
    });

    await prisma.template.update({
      where: { id: templateId },
      data: {
        popularityScore: {
          increment: 1,
        },
      },
    });

    res.status(201).json(like);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Remove a like from a template
router.delete("/:templateId", authenticate, async (req, res, next) => {
  const { templateId } = req.params;
  const userId = req.user.id;

  try {
    // Check if like exists
    const existingLike = await prisma.like.findFirst({
      where: {
        templateId,
        userId,
      },
    });

    if (!existingLike) {
      return res
        .status(400)
        .json({ message: "You have not liked this template" });
    }

    // Delete like
    await prisma.like.delete({
      where: { id: existingLike.id },
    });

    await prisma.template.update({
      where: { id: templateId },
      data: {
        popularityScore: {
          decrement: 1,
        },
      },
    });

    res.json({ message: "Like removed successfully" });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Add a route to get likes for a template
router.get("/template/:templateId", async (req, res, next) => {
  const { templateId } = req.params;

  try {
    const likes = await prisma.like.findMany({
      where: { templateId },
      select: { userId: true },
    });

    const count = likes.length;
    const userIds = likes.map((like) => like.userId);

    res.json({ count, users: userIds });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});
module.exports = router;
