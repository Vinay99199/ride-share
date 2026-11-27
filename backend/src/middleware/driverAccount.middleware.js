const requireDriverAccount = (req, res, next) => {
  if (!["user", "driver"].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "Driver account access required",
    });
  }
  return next();
};

export default requireDriverAccount;
