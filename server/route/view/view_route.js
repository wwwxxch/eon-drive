import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import dotenv from "dotenv";
dotenv.config();
const SHARE_TOKEN_LENGTH = process.env.SHARE_TOKEN_LENGTH;

import {
	viewFolderListValid,
	viewDLValid,
	ValidCB,
} from "../../middleware/input_validator.js";

import {
	checkShareTarget,
	checkSharePermission,
	returnFileInfo,
	returnFolderInfo,
	viewFolderList,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile,
	viewDLfolder,
	viewDLcallLambda,
} from "../../controller/view/view_controller.js";

// ===================================================================================
router.get(
	`/view/fi/:shareToken([0-9a-zA-Z]{${SHARE_TOKEN_LENGTH}})`,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo
);

router.get(
	`/view/fo/:shareToken([0-9a-zA-Z]{${SHARE_TOKEN_LENGTH}})*`,
	checkShareTarget,
	checkSharePermission,
	returnFolderInfo
);

router.post("/view-fo-list", viewFolderListValid, ValidCB, viewFolderList);

router.post(
	"/view-fi-dl",
	viewDLValid,
	ValidCB,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile
);

router.post(
	"/view-fo-dl",
	viewDLValid,
	ValidCB,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile,
	viewDLfolder,
	viewDLcallLambda
);

export { router as view_route };
