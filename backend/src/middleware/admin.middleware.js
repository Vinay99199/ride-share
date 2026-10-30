
const admin = (req, res, next) => {
  if (
    req.user &&
    ["organizationAdmin", "superAdmin"].includes(req.user.role)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Admin permission required.",
  });
};

export default admin;
