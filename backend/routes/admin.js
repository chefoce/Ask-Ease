const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorizeAdmin = require("../middleware/authorizeAdmin");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");

// Get all users
router.get("/users", authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isBlocked: true,
      },
    });
    res.json(users);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Block or unblock a user
router.patch(
  "/users/:id/block",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    const { isBlocked } = req.body;

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isBlocked,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isBlocked: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

// Promote or demote a user to admin
router.patch(
  "/users/:id/admin",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    const { isAdmin } = req.body;

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isAdmin,
        },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          isBlocked: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

// Delete a user
router.delete(
  "/users/:id",
  authenticate,
  authorizeAdmin,
  async (req, res, next) => {
    const { id } = req.params;

    try {
      // Start a transaction to ensure atomicity
      await prisma.$transaction([
        // Delete user's comments
        prisma.comment.deleteMany({ where: { userId: id } }),

        // Delete user's likes
        prisma.like.deleteMany({ where: { userId: id } }),

        // Delete user's forms
        prisma.form.deleteMany({ where: { userId: id } }),

        // Delete user's templates and related data
        prisma.templateAccess.deleteMany({
          where: {
            template: { authorId: id },
          },
        }),
        prisma.like.deleteMany({
          where: {
            template: { authorId: id },
          },
        }),
        prisma.comment.deleteMany({
          where: {
            template: { authorId: id },
          },
        }),
        prisma.form.deleteMany({
          where: {
            template: { authorId: id },
          },
        }),
        prisma.question.deleteMany({
          where: {
            template: { authorId: id },
          },
        }),
        prisma.template.deleteMany({ where: { authorId: id } }),

        // Delete user's template accesses
        prisma.templateAccess.deleteMany({ where: { userId: id } }),

        // Delete the user
        prisma.user.delete({ where: { id } }),
      ]);

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

module.exports = router;
