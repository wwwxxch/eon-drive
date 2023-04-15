import dotenv from "dotenv";
dotenv.config();
const { HOST } = process.env;

import {
	addUserToAcessList,
	changeLinkToPrivate,
	changeLinkToPublic,
	checkLinkByFFId,
	createPrivateLink,
	createPublicLink,
} from "../../model/db_share.js";
import { findFileIdByPath, iterForParentId } from "../../service/path/iter.js";

import { shareTokenGenerator } from "../../service/share/token_gen.js";
import { getMultipleUserId } from "../../model/db_user.js";
// ============================================================
const publicLink = async (req, res, next) => {
  
  if (req.body.access.type === "private") {
    return next();
  }
  console.log("publicLink: ", req.body);
  const { path } = req.body;
  const userId = req.session.user.id;
  
  const type = path.endsWith("/") ? "folder" : "file";
  const target = type === "folder" ? path.replace(/\/$/, "") : path;
  
  const targetName = target.split("/").pop();
  
  const targetId = 
    type === "folder" ? 
    await iterForParentId(userId, target.split("/")) :
    await findFileIdByPath(userId, target);
  console.log("targetId: ", targetId);

  const shareStatus = await checkLinkByFFId(targetId);
  console.log("shareStatus: ", shareStatus);

  
  let token;
  if (!shareStatus.share_token) {
    // no link -> 
    // update ff table with is_public = 1 & share_token
    token = shareTokenGenerator();
    const createLinkRes = await createPublicLink(targetId, token);
    console.log("createLinkRes.affectedRows: ", createLinkRes.affectedRows);
  } else if (shareStatus.is_public === 1) {
    // public link -> return existed link
    token = shareStatus.share_token;
  } else if (shareStatus.is_public === 0) {
    // private link -> 
    // delete records in share_link_perm & let ff.is_public = 1
    // return existed link 
    const changeLinkRes = await changeLinkToPublic(targetId);
    console.log("changeLinkRes: ", changeLinkRes);
    token = shareStatus.share_token;
  }

  const share_link = 
    type === "folder" ?
    `${HOST}/sdir/${token}/${targetName}` :
    `${HOST}/s/${token}/${targetName}`;

  return res.json({ share_link });
};

const privateLink = async (req, res) => {
  console.log("privateLink: ", req.body);
  const { access, path } = req.body;
  const userId = req.session.user.id;
  
  const type = path.endsWith("/") ? "folder" : "file";
  const target = type === "folder" ? path.replace(/\/$/, "") : path;
  
  const targetName = target.split("/").pop();
  
  const targetId = 
    type === "folder" ? 
    await iterForParentId(userId, target.split("/")) :
    await findFileIdByPath(userId, target);
  console.log("targetId: ", targetId);

  const shareStatus = await checkLinkByFFId(targetId);
  console.log("shareStatus: ", shareStatus);
  
  const userList = await getMultipleUserId("email", access.user);

  let token;
  if (!shareStatus.share_token) {
    // no link -> 
    // link to user table find other users' id &     
    // update ff table with share_token & 
    // update share_link_perm table
    token = shareTokenGenerator();
    const createLinkRes  = await createPrivateLink(targetId, token, userList);
    console.log("createLinkRes: ", createLinkRes);
  } else if (shareStatus.is_public === 1) {
    // public link -> return existed link
    // link to user table find other users' id &
    // update ff table with is_public = 0 &
    // update share_link_perm table
    // return existed link 
    const changeLinkRes = await changeLinkToPrivate(targetId, userList);
    console.log("changeLinkRes: ", changeLinkRes);
    token = shareStatus.share_token;
  } else if (shareStatus.is_public === 0) {
    // private link 
    // link to user table find other users' id =>
    // check if this user is in share_link_perm table &
    // update share_link_perm table
    const grantAccess = await addUserToAcessList(targetId, userList);
    console.log("grantAccess: ", grantAccess);
    token = shareStatus.share_token;
  }

  const share_link = 
    type === "folder" ?
    `${HOST}/sdir/${token}/${targetName}` :
    `${HOST}/s/${token}/${targetName}`;

  return res.json({ share_link });
};

export { publicLink, privateLink };
