import express from "express";
const router = express.Router();

import { DateTime } from "luxon";

import {
	checkUsedByUser,
	updateSpaceUsedByUser,
	updateUsedByUser,
} from "../../model/db_plan.js";
import { CustomError } from "../../error/custom_error.js";
import {authentication} from "../../middleware/auth_check.js";
// ======================================

router.get("/usage", authentication, async (req, res, next) => {
	const userId = req.session.user.id;
	const allocated = req.session.user.allocated;
	const used = req.session.user.used;

  // TODO: error handling not yet
	// const currentUsed = await checkUsedByUser(userId);
	// if (currentUsed === used) {
	// 	return res.json({
	// 		allocated,
	// 		used,
	// 	});
	// }

	// const now = DateTime.utc();
	// const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");
	// await updateUsedByUser(userId, currentUsed, nowTime);
	// req.session.user.used = currentUsed;
	// return res.json({
	// 	allocated,
	// 	used: currentUsed,
	// });
  return res.json({
    allocated,
    used
  });
});

export { router as user_usage_route };
