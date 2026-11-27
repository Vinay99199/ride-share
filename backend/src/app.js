import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { createOriginValidator } from "./config/runtime.js";
import authRoutes from "./routes/auth.routes.js";
import driverApplicationRoutes from "./routes/driverApplication.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import identityVerificationRoutes from "./routes/identityVerification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import geocodingRoutes from "./routes/geocoding.routes.js";
 
const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: createOriginValidator() }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/driver-applications", driverApplicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/identity-verifications", identityVerificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/geocoding", geocodingRoutes);

app.use("/api/auth", authRoutes);

app.get("/healthz", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

app.get("/", (req, res) => {
  res.send("Ride Sharing API is running");
});

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.statusCode ?? error.status;
  if (status === 403 && error.message === "Origin is not allowed") {
    return res.status(403).json({ success: false, message: error.message });
  }
  if (error.type === "entity.too.large" || status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request body exceeds the 1 MB limit",
    });
  }
  if (error.type === "entity.parse.failed" || status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
    });
  }

  console.error("Unhandled request error:", error.name ?? "Error");
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;
