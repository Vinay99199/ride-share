import express from "express";
import protect from "../middleware/auth.middleware.js";
import { applyForDriver } from "../controllers/driverApplication.controller.js";

const router = express.Router();

router.post("/apply", protect, applyForDriver);

export default router;
