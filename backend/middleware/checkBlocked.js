/// Check if user is blocked
module.exports = (req, res, next) => {
  if (req.user && req.user.isBlocked) {
    return res.status(403).json({ message: "Your account is blocked" });
  }
  next();
};
