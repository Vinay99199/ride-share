import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import { emitUserNotification } from "../realtime/tracking.socket.js";

const publicNotification = (notification) => ({
  _id: notification._id,
  recipient: notification.recipient,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  relatedRide: notification.relatedRide,
  relatedBooking: notification.relatedBooking,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

export const createNotificationService = ({
  NotificationModel = Notification,
  BookingModel = Booking,
  emitToUser = emitUserNotification,
  logger = console,
} = {}) => {
  const createNotification = async (notificationData) => {
    let notification;
    try {
      notification = await NotificationModel.create(notificationData);
    } catch (error) {
      if (error.code === 11000) {
        return null;
      }
      throw error;
    }

    await emitToUser(
      String(notification.recipient),
      publicNotification(notification)
    );
    return notification;
  };

  const notifyAfterCommit = async (notifications) => {
    const results = await Promise.allSettled(
      notifications.map(createNotification)
    );
    for (const result of results) {
      if (result.status === "rejected") {
        logger.error("Notification delivery error:", result.reason.message);
      }
    }
  };

  const notifyConfirmedRidePassengers = async (
    rideId,
    type,
    title,
    message
  ) => {
    let bookings;
    try {
      bookings = await BookingModel.find({
        ride: rideId,
        status: "confirmed",
        isActive: true,
      }).select("passenger");
    } catch (error) {
      logger.error("Fetch confirmed passengers for notifications error:", error.message);
      return;
    }

    const recipients = [...new Set(bookings.map((booking) => String(booking.passenger)))];
    await notifyAfterCommit(
      recipients.map((recipient) => ({
        recipient,
        type,
        title,
        message,
        relatedRide: rideId,
        eventKey: `ride:${rideId}:${type}:${recipient}`,
      }))
    );
  };

  return {
    createNotification,
    notifyAfterCommit,
    notifyConfirmedRidePassengers,
  };
};

const notificationService = createNotificationService();

export default notificationService;
