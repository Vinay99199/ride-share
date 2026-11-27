
import DriverApplication from "../models/DriverApplication.js";

export const createRequireApprovedDriver = ({
  DriverApplicationModel = DriverApplication,
  logger = console,
} = {}) => async (req, res, next) => {
  try {
    if (!["user", "driver"].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Driver access required",
      });
    }

    const approvedApplication = await DriverApplicationModel.findOne({
      user: req.user._id,
      status: "approved",
    });

    if (!approvedApplication) {
      return res.status(403).json({
        success: false,
        message: "Approved driver application required",
      });
    }

    req.driverApplication = approvedApplication;
    next();
  } catch (error) {
    logger.error("Driver authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify driver permissions",
    });
  }
};

const requireApprovedDriver = createRequireApprovedDriver();

export default requireApprovedDriver;
