import express from "express";
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();

import { wrapAsync } from "../../util/util.js";

import { authentication } from "../../controller/user/user_auth_controller.js";

import { 
  findFileOrDirByPath 
} from "../../service/find_child.js";

import {
  chkLinkByTargetId,
  createLink,
  chkTargetByLink
} from "../../model/db_share.js";

import {
  getDetail,
  getOneLevelList
} from "../../model/db_file.js";

import { shareTokenGenerator } from "../../service/share/token_gen.js";

// --------------------------------------------------------------------------------
router.post("/create-link", authentication, async (req, res) => {
  console.log("/create-link", req.body);

  // req.body: { parentPath: 'test1/folderintest1', targetName: 'level2/' }
  
  // req.body: { 
  //   parentPath: 'test1/folderintest1', 
  //   targetName: 'CHIHHUIX-customerchat-0.0.1-swagger.yaml' 
  // }

  const { parentPath, targetName } = req.body;
  const userId = req.session.user.id;
  const type = targetName.endsWith("/") ? "folder" : "file";
  const targetId = await findFileOrDirByPath(userId, parentPath, targetName, type);
  console.log("targetId: ", targetId, "type: ", type);

  // check if there's link exsited in table
  let token;
  const linkResult = await chkLinkByTargetId(targetId);
  console.log("linkResult: ", linkResult);
  if (linkResult.length === 0) {
    token = shareTokenGenerator();
    const saveShareToken = await createLink(targetId, token);
    console.log("saveShareToken: ", saveShareToken.affectedRows);
  } else {
    token = linkResult[0].token;
  } 
  console.log("token: ", token);
  
  // create share link for folder or file
  let share_link;
  if (type === "file") {
    share_link = `${process.env.HOST}/s/${token}/${targetName}`;
  } else {
    share_link = `${process.env.HOST}/sdir/${token}`;
  }
  return res.json({ share_link });
});

router.get("/s/:shareToken*", async(req, res) => {
  console.log(req.params);
  console.log("shareToken: ", req.params.shareToken);
  const shareToken = req.params.shareToken;

  // if length not correct
  if (shareToken.length !== parseInt(process.env.SHARE_TOKEN_LENGTH)) {
    return res.status(400).json({ msg: "error" });
  }
  
  const target = await chkTargetByLink(shareToken);
  console.log("target: ", target);
  // if no corresponding target file/folder
  if (target.length === 0) {
    return res.status(400).json({ msg: "error" });
  }

  const detail = await getDetail(target[0].target_id);
  console.log("detail: ", detail);
  // if no corresponding target file/folder
  if (detail.length === 0) {
    return res.status(400).json({ msg: "error" });
  }

  return res.json({ data: detail[0] });
});

router.get("/sdir/:shareToken*", async(req, res) => {
  console.log(req.params);
  console.log("shareToken: ", req.params.shareToken);
  const shareToken = req.params.shareToken;

  // if length not correct
  if (shareToken.length !== parseInt(process.env.SHARE_TOKEN_LENGTH)) {
    return res.status(400).json({ msg: "error" });
  }
  
  const target = await chkTargetByLink(shareToken);
  console.log("target: ", target);
  // if no corresponding target file/folder
  if (target.length === 0) {
    return res.status(400).json({ msg: "error" });
  }

  // 回傳第一層清單 (無法知道 folder info)
  const list = await getOneLevelList(target[0].target_id);
  console.log("list: ", list);
  return res.json({ data: list });
});


export { router as share_link_route };
