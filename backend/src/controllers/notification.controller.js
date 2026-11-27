import mongoose from "mongoose";
import Notification, { notificationTypes } from "../models/Notification.js";

const positiveIntegerQuery = (value, defaultValue, maximum) => {
  if (value === undefined) {
    return defaultValue;
  }
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1 ||
    Number(value) > maximum
  ) {
    return null;
  }
  return Number(value);
};

const respondWithError = (res, error, operation) => {
  console.error(`${operation} notifications error:`, error.message);
  return res.status(500).json({
    success: false,
    message: `Unable to ${operation} notifications`,
  });
};

export const createNotificationController = ({
  NotificationModel = Notification,
} = {}) => ({
  listNotifications: async (req, res) => {
    const allowedQuery = new Set(["page", "limit", "read", "type"]);
    if (Object.keys(req.query ?? {}).some((key) => !allowedQuery.has(key))) {
      return res.status(400).json({
        success: false,
        message: "Unexpected notification filter",
      });
    }

    const page = positiveIntegerQuery(req.query.page, 1, Number.MAX_SAFE_INTEGER);
    const limit = positiveIntegerQuery(req.query.limit, 20, 100);
    const read = req.query.read ?? "all";
    const type = req.query.type;
    if (
      page === null ||
      limit === null ||
      !Number.isSafeInteger((page - 1) * limit) ||
      !["all", "read", "unread"].includes(read) ||
      (type !== undefined && !notificationTypes.includes(type))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid page, limit, read status, or notification type",
      });
    }

    try {
      const filter = { recipient: req.user._id };
      if (read !== "all") filter.isRead = read === "read";
      if (type !== undefined) filter.type = type;
      const [notifications, total, unreadCount] = await Promise.all([
        NotificationModel.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        NotificationModel.countDocuments(filter),
        NotificationModel.countDocuments({ ...filter, isRead: false }),
      ]);
      return res.status(200).json({
        success: true,
        count: notifications.length,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        notifications,
      });
    } catch (error) {
      return respondWithError(res, error, "fetch");
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const count = await NotificationModel.countDocuments({
        recipient: req.user._id,
        isRead: false,
      });
      return res.status(200).json({ success: true, count });
    } catch (error) {
      return respondWithError(res, error, "count");
    }
  },

  markNotificationRead: async (req, res) => {
    const { notificationId } = req.params;
    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    try {
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, recipient: req.user._id },
        { $set: { isRead: true } },
        { new: true, runValidators: true }
      );
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
      return res.status(200).json({ success: true, notification });
    } catch (error) {
      return respondWithError(res, error, "mark");
    }
  },

  markAllNotificationsRead: async (req, res) => {
    try {
      const result = await NotificationModel.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );
      return res.status(200).json({
        success: true,
        modifiedCount: result.modifiedCount,
      });
    } catch (error) {
      return respondWithError(res, error, "mark");
    }
  },

  deleteNotification: async (req, res) => {
    const { notificationId } = req.params;
    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    try {
      const notification = await NotificationModel.findOneAndDelete({
        _id: notificationId,
        recipient: req.user._id,
      });
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      return respondWithError(res, error, "delete");
    }
  },
});

const notificationController = createNotificationController();

export const listNotifications = notificationController.listNotifications;
export const getUnreadCount = notificationController.getUnreadCount;
export const markNotificationRead = notificationController.markNotificationRead;
export const markAllNotificationsRead =
  notificationController.markAllNotificationsRead;
export const deleteNotification = notificationController.deleteNotification;
