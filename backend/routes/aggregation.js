const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { isTemplateAuthor, isAdmin } = require("../utils/permissions");
const logger = require("../config/logger");

// Get aggregated results for a template
// Agregar en la ruta del backend para obtener más información sobre los formularios
router.get("/template/:templateId", authenticate, async (req, res, next) => {
  const { templateId } = req.params;
  const userId = req.user.id;

  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { questions: true },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const isAuthor = await isTemplateAuthor(templateId, userId);
    const userIsAdmin = await isAdmin(userId);
    if (!isAuthor && !userIsAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const forms = await prisma.form.findMany({
      where: { templateId },
      select: { answers: true, createdAt: true, userId: true },
      orderBy: { createdAt: "desc" },
    });

    const aggregation = {};

    for (const question of template.questions) {
      const { id, title, type } = question;
      const answersForQuestion = forms
        .map((form) => form.answers[id])
        .filter((ans) => ans !== undefined);

      if (answersForQuestion.length === 0) continue;

      switch (type) {
        case "positive-integer":
          const numbers = answersForQuestion
            .map(Number)
            .filter((n) => !isNaN(n));
          const sum = numbers.reduce((a, b) => a + b, 0);
          const avg = sum / numbers.length;
          aggregation[title] = { average: parseFloat(avg.toFixed(1)) }; // Limita a 1 decimal
          break;
        case "single-line":
        case "multi-line":
        case "select":
        case "checkbox":
          const answerCounts = {};
          for (const ans of answersForQuestion) {
            answerCounts[ans] = (answerCounts[ans] || 0) + 1;
          }
          const mostCommonAnswer = Object.keys(answerCounts).reduce((a, b) =>
            answerCounts[a] > answerCounts[b] ? a : b
          );
          aggregation[title] = { mostCommonAnswer };
          break;
        default:
          break;
      }
    }

    const responseCount = forms.length;
    const lastResponseDate = forms[0]?.createdAt;
    const lastResponder = forms[0]?.userId
      ? await prisma.user.findUnique({
          where: { id: forms[0].userId },
          select: { name: true },
        })
      : null;

    res.json({
      aggregation,
      responseCount,
      lastResponseDate,
      lastResponder: lastResponder?.name || null,
    });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
