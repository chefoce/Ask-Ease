const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const upload = require("../middleware/uploadMiddleware");
const Joi = require("joi");
const validate = require("../middleware/validationMiddleware");
const logger = require("../config/logger");
const checkBlocked = require("../middleware/checkBlocked");
const validateObjectId = require("../middleware/validateObjectId");
const parseJsonFields = require("../middleware/parseJsonFields");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const assignTemplateAccess = require("../utils/assignTemplateAccess");

const questionSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("").default(""),
  type: Joi.string()
    .valid(
      "single-line",
      "multi-line",
      "positive-integer",
      "checkbox",
      "select"
    )
    .required(),
  options: Joi.array()
    .items(Joi.string())
    .when("type", {
      is: Joi.valid("checkbox", "select"),
      then: Joi.required(),
      otherwise: Joi.optional().default([]),
    }),
  showInTable: Joi.boolean().default(false),
});

const templateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  topicId: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  isPublic: Joi.boolean().truthy("true").falsy("false").required(),
  accessUserIds: Joi.array().items(Joi.string()).optional().default([]),
  questions: Joi.array().items(questionSchema).required(),
});

// Create a new template
router.post(
  "/",
  authenticate,
  checkBlocked,
  upload.single("image"),
  parseJsonFields,
  validate(templateSchema),
  async (req, res, next) => {
    const {
      title,
      description,
      topicId,
      tags = [],
      isPublic,
      accessUserIds = [],
      questions = [],
    } = req.body;
    const userId = req.user.id;
    let imageUrl = null;

    try {
      // If a file has been uploaded, upload it to Cloudinary
      if (req.file) {
        const streamUpload = (fileBuffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "template_images",
                allowed_formats: ["jpg", "jpeg", "png"],
              },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );
            streamifier.createReadStream(fileBuffer).pipe(stream);
          });
        };

        try {
          const result = await streamUpload(req.file.buffer);
          imageUrl = result.secure_url;
        } catch (error) {
          console.error("Error uploading to Cloudinary:", error);
          return next(error);
        }
      }

      // Validate that the topic exists
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (!topic) {
        return res
          .status(400)
          .json({ message: "Invalid topicId: Topic does not exist." });
      }

      // Create the template
      const template = await prisma.template.create({
        data: {
          title,
          description,
          topicId,
          tags,
          isPublic,
          imageUrl,
          authorId: userId,
          questions: {
            create: questions.map((q) => ({
              title: q.title,
              description: q.description,
              type: q.type,
              options: q.options || [],
              showInTable: q.showInTable || false,
            })),
          },
        },
        include: {
          author: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true } },
          questions: true,
        },
      });

      // Grant access to specific users if the template is not public
      if (!isPublic && accessUserIds.length > 0) {
        try {
          await assignTemplateAccess(template.id, accessUserIds);
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }
      }

      res.status(201).json(template);
    } catch (error) {
      logger.error(`Error creating template: ${error.message}`);
      next(error);
    }
  }
);

// Route to search users by name or email
router.get("/search", authenticate, async (req, res, next) => {
  const { query } = req.query;

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10, // Limit results
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get templates created by the authenticated user
router.get("/my", authenticate, checkBlocked, async (req, res, next) => {
  const userId = req.user.id;

  try {
    const templates = await prisma.template.findMany({
      where: { authorId: userId },
      include: {
        questions: true,
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        forms: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            likes: true,
            forms: true,
          },
        },
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

// Get templates with optional search, filtering, and sorting
router.get("/", async (req, res, next) => {
  const {
    search,
    tags,
    topic,
    sort = "latest",
    page = 1,
    limit = 10,
  } = req.query;

  try {
    const where = {
      isPublic: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    if (tags) {
      where.tags = { hasSome: tags.split(",") };
    }

    if (topic) {
      where.topicId = topic;
    }

    let orderBy;
    if (sort === "latest") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "popular") {
      orderBy = { popularityScore: "desc" };
    } else {
      orderBy = { createdAt: "desc" }; // default
    }

    // Get templates with pagination
    const templates = await prisma.template.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        author: { select: { id: true, name: true } },
        _count: {
          select: { likes: true },
        },
      },
      orderBy,
    });

    res.json(templates);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Get a specific template
router.get("/:id", validateObjectId, async (req, res, next) => {
  const { id } = req.params;

  try {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
        questions: true,
        comments: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        forms: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: true,
        // Include users with access through TemplateAccess
        templateAccesses: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Format users with access
    const accessUsers = template.templateAccesses.map((access) => access.user);

    const { templateAccesses, ...templateData } = template;

    res.json({ ...templateData, accessUsers });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Update a template
router.put(
  "/:id",
  authenticate,
  checkBlocked,
  upload.single("image"),
  parseJsonFields,
  validateObjectId,
  validate(templateSchema),
  async (req, res, next) => {
    const { id } = req.params;
    const {
      title,
      description,
      topicId,
      tags,
      isPublic,
      accessUserIds = [],
      questions,
    } = req.body;
    const userId = req.user.id;

    try {
      // Verify if the template exists and get the author
      const template = await prisma.template.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Verify if the user is the author or an admin
      if (template.authorId !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      let imageUrl = template.imageUrl;

      // Upload the new image to Cloudinary if provided
      if (req.file) {
        try {
          const result = await streamUpload(req.file.buffer);
          imageUrl = result.secure_url;
        } catch (error) {
          console.error("Error uploading to Cloudinary:", error);
          return next(error);
        }
      }

      // Update the template with the new data
      const updatedTemplate = await prisma.template.update({
        where: { id },
        data: {
          title,
          description,
          topicId,
          tags,
          isPublic,
          imageUrl,
          updatedAt: new Date(),
        },
      });

      // Handle questions
      if (questions && questions.length > 0) {
        // Delete existing questions
        await prisma.question.deleteMany({
          where: { templateId: id },
        });

        // Create new questions
        await prisma.question.createMany({
          data: questions.map((q) => ({
            title: q.title,
            description: q.description,
            type: q.type,
            options: q.options || [],
            showInTable: q.showInTable || false,
            templateId: id,
          })),
        });
      }

      // Handle accessUserIds only if the template is private
      if (!isPublic) {
        // Delete existing accesses
        await prisma.templateAccess.deleteMany({
          where: { templateId: id },
        });

        if (accessUserIds.length > 0) {
          try {
            await assignTemplateAccess(id, accessUserIds);
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        }
      } else {
        // If the template is public, delete all accesses
        await prisma.templateAccess.deleteMany({
          where: { templateId: id },
        });
      }

      res.json(updatedTemplate);
    } catch (error) {
      logger.error(`Error updating template: ${error.message}`);
      next(error);
    }
  }
);

// Delete a template
router.delete(
  "/:id",
  authenticate,
  checkBlocked,
  validateObjectId,
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      // Verify if the user is the author or an admin
      const template = await prisma.template.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      if (template.authorId !== userId) {
        // Verify if the user is an admin
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await prisma.$transaction([
        // Delete related questions
        prisma.question.deleteMany({
          where: { templateId: id },
        }),

        // Delete related forms
        prisma.form.deleteMany({
          where: { templateId: id },
        }),

        // Delete related comments
        prisma.comment.deleteMany({
          where: { templateId: id },
        }),

        // Delete related likes
        prisma.like.deleteMany({
          where: { templateId: id },
        }),

        // Delete template accesses
        prisma.templateAccess.deleteMany({
          where: { templateId: id },
        }),

        // Delete the template
        prisma.template.delete({
          where: { id },
        }),
      ]);

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      logger.error(error.message);
      next(error);
    }
  }
);

module.exports = router;
