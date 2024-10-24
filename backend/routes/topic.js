const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");

// Get all topic names
router.get("/", async (req, res, next) => {
  try {
    const topics = await prisma.topic.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json(topics);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
