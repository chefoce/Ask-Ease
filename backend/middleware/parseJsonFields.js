/// Middleware to parse JSON fields in POST and PUT requests
module.exports = (req, res, next) => {
  const jsonFields = ["tags", "accessUserIds", "questions"];

  jsonFields.forEach((field) => {
    if (req.body[field]) {
      if (typeof req.body[field] === "string") {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (err) {
          return res
            .status(400)
            .json({ message: `Invalid JSON format for ${field}` });
        }
      }
    } else {
      // Assign default value if the field is undefined
      req.body[field] = [];
    }
  });

  // Convert isPublic to boolean and assign default value if it is undefined
  if (typeof req.body.isPublic === "string") {
    req.body.isPublic = req.body.isPublic === "true";
  } else if (typeof req.body.isPublic === "undefined") {
    req.body.isPublic = true; // Default value
  }

  next();
};
