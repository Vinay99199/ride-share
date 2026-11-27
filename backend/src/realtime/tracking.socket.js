import jwt from "jsonwebtoken";
import User from "../models/User.js";
import trackingService from "../services/tracking.service.js";
import sessionService, { hashToken } from "../services/session.service.js";

const roomForRide = (rideId) => `ride-tracking:${rideId}`;
const notificationRoomForUser = (userId) =>
  `user-notifications:${String(userId)}`;

export const createSocketAuthentication = ({
  jwtLibrary = jwt,
  UserModel = User,
  sessions = sessionService,
  secret = process.env.JWT_SECRET,
} = {}) => async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwtLibrary.verify(token, secret);
    if (
      typeof decoded.id !== "string" ||
      !decoded.id ||
      !Number.isSafeInteger(decoded.exp) ||
      decoded.exp * 1000 <= Date.now()
    ) {
      return next(new Error("Unauthorized"));
    }

    const [user, isRevoked] = await Promise.all([
      UserModel.findById(decoded.id).select("_id isActive +authVersion"),
      sessions.isRevoked(token),
    ]);
    if (
      !user ||
      user.isActive === false ||
      (user.authVersion ?? 0) !== (decoded.authVersion ?? 0) ||
      isRevoked
    ) {
      return next(new Error("Unauthorized"));
    }

    socket.data.userId = String(user._id);
    socket.data.tokenHash = hashToken(token);
    await socket.join(`user-session:${socket.data.tokenHash}`);
    await socket.join(`user-sessions:${socket.data.userId}`);
    await socket.join(notificationRoomForUser(user._id));
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
};

export const registerTrackingSocketHandlers = (
  io,
  service = trackingService
) => {
  io.use(createSocketAuthentication());

  io.on("connection", (socket) => {
    const acknowledge = (ack, result) => {
      if (typeof ack === "function") {
        ack(result);
      } else if (!result.success) {
        socket.emit("tracking:error", result);
      }
    };

    socket.on("tracking:join", async (payload = {}, ack) => {
      let room;
      try {
        await service.authorizeTrackingAccess(
          payload.rideId,
          socket.data.userId
        );
        room = roomForRide(payload.rideId);
        await socket.join(room);
        const location = await service.getLatestLocation(
          payload.rideId,
          socket.data.userId
        );
        acknowledge(ack, { success: true, location });
      } catch (error) {
        if (room) {
          await socket.leave(room);
        }
        acknowledge(ack, {
          success: false,
          message: error.statusCode ? error.message : "Unable to join ride tracking",
        });
      }
    });

    socket.on("tracking:leave", (payload = {}, ack) => {
      if (typeof payload.rideId !== "string") {
        return acknowledge(ack, {
          success: false,
          message: "A valid rideId is required",
        });
      }
      socket.leave(roomForRide(payload.rideId));
      acknowledge(ack, { success: true });
    });

    socket.on("tracking:location:update", async (payload = {}, ack) => {
      try {
        const location = await service.updateLocation(
          payload.rideId,
          socket.data.userId,
          payload
        );
        io.to(roomForRide(location.rideId)).emit("tracking:location", location);
        acknowledge(ack, { success: true });
      } catch (error) {
        acknowledge(ack, {
          success: false,
          message: error.statusCode ? error.message : "Unable to update location",
        });
      }
    });
  });
};

let trackingIo;

export const configureTrackingSockets = (io) => {
  trackingIo = io;
  registerTrackingSocketHandlers(io);
};

export const emitUserNotification = (userId, notification) => {
  if (!trackingIo) {
    throw new Error("Socket.IO server is not configured");
  }
  trackingIo
    .to(notificationRoomForUser(userId))
    .emit("notification:new", notification);
};

export const stopTrackingRoom = async (rideId, reason) => {
  if (!trackingIo) {
    return;
  }

  const room = roomForRide(String(rideId));
  trackingIo.to(room).emit("tracking:stopped", { rideId: String(rideId), reason });
  const sockets = await trackingIo.in(room).fetchSockets();
  await Promise.all(sockets.map((socket) => socket.leave(room)));
};

export const removeTrackingPassenger = async (rideId, passengerId) => {
  if (!trackingIo) {
    return;
  }

  const room = roomForRide(String(rideId));
  const sockets = await trackingIo.in(room).fetchSockets();
  await Promise.all(
    sockets
      .filter((socket) => socket.data.userId === String(passengerId))
      .map((socket) => socket.leave(room))
  );
};

export const disconnectTokenSockets = async (tokenHash) => {
  if (!trackingIo) return;
  await trackingIo.in(`user-session:${tokenHash}`).disconnectSockets(true);
};

export const disconnectUserSockets = async (userId) => {
  if (!trackingIo) return;
  await trackingIo.in(`user-sessions:${String(userId)}`).disconnectSockets(true);
};
