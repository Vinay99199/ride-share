import DriverApplication from "../models/DriverApplication.js";

export const createRequirePassenger = ({
  DriverApplicationModel = DriverApplication,
  logger = console,
} = {}) => async (req, res, next) => {
  if (["user", "passenger"].includes(req.user?.role)) {
    return next();
  }
  if (req.user?.role !== "driver") {
    return res.status(403).json({
      success: false,
      message: "Passenger access required",
    });
  }

  try {
    const application = await DriverApplicationModel.findOne({
      user: req.user._id,
      status: "approved",
    }).select("_id");
    if (!application) {
      return res.status(403).json({
        success: false,
        message: "Approved driver access required",
      });
    }
    return next();
  } catch (error) {
    logger.error("Passenger authorization error:", error.message);
    return res.status(503).json({
      success: false,
      message: "Unable to verify passenger permissions",
    });
  }
};

const requirePassenger = createRequirePassenger();

export default requirePassenger;
