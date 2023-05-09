import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";
import { uploadValid, ValidCB } from "../../middleware/input_validator.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import {
  checkUsed,
	uploadChangeDB,
	getS3Url,
  uploadCleanPending,
	uploadCommitDB,
} from "../../controller/ff/file_upload_controller.js";

// --------------------------------------------------------------------------------
// TODO: remove below middleware when go to prod
router.post(
	"/upload-start",
  authentication, 
  (req, res, next) => {
    console.log("/upload-start: ", req.body);
    next();
  },
	uploadValid,
	ValidCB,
	// checkUsed,
	uploadChangeDB,
	getS3Url
);

router.post("/upload-failed", authentication, uploadCleanPending);

router.post("/upload-commit", authentication, uploadCommitDB);

export { router as file_upload_route };
