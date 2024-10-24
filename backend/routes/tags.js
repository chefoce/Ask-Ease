const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");

// Get tags for autocompletion
router.get("/autocomplete", async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    // Fetch all tags from templates
    const templates = await prisma.template.findMany({
      select: {
        tags: true,
      },
    });

    // Flatten and deduplicate tags
    const allTags = templates.flatMap((t) => t.tags);
    const uniqueTags = [...new Set(allTags)];

    // Filter tags that include the query string
    const filteredTags = uniqueTags.filter((tag) =>
      tag.toLowerCase().includes(query.toLowerCase())
    );

    res.json(filteredTags);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Get all unique tags
router.get("/", async (req, res, next) => {
  try {
    // Fetch all tags from templates
    const templates = await prisma.template.findMany({
      select: {
        tags: true,
      },
    });

    // Flatten and deduplicate tags
    const allTags = templates.flatMap((t) => t.tags);
    const uniqueTags = [...new Set(allTags)];

    res.json(uniqueTags);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
