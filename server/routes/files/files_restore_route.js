import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";
import {
	restoreHistoryValid,
	restoreDeleteValid,
	ValidCB,
} from "../../middlewares/input_validator.js";
import { restoreHistory, restoreDeleted } from "../../controllers/files/files_restore_controller.js";
import { authentication } from "../../middlewares/auth_check.js";
// ===================================================================================================

router.post("/files/restore-history", authentication, restoreHistoryValid, ValidCB, restoreHistory);

router.post("/files/restore-deleted", authentication, restoreDeleteValid, ValidCB, restoreDeleted);

export { router as files_restore_route };
