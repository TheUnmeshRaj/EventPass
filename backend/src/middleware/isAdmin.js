// Simple admin-check middleware. Integrate with your auth (req.user).
// Ensure your authentication middleware runs before this (so req.user is set).
module.exports = function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  // Adjust property name as per your user model (e.g. role === "admin" or isAdmin boolean)
  if (req.user.role === "admin" || req.user.isAdmin) return next();
  return res.status(403).json({ message: "Admin access required" });
};