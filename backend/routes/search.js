const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");

// Full-text search for templates
router.get("/", async (req, res, next) => {
  const { query, page = 1, limit = 10 } = req.query;

  try {
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        author: { select: { id: true, name: true } },
        likes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(templates);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
