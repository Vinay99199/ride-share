const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role === "superAdmin") return next();

  return res.status(403).json({
    success: false,
    message: "SuperAdmin permission required",
  });
};

export default requireSuperAdmin;
