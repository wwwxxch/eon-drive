import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();

const {
	S3_BUCKET_NAME
} = process.env;

import { 
  createFolder
} from "../util/s3_create.js";

// ------------------------------------------------------------------------------------
router.post("/create-folder",async(req, res) => {
  console.log(req.body);
  const { folderName } = req.body;
  const createRes = await createFolder(S3_BUCKET_NAME, folderName);
  console.log(createRes);
  if (createRes["$metadata"].httpStatusCode !== 200) {
    return res.status(500).json({ msg: "Something Wrong" });
  }
  return res.status(200).json({ msg: "Folder Created" });
});

export { router as file_create };
