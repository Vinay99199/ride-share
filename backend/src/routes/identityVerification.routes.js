import express from "express";
import protect from "../middleware/auth.middleware.js";
import {
  getMyVerification,
  submitVerification,
} from "../controllers/identityVerification.controller.js";

const router = express.Router();

router.get("/me", protect, getMyVerification);
router.post("/submit", protect, submitVerification);

export default router;
