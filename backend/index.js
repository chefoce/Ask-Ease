require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const logger = require("./config/logger");
const morgan = require("morgan");
const http = require("http");
const server = http.createServer(app);
const socketIo = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Frontend URL
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());
app.set("socketIo", socketIo);
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Apply rate limiter before routes
const apiLimiter = require("./middleware/rateLimiter");
app.use("/api/", apiLimiter);

// Import routes
const authRoutes = require("./routes/auth");
const templateRoutes = require("./routes/templates");
const formRoutes = require("./routes/forms");
const adminRoutes = require("./routes/admin");
const templateAccessRoutes = require("./routes/templateAccess");
const topicRoutes = require("./routes/topic");
const commentRoutes = require("./routes/comments");
const likeRoutes = require("./routes/likes");
const searchRoutes = require("./routes/search");
const tagRoutes = require("./routes/tags");
const userRoutes = require("./routes/users");
const aggregationRoutes = require("./routes/aggregation");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/template-access", templateAccessRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/users", userRoutes);
app.use("/api/aggregation", aggregationRoutes);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;

// Socket.io for real-time comments
socketIo.on("connection", (socket) => {
  logger.info("New client connected");

  socket.on("joinTemplate", (templateId) => {
    socket.join(templateId);
  });

  socket.on("disconnect", () => {
    logger.info("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
