const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");
const crypto = require("crypto");

const Joi = require("joi");
const validate = require("../middleware/validationMiddleware");

const preferencesSchema = Joi.object({
  language: Joi.string().valid("en", "es").optional(),
  theme: Joi.string().valid("light", "dark").optional(),
}).or("language", "theme");

// Get users for autocompletion
router.get("/autocomplete", authenticate, async (req, res, next) => {
  const { query } = req.query;

  try {
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Fetch users matching the query
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10, // Limit the number of results for performance
    });

    res.json(users);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Get authenticated user data
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isBlocked: true,
        language: true,
        theme: true,
      },
    });
    res.json(user);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

router.patch(
  "/preferences",
  authenticate,
  validate(preferencesSchema),
  async (req, res, next) => {
    const userId = req.user.id;
    const { language, theme } = req.body;

    try {
      const data = {};
      if (language) data.language = language;
      if (theme) data.theme = theme;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          language: true,
          theme: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

router.post("/generate-api-token", authenticate, async (req, res, next) => {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: req.user.id },
      data: { apiToken: token },
    });
    res.json({ apiToken: token });
  } catch (error) {
    logger.error("Error generating API token:", error);
    next(error);
  }
});

module.exports = router;
