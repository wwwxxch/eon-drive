import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import {
	restoreHistoryValid,
	restoreDeleteValid,
	ValidCB,
} from "../../middleware/input_validator.js";
import { restoreHistory, restoreDeleted } from "../../controller/files/file_restore_controller.js";
import { authentication } from "../../middleware/auth_check.js";
// ===================================================================================================

router.post("/files/restore-history", authentication, restoreHistoryValid, ValidCB, restoreHistory);

router.post("/files/restore-deleted", authentication, restoreDeleteValid, ValidCB, restoreDeleted);

export { router as file_restore_route };
