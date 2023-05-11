import express from "express";
const router = express.Router();
import { wrapAsync } from "../../util/util.js";
import { authentication } from "../../controller/user/user_auth_controller.js";
import { deleteValid, permDeleteValid, ValidCB } from "../../middleware/input_validator.js";
import { deleteDB, permDelete } from "../../controller/ff/file_delete_controller.js";
// ------------------------------------------------------------------------------------
router.delete("/delete", authentication, deleteValid, ValidCB, deleteDB);

router.delete("/perm-delete", authentication, permDeleteValid, ValidCB, permDelete);

export { router as file_delete_route };
