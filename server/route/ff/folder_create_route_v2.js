import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();

import { authentication } from "../../controller/user/user_auth_controller.js";
import { createFolderS3AndDB } from "../../controller/ff/folder_create_controller.js";
// ------------------------------------------------------------------------------------
router.post("/v2/create-folder", authentication, createFolderS3AndDB);

export { router as folder_create_route_v2 };
