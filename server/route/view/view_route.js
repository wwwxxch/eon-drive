import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import { viewFolderListValid, viewDLValid, ValidCB } from "../../middleware/input_validator.js";

import {
	viewFolderList,
	viewDLcheckTarget,
	viewDLcheckPermission,
	viewDLfile,
	viewDLfolder,
	viewDLcallLambda,
} from "../../controller/view/view_controller.js";

// ===================================================================================
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
