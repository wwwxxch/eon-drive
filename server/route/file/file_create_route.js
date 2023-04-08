import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();

const {
	S3_MAIN_BUCKET_NAME
} = process.env;

import { 
  createS3Folder
} from "../../service/s3/s3_create.js";

// ------------------------------------------------------------------------------------
// TODO: not finished yet
// folder to be created in S3 & DB
// list to be updated (emitNewList)
router.post("/create-folder",async(req, res) => {
  console.log(req.body);
  const { folderName } = req.body;
  const createRes = await createS3Folder(S3_MAIN_BUCKET_NAME, folderName);
  console.log(createRes);
  if (createRes["$metadata"].httpStatusCode !== 200) {
    return res.status(500).json({ msg: "Something Wrong" });
  }
  return res.status(200).json({ msg: "Folder Created" });
});

export { router as file_create };
