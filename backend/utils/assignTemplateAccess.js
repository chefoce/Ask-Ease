const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function assignTemplateAccess(templateId, accessUserIds) {
  // Validate that the users exist
  const usersExist = await prisma.user.findMany({
    where: {
      id: { in: accessUserIds },
    },
    select: { id: true },
  });

  const existingUserIds = usersExist.map((user) => user.id);

  // Filter the accessUserIds that do not exist
  const validAccessUserIds = accessUserIds.filter((uid) =>
    existingUserIds.includes(uid)
  );

  if (accessUserIds.length !== validAccessUserIds.length) {
    throw new Error("One or more accessUserIds are invalid.");
  }

  // Get IDs of users who already have access to the template
  const existingAccesses = await prisma.templateAccess.findMany({
    where: {
      templateId: templateId,
      userId: { in: validAccessUserIds },
    },
    select: { userId: true },
  });

  const existingAccessUserIds = existingAccesses.map((access) => access.userId);

  // Filter the userIds that do not yet have access
  const newAccessUserIds = validAccessUserIds.filter(
    (uid) => !existingAccessUserIds.includes(uid)
  );

  // Create new entries only for users who do not have access
  if (newAccessUserIds.length > 0) {
    const accessEntries = newAccessUserIds.map((uid) => ({
      userId: uid,
      templateId: templateId,
    }));

    await prisma.templateAccess.createMany({
      data: accessEntries,
    });
  }
}

module.exports = assignTemplateAccess;
