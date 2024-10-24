// Middleware to upload files to Cloudinary
const multer = require("multer");

const storage = multer.memoryStorage(); // Store the file in memory to upload directly to Cloudinary

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit the file size to 5MB
  },
});

module.exports = upload;
