import express from "express";
const router = express.Router();

import { authentication } from "../../controller/user/user_auth_controller.js";

// ======================================

router.get("/usage", authentication, (req, res) => {
	return res.json({
		allocated: req.session.user.allocated,
		used: req.session.user.used,
	});
});

export { router as user_usage_route };
