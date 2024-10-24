// Initiate the authorizeAdmin middleware function to check if the user is an admin or not.
module.exports = function authorizeAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};
