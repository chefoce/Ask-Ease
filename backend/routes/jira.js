const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const jira = require("../config/jira");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkIfUserExists(email) {
  try {
    const response = await jira.get(
      `/rest/api/3/user/search?query=${encodeURIComponent(email)}`
    );
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error(
      "Error checking user existence:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function createCustomerInJira(email, displayName) {
  try {
    const response = await jira.post("/rest/api/3/user", {
      emailAddress: email,
      displayName: displayName,
      notification: false,
      applicationKeys: ["jira-servicemanagement", "jira-software"],
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error creating customer:",
      error.response?.data || error.message
    );
    throw error;
  }
}

router.post("/tickets", authenticate, async (req, res, next) => {
  const { summary, priority, link } = req.body;

  try {
    const user = req.user;
    const projectKey = process.env.JIRA_PROJECT_KEY;

    let jiraUser = await checkIfUserExists(user.email);

    if (!jiraUser) {
      jiraUser = await createCustomerInJira(user.email, user.name);
    }

    if (!jiraUser.accountId) {
      throw new Error("Unable to retrieve Jira user accountId.");
    }

    const description = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: summary,
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Reported by: ${user.email}`,
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Link: ",
            },
            {
              type: "text",
              text: link,
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: link,
                  },
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Go back to AskEase App",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href:
                      process.env.ASKEASE_APP_URL || "https://default-url.com",
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const issueResponse = await jira.post("/rest/api/3/issue", {
      fields: {
        project: { key: projectKey },
        summary,
        description, // Use the ADF format for the description
        issuetype: { name: "Task" },
        priority: { name: priority },
        reporter: { accountId: jiraUser.accountId },
        labels: ["Support"],
      },
    });

    const issue = issueResponse.data;

    await prisma.ticket.create({
      data: {
        userId: user.id,
        jiraTicketId: issue.id,
        summary,
        priority,
        status: "Opened",
        link: `https://${process.env.JIRA_HOST}/browse/${issue.key}`,
      },
    });

    res.json({
      message: "Ticket creado con éxito",
      ticketLink: `https://${process.env.JIRA_HOST}/browse/${issue.key}`,
    });
  } catch (error) {
    console.error(
      "Error creando ticket:",
      error.response?.data || error.message
    );
    next(error);
  }
});

router.get("/tickets", authenticate, async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.id },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    next(error);
  }
});

module.exports = router;
