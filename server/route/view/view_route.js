import express from "express";
const router = express.Router();

import { wrapAsync } from "../../util/util.js";

import {
	shareTokenValid,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo,
	returnFolderInfo,
} from "../../controller/view/view_controller.js";

import { getTargetByLink } from "../../model/db_share.js";
import { getOneLevelChildByParentId } from "../../model/db_ff_r.js";
import {
	findParentPathByFFId,
	getFileListByPath,
} from "../../service/path/iter.js";
import { getAllChildren } from "../../service/path/recur.js";
import {
	viewDLvalidation,
	viewDLsingleFile,
	viewDLfolder,
	viewDLcallLambda,
} from "../../controller/view/view_controller.js";
// ===================================================================================
router.get(
	"/view/fi/:shareToken([a-zA-Z0-9]+)*",
  // TODO: 如果shareToken後面接的不是檔案名稱 - 400
	shareTokenValid,
	checkShareTarget,
	checkSharePermission,
	returnFileInfo
);

router.get(
	"/view/fo/:shareToken([a-zA-Z0-9]+)*",
  // TODO: 如果shareToken後面接的不是檔案夾對應的子檔案夾 - 400
	shareTokenValid,
	checkShareTarget,
	checkSharePermission,
	returnFolderInfo
);

router.post("/view-fo-list", async (req, res) => {
  // TODO: view-fo-list: folder validation & permission validation
	const { shareToken, subFolder } = req.body;
	// find the list by token
	const target = await getTargetByLink(shareToken);
	let list;
	if (!subFolder) {
		list = await getOneLevelChildByParentId(target.user_id, target.id, 0);
	} else {
		const parentParentPath = await findParentPathByFFId(target.id);
		console.log(parentParentPath);
		const subWholePath = parentParentPath + target.name + "/" + subFolder;
		console.log(subWholePath);
		const subPathList = await getFileListByPath(
			target.user_id,
			subWholePath.replace(/^Home\//, "")
		);

		list = subPathList.data;
	}

	return res.json({ data: list });
});

router.post(
	"/view-fo-dl",
	viewDLvalidation,
  checkSharePermission,
	viewDLsingleFile,
	viewDLfolder,
	viewDLcallLambda
);

// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
import { findFileIdByPath } from "../../service/path/iter.js";
import { getAccessList } from "../../model/db_share.js";
import { getCurrentVersionByFileId } from "../../model/db_ff_r.js";
const { S3_MAIN_BUCKET_NAME } = process.env;
import { s3clientGeneral } from "../../service/s3/s3_client.js"; 
import { copyS3Obj } from "../../service/s3/s3_copy.js";
import { getDownloadUrl } from "../../service/s3/s3_download.js";

router.post("/view-fi-dl", async(req, res) => {
  const { shareToken } = req.body;
	const target = await getTargetByLink(shareToken);
	if (!target) {
		return res.status(400).send("error");
	}

  // permission
  if (target.is_public === 0) {
		if (!req.session.user) {
			return res.status(403).json({ msg: "No access" });
		}

		const userList = await getAccessList(target.id);
		const userId = req.session.user.id;
		if (!userList.includes(userId) && userId !== target.user_id) {
			return res.status(403).json({ msg: "No access" });
		}
	}

  // download
  const parentParentPath = await findParentPathByFFId(target.id);
  // single file download
  const userId = target.user_id;
	const key = (parentParentPath + target.name).replace(/^Home\//, "");
  console.log("viewDL single - key: ", key);
  // 1. get current version -> giving path to obtain file id
  const fileId = await findFileIdByPath(userId, key);
  const version = await getCurrentVersionByFileId(fileId);
  console.log("version: ", version);
  // 2. copy ${key}.v<version> to ${key}
  const copyS3ObjRes = await copyS3Obj(
    s3clientGeneral,
    S3_MAIN_BUCKET_NAME,
    `user_${userId}/${key}.v${version}`,
    `user_${userId}/${key}`
  );
  // 3. get presigned URL for that file
  const downloadUrl = await getDownloadUrl(
    s3clientGeneral,
    S3_MAIN_BUCKET_NAME,
    `user_${userId}/${key}`
  );

  return res.json({ downloadUrl });
});

export { router as view_route };
