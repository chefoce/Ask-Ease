import formidable from "formidable";
const cloudinary = require("../config/cloudinary");

function upload(req, res, next) {
  const form = formidable({
    allowMultiple: false,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return next(err);
    }

    // Process fields
    const processedFields = {};
    Object.keys(fields).forEach((key) => {
      let value = fields[key];

      // If the value is an array with a single element, extract it
      if (Array.isArray(value) && value.length === 1) {
        value = value[0];
      }

      // Convert "true"/"false" strings to booleans
      if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      }

      processedFields[key] = value;
    });

    req.body = processedFields;

    console.log("Fields:", req.body);
    console.log("Files:", files);

    const file = files.image;
    if (file) {
      // Handle case where 'file' is an array
      const fileToUpload = Array.isArray(file) ? file[0] : file;
      console.log("File to upload:", fileToUpload);

      try {
        const result = await cloudinary.uploader.upload(fileToUpload.filepath, {
          folder: "template_images",
          allowed_formats: ["jpg", "jpeg", "png"],
        });
        req.file = { path: result.secure_url };
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return next(error);
      }
    } else {
      req.file = null;
    }

    next();
  });
}

module.exports = upload;
