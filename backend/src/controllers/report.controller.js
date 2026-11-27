import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Ride from "../models/Ride.js";
import Report from "../models/Report.js";

const reportTypes = new Set(["safety", "behavior", "payment", "other"]);

export const createReportController = ({
  BookingModel = Booking,
  RideModel = Ride,
  ReportModel = Report,
  isValidObjectId = mongoose.isValidObjectId,
  logger = console,
} = {}) => async (req, res) => {
  try {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (field) => !["bookingId", "type", "description"].includes(field)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Only bookingId, type, and description are accepted",
      });
    }
    if (!isValidObjectId(body.bookingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid bookingId is required",
      });
    }
    if (!reportTypes.has(body.type)) {
      return res.status(400).json({
        success: false,
        message: "type must be safety, behavior, payment, or other",
      });
    }
    if (
      typeof body.description !== "string" ||
      body.description.trim().length < 10 ||
      body.description.trim().length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "description must be between 10 and 5000 characters",
      });
    }

    const booking = await BookingModel.findById(body.bookingId).select("ride passenger");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    const ride = await RideModel.findById(booking.ride).select("driver");
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }
    if (
      String(booking.passenger) !== String(req.user._id) &&
      String(ride.driver) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the passenger or ride driver can report this booking",
      });
    }

    const report = await ReportModel.create({
      user: req.user._id,
      booking: booking._id,
      type: body.type,
      description: body.description.trim(),
    });
    return res.status(201).json({
      success: true,
      message: "Report submitted for administrator review",
      report: {
        id: report._id,
        booking: report.booking,
        type: report.type,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    logger.error("Create report error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to submit report",
    });
  }
};

export const createReport = createReportController();
