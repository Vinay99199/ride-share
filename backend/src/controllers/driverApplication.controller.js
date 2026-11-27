import DriverApplication from "../models/DriverApplication.js";

const allowedApplicationFields = new Set([
  "licenseNumber",
  "vehicleNumber",
  "vehicleType",
]);

export const createDriverApplicationController = ({
  DriverApplicationModel = DriverApplication,
  logger = console,
} = {}) => ({
  getMyDriverApplication: async (req, res) => {
    try {
      const application = await DriverApplicationModel.findOne({
        user: req.user._id,
      }).sort({ createdAt: -1, _id: -1 });

      if (!application) {
        return res.status(200).json({ success: true, application: null });
      }

      const licenseNumber = String(application.licenseNumber || "");
      return res.status(200).json({
        success: true,
        application: {
          id: application._id,
          userId: req.user._id,
          licenseNumber: licenseNumber
            ? `****${licenseNumber.slice(-4)}`
            : null,
          vehicleNumber: application.vehicleNumber,
          vehicleType: application.vehicleType,
          status: application.status,
          rejectionReason: application.rejectionReason || null,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        },
      });
    } catch (error) {
      logger.error("Fetch own driver application error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to fetch your driver application",
      });
    }
  },

  applyForDriver: async (req, res) => {
    try {
      if (req.user?.role && !["user", "driver"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Only driver accounts can submit a driver application",
        });
      }

      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body) ||
        Object.keys(req.body).some(
          (field) => !allowedApplicationFields.has(field)
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only licenseNumber, vehicleNumber, and vehicleType are accepted",
        });
      }

      const { licenseNumber, vehicleNumber, vehicleType } = req.body;
      if (
        typeof licenseNumber !== "string" ||
        licenseNumber.trim().length < 2 ||
        licenseNumber.trim().length > 120 ||
        typeof vehicleNumber !== "string" ||
        vehicleNumber.trim().length < 2 ||
        vehicleNumber.trim().length > 30 ||
        typeof vehicleType !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "License number must be 2-120 characters and vehicle number 2-30 characters",
        });
      }

      if (!["car", "bike"].includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: "Vehicle type must be car or bike",
        });
      }

      const existingApplication = await DriverApplicationModel.findOne({
        user: req.user._id,
      }).sort({ createdAt: -1, _id: -1 });

      if (req.user.role === "user" && !existingApplication) {
        return res.status(403).json({
          success: false,
          message: "Create a separate driver account to apply for driver access",
        });
      }

      if (existingApplication?.status === "pending") {
        return res.status(409).json({
          success: false,
          message: "You already have a pending driver application",
        });
      }

      if (existingApplication?.status === "approved") {
        return res.status(409).json({
          success: false,
          message: "Your driver application is already approved",
        });
      }

      const application = await DriverApplicationModel.create({
        user: req.user._id,
        licenseNumber: licenseNumber.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Driver application submitted successfully",
        application: {
          id: application._id,
          vehicleType: application.vehicleType,
          status: application.status,
          createdAt: application.createdAt,
        },
      });
    } catch (error) {
      logger.error("Driver application error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to submit driver application",
      });
    }
  },
});

const controller = createDriverApplicationController();

export const getMyDriverApplication = controller.getMyDriverApplication;
export const applyForDriver = controller.applyForDriver;
