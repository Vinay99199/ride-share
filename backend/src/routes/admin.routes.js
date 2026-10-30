
import express from "express";
import protect from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";
import {getPendingDriverApplications, reviewDriverApplication } from "../controllers/admin.controller.js";

const router = express.Router();

router.get(
  "/driver-applications/pending",
  protect,
  admin,
  getPendingDriverApplications
);

router.put(
  "/driver-applications/:applicationId",
  protect,
  admin,
  reviewDriverApplication
);

export default router;
