import express from "express";
const router = express.Router();

import { wrapAsync } from "../../utils/utils.js";
import { uploadValid, ValidCB } from "../../middlewares/input_validator.js";
import {
	checkUsed,
	uploadChangeDB,
	getS3Url,
	uploadCleanPending,
	uploadCommitDB,
} from "../../controllers/files/files_upload_controller.js";
import { authentication } from "../../middlewares/auth_check.js";

// --------------------------------------------------------------------------------
router.post(
	"/upload-start",
	authentication,
	uploadValid,
	ValidCB,
	checkUsed,
	uploadChangeDB,
	getS3Url
);

router.post("/upload-failed", authentication, uploadCleanPending);

router.post("/upload-commit", authentication, uploadCommitDB);

export { router as files_upload_route };
