import express from "express";
import { registerUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);

export default router;