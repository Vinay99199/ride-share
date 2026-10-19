import express from "express";
import { registerUser,verifyEmailOtp,resendEmailOtp,loginUser } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
 
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
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

router.post("/register", registerUser);
router.post("/verify-email", verifyEmailOtp);
router.post("/resend-otp", otpLimiter, resendEmailOtp);
router.post("/login", loginLimiter, loginUser);
 


router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});


export default router;