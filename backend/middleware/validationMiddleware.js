const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    const validationResult = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (validationResult.error) {
      const errors = validationResult.error.details.map((err) => err.message);
      return res.status(400).json({ message: errors });
    }
    req.body = validationResult.value; // Use the sanitized value
    next();
  };
};

module.exports = validate;
