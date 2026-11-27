import mongoose from "mongoose";

export const notificationTypes = [
  "booking_requested",
  "booking_confirmed",
  "booking_rejected",
  "booking_cancelled_by_passenger",
  "booking_cancelled_by_driver",
  "ride_started",
  "ride_completed",
  "ride_cancelled",
  "driver_application_approved",
  "driver_application_rejected",
  "identity_verification_approved",
  "identity_verification_rejected",
  "account_security",
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: notificationTypes,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },
    eventKey: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  type: 1,
  createdAt: -1,
});
notificationSchema.index({ eventKey: 1 }, { unique: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
