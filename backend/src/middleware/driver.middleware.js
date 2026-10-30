
import DriverApplication from "../models/DriverApplication.js";

const requireApprovedDriver = async (req, res, next) => {
  try {
    const approvedApplication = await DriverApplication.findOne({
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
    console.error("Driver authorization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify driver permissions",
    });
  }
};

export default requireApprovedDriver;
