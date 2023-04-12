import express from "express";
const router = express.Router();

import { authentication } from "../../controller/user/user_auth_controller.js";
import { deleteS3AndDB } from "../../controller/file/file_delete_controller.js";
// ------------------------------------------------------------------------------------
router.post("/v1/delete", authentication, deleteS3AndDB);

export { router as file_delete_route };
