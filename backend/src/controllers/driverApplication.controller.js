import DriverApplication from "../models/DriverApplication.js";

export const applyForDriver = async (req, res) => {
  try {
    const { licenseNumber, vehicleNumber, vehicleType } = req.body;

    // Validate required fields
    if (!licenseNumber?.trim() || !vehicleNumber?.trim() || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "License number, vehicle number, and vehicle type are required",
      });
    }

    // Validate vehicle type
    if (!["car", "bike"].includes(vehicleType)) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type must be car or bike",
      });
    }

    // Check for an existing pending application
    const existingApplication = await DriverApplication.findOne({
      user: req.user._id,
      status: "pending",
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending driver application",
      });
    }

    // Create application
    const application = await DriverApplication.create({
      user: req.user._id,
      licenseNumber: licenseNumber.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType,
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
    console.error("Driver application error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit driver application",
    });
  }
};
