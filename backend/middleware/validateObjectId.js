/// Check if the ID is valid or not
const { ObjectId } = require("mongodb");

module.exports = (req, res, next) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  next();
};
