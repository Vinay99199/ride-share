
import DriverApplication from "../models/DriverApplication.js";

export const getPendingDriverApplications = async (req, res) => {
  try {
    const applications = await DriverApplication.find({ status: "pending" })
      .populate("user", "name email phone organization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Fetch pending applications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch driver applications",
    });
  }
};


export const reviewDriverApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected",
      });
    }

    const application = await DriverApplication.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Driver application not found",
      });
    }

    if (application.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "This application has already been reviewed",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Driver application ${status} successfully`,
      application: {
        id: application._id,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Review driver application error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to review driver application",
    });
  }
};

