import express from "express";
const router = express.Router();
import { wrapAsync } from "../../util/util.js";
import { deleteValid, permDeleteValid, ValidCB } from "../../middleware/input_validator.js";
import { deleteDB, permDelete } from "../../controller/files/file_delete_controller.js";
import { authentication } from "../../middleware/auth_check.js";
// ------------------------------------------------------------------------------------
router.delete("/files", authentication, deleteValid, ValidCB, deleteDB);

router.delete("/trash-files", authentication, permDeleteValid, ValidCB, permDelete);

export { router as file_delete_route };
