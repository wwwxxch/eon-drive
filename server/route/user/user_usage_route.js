import express from "express";
const router = express.Router();

import { authentication } from "../../middleware/auth_check.js";
import { returnUsage } from "../../controller/user/user_usage_controller.js";
// ===============================================================================
router.get("/usage", authentication, returnUsage);

export { router as user_usage_route };
