import express from "express";
import {
  getMyOrganization,
  getOrganization,
  listOrganizations,
} from "../controllers/organization.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", listOrganizations);
router.get("/me", protect, getMyOrganization);
router.get("/:organizationId", getOrganization);

export default router;
