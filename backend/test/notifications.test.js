import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import {
  createNotificationController,
} from "../src/controllers/notification.controller.js";
import { notificationTypes } from "../src/models/Notification.js";
import { createNotificationService } from "../src/services/notification.service.js";
import { hashToken } from "../src/services/session.service.js";
import {
  configureTrackingSockets,
  createSocketAuthentication,
  emitUserNotification,
} from "../src/realtime/tracking.socket.js";

const userA = "65a1234567890abcdef12345";
const userB = "65a1234567890abcdef67890";
const rideId = "65a1234567890abcdef11111";
const bookingId = "65a1234567890abcdef22222";

const createNotificationStore = () => {
  const notifications = [];
  let nextId = 1;
  return {
    notifications,
    model: {
      create: async (data) => {
        if (notifications.some((item) => item.eventKey === data.eventKey)) {
          throw Object.assign(new Error("Duplicate event"), { code: 11000 });
        }
        const notification = {
          _id: String(nextId++).padStart(24, "0"),
          isRead: false,
          createdAt: new Date("2026-11-25T10:00:00.000Z"),
          ...data,
        };
        notifications.push(notification);
        return notification;
      },
    },
  };
};

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const createQuery = (records) => {
  let result = records;
  const query = {
    sort(sortBy) {
      result = [...result].sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime()
      );
      return this;
    },
    skip(count) {
      result = result.slice(count);
      return this;
    },
    limit(count) {
      result = result.slice(0, count);
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return query;
};

const createApiFixture = () => {
  const records = [
    {
      _id: "65a1234567890abcdef10001",
      recipient: userA,
      type: "booking_requested",
      isRead: false,
      createdAt: new Date("2026-11-25T10:00:00.000Z"),
    },
    {
      _id: "65a1234567890abcdef10002",
      recipient: userA,
      type: "booking_confirmed",
      isRead: true,
      createdAt: new Date("2026-11-25T09:00:00.000Z"),
    },
    {
      _id: "65a1234567890abcdef10003",
      recipient: userB,
      type: "ride_started",
      isRead: false,
      createdAt: new Date("2026-11-25T11:00:00.000Z"),
    },
  ];
  const matches = (record, filter) =>
    Object.entries(filter).every(
      ([key, value]) => String(record[key]) === String(value)
    );
  const model = {
    find: (filter) =>
      createQuery(records.filter((record) => matches(record, filter))),
    countDocuments: async (filter) =>
      records.filter((record) => matches(record, filter)).length,
    findOneAndUpdate: async (filter, update) => {
      const record = records.find((item) => matches(item, filter));
      if (record) {
        Object.assign(record, update.$set);
      }
      return record ?? null;
    },
    updateMany: async (filter, update) => {
      const found = records.filter((record) => matches(record, filter));
      found.forEach((record) => Object.assign(record, update.$set));
      return { modifiedCount: found.length };
    },
    findOneAndDelete: async (filter) => {
      const index = records.findIndex((record) => matches(record, filter));
      return index < 0 ? null : records.splice(index, 1)[0];
    },
  };
  return { records, controller: createNotificationController({ NotificationModel: model }) };
};

test("creates each supported notification type once and emits only after persistence", async () => {
  const { model, notifications } = createNotificationStore();
  const emitted = [];
  const service = createNotificationService({
    NotificationModel: model,
    emitToUser: async (recipient, notification) => {
      assert.ok(
        notifications.some((saved) => saved._id === notification._id),
        "notification must be stored before the socket event"
      );
      emitted.push({ recipient, notification });
    },
  });
  const entries = notificationTypes.map((type, index) => ({
    recipient: index % 2 === 0 ? userA : userB,
    type,
    title: `Title ${type}`,
    message: `Message ${type}`,
    relatedRide: type.startsWith("ride_") ? rideId : undefined,
    relatedBooking: type.startsWith("booking_") ? bookingId : undefined,
    eventKey: `event:${type}`,
  }));

  await service.notifyAfterCommit(entries);
  await service.notifyAfterCommit(entries);

  assert.equal(notifications.length, notificationTypes.length);
  assert.equal(emitted.length, notificationTypes.length);
  assert.deepEqual(
    notifications.map((item) => item.type).sort(),
    [...notificationTypes].sort()
  );
  assert.equal(
    emitted.filter((item) => item.recipient === userA).length,
    Math.ceil(notificationTypes.length / 2)
  );
});

test("does not emit when persistence fails and targets only confirmed passengers", async () => {
  const emitted = [];
  const errors = [];
  const service = createNotificationService({
    NotificationModel: {
      create: async () => {
        throw new Error("database unavailable");
      },
    },
    BookingModel: {
      find: (filter) => ({
        select: async () => {
          assert.equal(filter.ride, rideId);
          assert.equal(filter.status, "confirmed");
          assert.equal(filter.isActive, true);
          return [
            { passenger: userA, status: "confirmed", isActive: true },
            { passenger: userA, status: "confirmed", isActive: true },
            { passenger: userB, status: "confirmed", isActive: true },
            { passenger: "65a1234567890abcdef33333", status: "pending", isActive: true },
          ].filter(
            (booking) =>
              booking.status === filter.status &&
              booking.isActive === filter.isActive
          );
        },
      }),
    },
    emitToUser: async (recipient) => emitted.push(recipient),
    logger: { error: (...args) => errors.push(args) },
  });

  await service.notifyAfterCommit([
    {
      recipient: userA,
      type: "booking_requested",
      title: "Request",
      message: "Request",
      eventKey: "failed-event",
    },
  ]);
  assert.deepEqual(emitted, []);
  assert.equal(errors.length, 1);

  const delivered = [];
  const successfulService = createNotificationService({
    NotificationModel: {
      create: async (data) => ({ _id: bookingId, ...data }),
    },
    BookingModel: {
      find: () => ({
        select: async () => [
          { passenger: userA },
          { passenger: userA },
          { passenger: userB },
        ],
      }),
    },
    emitToUser: async (recipient) => delivered.push(recipient),
  });
  await successfulService.notifyConfirmedRidePassengers(
    rideId,
    "ride_started",
    "Started",
    "Ride started"
  );
  assert.deepEqual(delivered.sort(), [userA, userB]);
});

test("notification APIs paginate and restrict every operation to the recipient", async () => {
  const { records, controller } = createApiFixture();
  let response = createResponse();
  await controller.listNotifications(
    { user: { _id: userA }, query: { page: "1", limit: "1" } },
    response
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.total, 2);
  assert.equal(response.body.unreadCount, 1);
  assert.equal(response.body.notifications.length, 1);
  assert.equal(response.body.notifications[0].recipient, userA);

  response = createResponse();
  await controller.getUnreadCount({ user: { _id: userA } }, response);
  assert.equal(response.body.count, 1);

  response = createResponse();
  await controller.markNotificationRead(
    {
      user: { _id: userA },
      params: { notificationId: "65a1234567890abcdef10001" },
    },
    response
  );
  assert.equal(response.statusCode, 200);
  assert.equal(records[0].isRead, true);

  response = createResponse();
  await controller.markNotificationRead(
    {
      user: { _id: userA },
      params: { notificationId: "65a1234567890abcdef10003" },
    },
    response
  );
  assert.equal(response.statusCode, 404);

  records.push({
    _id: "65a1234567890abcdef10004",
    recipient: userA,
    isRead: false,
    createdAt: new Date("2026-11-25T08:00:00.000Z"),
  });
  response = createResponse();
  await controller.markAllNotificationsRead(
    { user: { _id: userA } },
    response
  );
  assert.equal(response.body.modifiedCount, 1);
  assert.equal(records.find((record) => record.recipient === userB).isRead, false);

  response = createResponse();
  await controller.deleteNotification(
    {
      user: { _id: userA },
      params: { notificationId: "65a1234567890abcdef10003" },
    },
    response
  );
  assert.equal(response.statusCode, 404);
  assert.equal(records.length, 4);

  response = createResponse();
  await controller.deleteNotification(
    {
      user: { _id: userA },
      params: { notificationId: "65a1234567890abcdef10002" },
    },
    response
  );
  assert.equal(response.statusCode, 200);
  assert.equal(records.length, 3);
});

test("socket authentication joins only the authenticated user's private room", async () => {
  const secret = "notification-test-secret";
  const token = jwt.sign({ id: userA, authVersion: 0 }, secret, {
    expiresIn: "1h",
  });
  const auth = createSocketAuthentication({
    secret,
    sessions: { isRevoked: async () => false },
    UserModel: {
      findById: () => ({
        select: async () => ({ _id: userA, isActive: true, authVersion: 0 }),
      }),
    },
  });
  const joinedRooms = [];
  const sockets = [1, 2].map(() => ({
    handshake: { auth: { token } },
    data: {},
    join: async (room) => joinedRooms.push(room),
  }));

  for (const socket of sockets) {
    await new Promise((resolve, reject) => {
      auth(socket, (error) => (error ? reject(error) : resolve()));
    });
    assert.equal(socket.data.userId, userA);
  }
  assert.deepEqual(joinedRooms, [
    `user-session:${hashToken(token)}`,
    `user-sessions:${userA}`,
    `user-notifications:${userA}`,
    `user-session:${hashToken(token)}`,
    `user-sessions:${userA}`,
    `user-notifications:${userA}`,
  ]);

  const emitted = [];
  const io = {
    use() {},
    on() {},
    to(room) {
      return {
        emit: (event, payload) => emitted.push({ room, event, payload }),
      };
    },
  };
  configureTrackingSockets(io);
  emitUserNotification(userA, { _id: bookingId, type: "booking_confirmed" });
  assert.equal(emitted[0].room, `user-notifications:${userA}`);
  assert.equal(emitted[0].event, "notification:new");
  assert.equal(emitted[0].payload._id, bookingId);
});

test("pagination rejects invalid values", async () => {
  const fixture = createApiFixture();
  const response = createResponse();
  await fixture.controller.listNotifications(
    { user: { _id: userA }, query: { page: "-1", limit: "101" } },
    response
  );
  assert.equal(response.statusCode, 400);
});

test("notification listing filters read state and type without widening ownership", async () => {
  const { controller } = createApiFixture();
  const filtered = createResponse();
  await controller.listNotifications(
    {
      user: { _id: userA },
      query: { read: "unread", type: "booking_requested" },
    },
    filtered
  );
  assert.equal(filtered.statusCode, 200);
  assert.equal(filtered.body.total, 1);
  assert.equal(filtered.body.unreadCount, 1);
  assert.equal(filtered.body.notifications[0].recipient, userA);

  const invalid = createResponse();
  await controller.listNotifications(
    { user: { _id: userA }, query: { type: "identity_document" } },
    invalid
  );
  assert.equal(invalid.statusCode, 400);
});

