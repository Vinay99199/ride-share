import express from "express";
import rateLimit from "express-rate-limit";
import { reverseGeocode, searchPlaces } from "../controllers/geocoding.controller.js";

const router = express.Router();
const requestLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Place search request limit reached. Please wait before trying again.",
  },
});

router.use(requestLimit);
router.get("/search", searchPlaces);
router.get("/reverse", reverseGeocode);

export default router;
