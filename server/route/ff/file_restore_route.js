import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import {
	restoreHistoryValid,
	restoreDeleteValid,
	ValidCB,
} from "../../middleware/input_validator.js";
import {
	restoreHistory,
	restoreDeleted,
} from "../../controller/ff/file_restore_controller.js";
// ===============================================================================

router.post(
	"/restore-history",
	authentication,
	restoreHistoryValid,
	ValidCB,
	restoreHistory
);

router.post(
	"/restore-deleted",
	authentication,
	restoreDeleteValid,
	ValidCB,
	restoreDeleted
);

export { router as file_restore_route };
