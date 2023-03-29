import express from "express";
import getSignedFileUrl from "../util/s3.js";

import dotenv from "dotenv";
dotenv.config();
const { S3_BUCKET_NAME } = process.env;

const router = express.Router();

// ------------------------------------------------------------------------------------
router.post("/s3url", async(req, res) => {
  console.log(req.body);

  if (!req.body.filename) {
    return res.status(400).json({ msg: "No file" });
  }

  const s3url = await getSignedFileUrl(req.body.filename, S3_BUCKET_NAME, 3600);
  return res.status(200).json({ s3url });
});

// router.post("/upload", async(req, res) => {

// });

// router.get("/download", async(req, res) => {

// });

// router.delete("/delete", async(req, res) => {

// });

export { router as file_route };