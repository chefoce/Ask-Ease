// backend/routes/api.js

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../config/logger");

router.get("/templates/:templateId/aggregated", async (req, res) => {
  const { templateId } = req.params;
  const apiToken = req.header("X-API-Token");

  if (!apiToken) {
    return res.status(401).json({ message: "API token required" });
  }

  try {
    // Find user by API token
    const user = await prisma.user.findUnique({
      where: { apiToken },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid API token" });
    }

    // Get template that belongs to the user
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        authorId: user.id,
      },
      include: {
        questions: true,
        forms: {
          select: {
            answers: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      return res
        .status(404)
        .json({ message: "Template not found or access denied" });
    }

    // Calculate aggregations
    const aggregatedData = {
      templateId: template.id,
      title: template.title,
      author: template.author.name,
      questions: template.questions.map((question) => {
        const answers = template.forms
          .map((form) => form.answers[question.id])
          .filter(Boolean);
        let aggregation = {};

        switch (question.type) {
          case "positive-integer":
            const numbers = answers.map(Number);
            aggregation = {
              average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
              min: Math.min(...numbers),
              max: Math.max(...numbers),
            };
            break;
          case "single-line":
          case "multi-line":
            const frequencies = {};
            answers.forEach((ans) => {
              frequencies[ans] = (frequencies[ans] || 0) + 1;
            });
            aggregation = {
              mostCommon: Object.entries(frequencies)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([text, count]) => ({ text, count })),
            };
            break;
          // Handle other question types as needed
        }

        return {
          questionId: question.id,
          text: question.title,
          type: question.type,
          responseCount: answers.length,
          aggregation,
        };
      }),
    };

    res.json(aggregatedData);
  } catch (error) {
    logger.error("Error fetching aggregated data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/templates/import', async (req, res) => {
  const data = req.body;
  // Authenticate the request if necessary

  try {
    const newTemplate = await prisma.template.create({
      data: {
        title: data.title,
        description: data.description || '',
        authorId: /* Assign an author or use a default */,
        questions: {
          create: data.questions.map((q) => ({
            title: q.text,
            type: q.type,
            options: q.options || [],
            // ... other fields ...
          })),
        },
      },
    });
    res.json({ message: 'Template imported successfully', templateId: newTemplate.id });
  } catch (error) {
    logger.error('Error importing template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
