const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

// Grant access to a template
router.post('/grant', authenticate, async (req, res, next) => {
  const { templateId, userIds } = req.body;
  const userId = req.user.id;

  try {
    // Check if the template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if the user is the author or admin
    if (template.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Grant access to users
    const templateAccessData = userIds.map((uid) => ({
      templateId,
      userId: uid,
    }));

    await prisma.templateAccess.createMany({
      data: templateAccessData,
    });

    res.status(201).json({ message: 'Access granted successfully' });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

// Revoke access to a template
router.post('/revoke', authenticate, async (req, res, next) => {
  const { templateId, userIds } = req.body;
  const userId = req.user.id;

  try {
    // Check if the template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if the user is the author or admin
    if (template.authorId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Revoke access from users
    await prisma.templateAccess.deleteMany({
      where: {
        templateId,
        userId: { in: userIds },
      },
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
});

module.exports = router;
