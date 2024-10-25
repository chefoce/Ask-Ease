// Exports a rate limiter middleware for the API routes.
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  handler: (req, res /*next*/) => {
    res.status(429).json({
      status: "error",
      message: "Too many requests from this IP, please try again later.",
    });
  },
  headers: true,
});

module.exports = apiLimiter;
