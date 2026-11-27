import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import sessionService, { hashToken } from "../services/session.service.js";

const unauthorized = (res, message = "Invalid or expired token") =>
  res.status(401).json({ success: false, message });

export const createAuthMiddleware = ({
  UserModel = User,
  jwtLibrary = jwt,
  sessions = sessionService,
  secret = process.env.JWT_SECRET,
  allowRevoked = false,
  logger = console,
  isDatabaseReady = () => mongoose.connection.readyState === 1,
} = {}) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token required.",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) {
    return unauthorized(res);
  }

  let decoded;
  try {
    decoded = jwtLibrary.verify(token, secret);
  } catch {
    return unauthorized(res);
  }
  if (
    typeof decoded.id !== "string" ||
    !decoded.id ||
    !Number.isSafeInteger(decoded.exp) ||
    decoded.exp * 1000 <= Date.now() ||
    (decoded.authVersion !== undefined &&
      (!Number.isSafeInteger(decoded.authVersion) || decoded.authVersion < 0))
  ) {
    return unauthorized(res);
  }

  if (!isDatabaseReady()) {
    return res.status(503).json({
      success: false,
      message: "Authentication database is temporarily unavailable",
    });
  }

  try {
    const user = await UserModel.findById(decoded.id).select(
      "-password -emailOtp -emailOtpExpiresAt +authVersion"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if ((user.authVersion ?? 0) !== (decoded.authVersion ?? 0)) {
      return unauthorized(res, "Session expired. Please sign in again.");
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact your organization administrator.",
      });
    }

    const isRevoked = await sessions.isRevoked(token);
    if (isRevoked && !allowRevoked) {
      return unauthorized(res, "Session has been revoked. Please sign in again.");
    }

    req.authToken = token;
    req.authTokenHash = hashToken(token);
    req.authTokenExpiresAt = new Date(decoded.exp * 1000);
    req.authVersion = user.authVersion ?? 0;
    user.set("authVersion", undefined);
    req.user = user;
    return next();
  } catch (error) {
    logger.error("Authentication session lookup failed:", error.message);
    return res.status(503).json({
      success: false,
      message: "Authentication service is temporarily unavailable",
    });
  }
};

const protect = createAuthMiddleware();
export const protectAllowRevoked = createAuthMiddleware({ allowRevoked: true });

export default protect;