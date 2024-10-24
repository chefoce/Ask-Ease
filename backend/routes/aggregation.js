const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { isTemplateAuthor, isAdmin } = require("../utils/permissions");
const logger = require("../config/logger");

// Get aggregated results for a template
router.get("/template/:templateId", authenticate, async (req, res, next) => {
  const { templateId } = req.params;
  const userId = req.user.id;

  try {
    // Check if the template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { questions: true },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Check if user is the author or admin
    const isAuthor = await isTemplateAuthor(templateId, userId);
    const userIsAdmin = await isAdmin(userId);
    if (!isAuthor && !userIsAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get all forms for the template
    const forms = await prisma.form.findMany({
      where: { templateId },
      select: { answers: true },
    });

    const aggregation = {};

    // Aggregate data
    for (const question of template.questions) {
      const { id, title, type } = question;
      const answersForQuestion = forms
        .map((form) => form.answers[id])
        .filter((ans) => ans !== undefined);

      if (answersForQuestion.length === 0) {
        continue;
      }

      switch (type) {
        case "integer":
          const numbers = answersForQuestion
            .map(Number)
            .filter((n) => !isNaN(n));
          const sum = numbers.reduce((a, b) => a + b, 0);
          const avg = sum / numbers.length;
          aggregation[title] = { average: avg };
          break;
        case "single-line":
        case "multi-line":
          const answerCounts = {};
          for (const ans of answersForQuestion) {
            answerCounts[ans] = (answerCounts[ans] || 0) + 1;
          }
          const mostCommonAnswer = Object.keys(answerCounts).reduce((a, b) =>
            answerCounts[a] > answerCounts[b] ? a : b
          );
          aggregation[title] = { mostCommonAnswer };
          break;
        case "checkbox":
          const trueCount = answersForQuestion.filter(
            (ans) => ans === true
          ).length;
          const percentageTrue = (trueCount / answersForQuestion.length) * 100;
          aggregation[title] = { percentageTrue };
          break;
        default:
          break;
      }
    }

    res.json(aggregation);
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
