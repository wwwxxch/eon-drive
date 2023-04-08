import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";
import { checkUsed } from "../../controller/user/user_plan_controller.js";
import { 
  uploadChangeDB,
  getS3Url,
  uploadCommitDB
} from "../../controller/file/file_upload_controller.js";

// --------------------------------------------------------------------------------
// 寫入DB (status = pending) & 更新user.used & 跟S3拿presigned URL
router.post("/upload-start", authentication, checkUsed, uploadChangeDB, getS3Url);

// 更新DB (status = done or remove record + update user.used) + emit new file list 
router.post("/upload-commit", authentication, uploadCommitDB);

export { router as file_upload_route };
