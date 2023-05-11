import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { uploadValid, ValidCB } from "../../middleware/input_validator.js";
import {
	checkUsed,
	uploadChangeDB,
	getS3Url,
	uploadCleanPending,
	uploadCommitDB,
} from "../../controller/files/file_upload_controller.js";
import { authentication } from "../../middleware/auth_check.js";

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

export { router as file_upload_route };
