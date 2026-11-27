import express from "express";
import protect from "../middleware/auth.middleware.js";
import { createReport } from "../controllers/report.controller.js";

const router = express.Router();

router.post("/", protect, createReport);

export default router;
