const axios = require("axios");

const jiraInstance = axios.create({
  baseURL: `https://${process.env.JIRA_HOST}`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(
      `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`
    ).toString("base64")}`,
  },
});

module.exports = jiraInstance;
