import "dotenv/config";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./config/db.js";
import { createOriginValidator, validateEnvironment } from "./config/runtime.js";
import { configureTrackingSockets } from "./realtime/tracking.socket.js";
import mongoose from "mongoose";

export const startServer = async () => {
  const { port } = validateEnvironment();
  await connectDB();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: createOriginValidator(),
      methods: ["GET", "POST"],
    },
  });
  configureTrackingSockets(io);

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, resolve);
  });
  console.log(`Server is running on port ${port}`);

  let isShuttingDown = false;
  const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}; shutting down`);
    io.close(async () => {
      try {
        await mongoose.disconnect();
      } catch {
        console.error("MongoDB disconnect failed during shutdown");
      }
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  return { httpServer, io };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  });
}
