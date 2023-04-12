import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";
import { checkUsed } from "../../controller/user/user_plan_controller.js";
import { uploadChangeDB, getS3Url, uploadCommitDB } from "../../controller/ff/file_upload_controller.js";

// --------------------------------------------------------------------------------
router.post("/upload-start", authentication, checkUsed, uploadChangeDB, getS3Url);

router.post("/upload-commit", uploadCommitDB);

export { router as file_upload_route };
