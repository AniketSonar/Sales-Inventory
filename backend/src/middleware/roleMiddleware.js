const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
    }
    const userRole = req.user.role?.toLowerCase();
    const authorized = allowedRoles.map(r => r.toLowerCase()).includes(userRole);
    if (!authorized && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied: unauthorized role." });
    }
    next();
  };
};

module.exports = authorizeRoles;
