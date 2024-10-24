const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isAdmin = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user && user.isAdmin;
};

const isTemplateAuthor = async (templateId, userId) => {
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  return template && template.authorId === userId;
};

module.exports = {
  isAdmin,
  isTemplateAuthor,
};
