import express from "express";
const router = express.Router();

import { authentication } from "../../middlewares/auth_check.js";
import { returnUsage } from "../../controllers/user/user_usage_controller.js";
// ===============================================================================
router.get("/usage", authentication, returnUsage);

export { router as user_usage_route };
