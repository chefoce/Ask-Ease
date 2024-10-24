const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const validate = require("../middleware/validationMiddleware");
const authenticate = require("../middleware/authenticate");
const Joi = require("joi");
const logger = require("../config/logger");

// Define the validation schema
const registrationSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "nameRequired",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "emailNotValid",
    "string.empty": "emailRequired",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "passwordLength",
    "string.empty": "passwordRequired",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "emailNotValid",
    "string.empty": "emailRequired",
  }),
  password: Joi.string().required().messages({
    "string.empty": "passwordRequired",
  }),
});

// Register a new user
router.post(
  "/register",
  validate(registrationSchema),
  async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({ message: "emailInUse" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

// Login a user
router.post("/login", validate(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "wrongCredentials" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "userBlocked" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "wrongCredentials" });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        theme: user.theme,
        language: user.language,
      },
    });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

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

    res.json({ user });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
