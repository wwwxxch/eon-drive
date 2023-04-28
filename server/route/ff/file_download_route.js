import express from "express";
const router = express.Router();

import { authentication } from "../../controller/user/user_auth_controller.js";
import { downloadValid, ValidCB } from "../../middleware/input_validator.js";
import {
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive,
	dlCallLambda,
} from "../../controller/ff/file_download_controller.js";
// ------------------------------------------------------------------------------------
router.post(
	"/download-local",
	authentication,
  downloadValid,
  ValidCB,
	dlSingleFile,
	dlMultiFileProcess,
	dlLocalArchive
);

router.post(
	"/download",
	authentication,
  downloadValid,
  ValidCB,
	dlSingleFile,
	dlMultiFileProcess,
	dlCallLambda
);

export { router as file_download_route };
