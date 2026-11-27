import express from "express";
import {
  changePassword,
  confirmEmailChange,
  getEmailChangeRequest,
  loginUser,
  registerUser,
  requestEmailChange,
  resendEmailOtp,
  updateProfile,
  verifyEmailOtp,
} from "../controllers/auth.controller.js";
import logoutUser from "../controllers/session.controller.js";
import protect, { protectAllowRevoked } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
 
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 5 minutes.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 15 minutes.",
  },
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again after 15 minutes.",
  },
});

router.post("/register", registrationLimiter, registerUser);
router.post("/verify-email", otpLimiter, verifyEmailOtp);
router.post("/resend-otp", otpLimiter, resendEmailOtp);
router.post("/login", loginLimiter, loginUser);
router.post("/email-change", protect, otpLimiter, requestEmailChange);
router.get("/email-change", protect, getEmailChangeRequest);
router.post("/email-change/confirm", protect, otpLimiter, confirmEmailChange);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.post("/logout", protectAllowRevoked, logoutUser);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});


export default router;