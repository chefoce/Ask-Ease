const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const checkBlocked = require("../middleware/checkBlocked");
const validate = require("../middleware/validationMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const parseJsonFields = require("../middleware/parseJsonFields");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");
const Joi = require("joi");

// Joi schema for initial request validation
const formSchema = Joi.object({
  templateId: Joi.string().required(),
  answers: Joi.object().required(),
});

// Function to validate if a string is a valid ObjectId
const isValidObjectId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};

// Create a new form (fill out a template)
router.post(
  "/",
  authenticate,
  checkBlocked,
  parseJsonFields, // If you need to parse JSON fields in multipart/form-data
  validate(formSchema),
  async (req, res, next) => {
    const { templateId, answers } = req.body;
    const userId = req.user.id;

    try {
      // Validate templateId as ObjectId
      if (!isValidObjectId(templateId)) {
        return res.status(400).json({ message: "Invalid templateId" });
      }

      // Get the template and its questions
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        include: {
          questions: true,
        },
      });

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Check if the user has access
      if (!template.isPublic && template.authorId !== userId) {
        const access = await prisma.templateAccess.findFirst({
          where: {
            templateId,
            userId,
          },
        });

        if (!access) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Validation of answers
      const errors = [];
      const validatedAnswers = {};
      for (const question of template.questions) {
        let answer = answers[question.id];

        // Check if the answer exists
        if (answer === undefined || answer === null || answer === "") {
          errors.push({
            questionId: question.id,
            message: "This field is required",
          });
          continue;
        }

        switch (question.type) {
          case "single-line":
          case "multi-line":
            if (typeof answer !== "string") {
              errors.push({
                questionId: question.id,
                message: "Invalid answer format",
              });
            } else {
              validatedAnswers[question.id] = answer;
            }
            break;
          case "positive-integer":
            const posIntValue = parseInt(answer, 10);
            if (isNaN(posIntValue) || posIntValue < 1) {
              errors.push({
                questionId: question.id,
                message: "Please enter a positive integer",
              });
            } else {
              validatedAnswers[question.id] = posIntValue;
            }
            break;
          case "checkbox":
            if (!Array.isArray(answer)) {
              errors.push({
                questionId: question.id,
                message: "Invalid answer format",
              });
            } else {
              const invalidOption = answer.find(
                (option) => !question.options.includes(option)
              );
              if (invalidOption) {
                errors.push({
                  questionId: question.id,
                  message: `Invalid option selected: ${invalidOption}`,
                });
              } else {
                validatedAnswers[question.id] = answer;
              }
            }
            break;
          case "select":
            if (!question.options.includes(answer)) {
              errors.push({
                questionId: question.id,
                message: "Invalid option selected",
              });
            } else {
              validatedAnswers[question.id] = answer;
            }
            break;
          default:
            errors.push({
              questionId: question.id,
              message: "Unknown question type",
            });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }

      // Create the form
      const form = await prisma.form.create({
        data: {
          template: { connect: { id: templateId } },
          user: { connect: { id: userId } },
          answers: validatedAnswers,
        },
      });

      res.status(201).json(form);
    } catch (error) {
      logger.error(`Error creating form: ${error.message}`);
      next(error);
    }
  }
);

// Get forms filled out by the authenticated user
router.get("/my", authenticate, async (req, res, next) => {
  const userId = req.user.id;
  const { templateId } = req.query;

  try {
    const whereClause = { userId };

    if (templateId) {
      // Validate templateId as ObjectId
      if (!isValidObjectId(templateId)) {
        return res.status(400).json({ message: "Invalid templateId" });
      }
      whereClause.templateId = templateId;
    }

    const forms = await prisma.form.findMany({
      where: whereClause,
      include: {
        template: true,
      },
    });

    res.json(forms);
  } catch (error) {
    logger.error(`Error fetching user forms: ${error.message}`);
    next(error);
  }
});

// Get all forms of a template (accessible to the author and admin)
router.get("/template/:templateId", authenticate, async (req, res, next) => {
  const { templateId } = req.params;
  const userId = req.user.id;

  try {
    // Get the template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if the user is the author or an admin
    if (template.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const forms = await prisma.form.findMany({
      where: { templateId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.json(forms);
  } catch (error) {
    logger.error(`Error fetching forms for template: ${error.message}`);
    next(error);
  }
});

// Get a specific form
router.get("/:id", authenticate, validateObjectId, async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        template: true,
        user: true,
      },
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Check if the user is the owner, the author of the template, or an admin
    if (form.userId !== userId && form.template.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(form);
  } catch (error) {
    logger.error(`Error fetching form: ${error.message}`);
    next(error);
  }
});

// Endpoint to get forms of all templates created by the logged-in user
router.get("/my-templates", authenticate, async (req, res, next) => {
  const userId = req.user.id;

  try {
    // Get all templates created by the user
    const templates = await prisma.template.findMany({
      where: { authorId: userId },
      select: { id: true },
    });

    const templateIds = templates.map((template) => template.id);

    // Get all forms associated with those templates
    const forms = await prisma.form.findMany({
      where: { templateId: { in: templateIds } },
      include: {
        user: { select: { id: true, name: true } },
        template: {
          select: {
            id: true,
            title: true,
            author: { select: { id: true, name: true } },
            questions: true,
          },
        },
      },
    });
    if (templateIds.length === 0) {
      return res.json([]);
    }
    res.json(forms);
  } catch (error) {
    logger.error(`Error fetching forms: ${error.message}`);
    next(error);
  }
});

// Update a form
router.put(
  "/:id",
  authenticate,
  checkBlocked,
  validateObjectId,
  parseJsonFields,
  validate(
    Joi.object({
      answers: Joi.object().required(),
    })
  ),
  async (req, res, next) => {
    const { id } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;

    try {
      const form = await prisma.form.findUnique({
        where: { id },
        include: {
          template: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if the user is the owner, the author of the template, or an admin
      if (form.userId !== userId && form.template.authorId !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Validation of answers
      const errors = [];
      const validatedAnswers = {};
      for (const question of form.template.questions) {
        let answer = answers[question.id];

        if (answer === undefined || answer === null || answer === "") {
          errors.push({
            questionId: question.id,
            message: "This field is required",
          });
          continue;
        }

        switch (question.type) {
          case "single-line":
          case "multi-line":
            if (typeof answer !== "string") {
              errors.push({
                questionId: question.id,
                message: "Invalid answer format",
              });
            } else {
              validatedAnswers[question.id] = answer;
            }
            break;
          case "positive-integer":
            const posIntValue = parseInt(answer, 10);
            if (isNaN(posIntValue) || posIntValue < 1) {
              errors.push({
                questionId: question.id,
                message: "Please enter a positive integer",
              });
            } else {
              validatedAnswers[question.id] = posIntValue;
            }
            break;
          case "checkbox":
            if (!Array.isArray(answer)) {
              errors.push({
                questionId: question.id,
                message: "Invalid answer format",
              });
            } else {
              const invalidOption = answer.find(
                (option) => !question.options.includes(option)
              );
              if (invalidOption) {
                errors.push({
                  questionId: question.id,
                  message: `Invalid option selected: ${invalidOption}`,
                });
              } else {
                validatedAnswers[question.id] = answer;
              }
            }
            break;
          case "select":
            if (!question.options.includes(answer)) {
              errors.push({
                questionId: question.id,
                message: "Invalid option selected",
              });
            } else {
              validatedAnswers[question.id] = answer;
            }
            break;
          default:
            errors.push({
              questionId: question.id,
              message: "Unknown question type",
            });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }

      // Update the form
      const updatedForm = await prisma.form.update({
        where: { id },
        data: {
          answers: validatedAnswers,
        },
      });

      res.json(updatedForm);
    } catch (error) {
      logger.error(`Error updating form: ${error.message}`);
      next(error);
    }
  }
);

// Delete a form
router.delete(
  "/:id",
  authenticate,
  checkBlocked,
  validateObjectId,
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const form = await prisma.form.findUnique({
        where: { id },
        include: {
          template: true,
        },
      });

      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      // Check if the user is the owner, the author of the template, or an admin
      if (form.userId !== userId && form.template.authorId !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Delete the form
      await prisma.form.delete({
        where: { id },
      });

      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      logger.error(`Error deleting form: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router;
