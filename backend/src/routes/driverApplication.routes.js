import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  applyForDriver,
  getMyDriverApplication,
} from "../controllers/driverApplication.controller.js";
import requireDriverAccount from "../middleware/driverAccount.middleware.js";

const router = express.Router();

router.get("/me", protect, requireDriverAccount, getMyDriverApplication);
router.post("/apply", protect, requireDriverAccount, applyForDriver);

export default router;
