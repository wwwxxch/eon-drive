import { DateTime } from "luxon";
import dotenv from "dotenv";

dotenv.config();
const { NODE_ENV, LOCAL_HOST, PROD_HOST } = process.env;

let HOST;
if (NODE_ENV === "dev") {
	HOST = LOCAL_HOST;
} else if (NODE_ENV === "prod") {
	HOST = PROD_HOST;
}

import { customError } from "../../error/custom_error.js";

import { getMultipleUserId, getPossibleUser } from "../../model/db_user.js";
import {
	addUserToAcessList,
	changeLinkToPrivate,
	changeLinkToPublic,
	checkLinkByFFId,
	createPrivateLink,
	createPublicLink,
	deleteLinkByFFId,
} from "../../model/db_share.js";

import { findFileIdByPath, iterForParentId } from "../../service/path/iter.js";

import { shareTokenGenerator } from "../../service/share/token_gen.js";

import { emitShareNoti, emitLinksYouShared } from "../../service/sync/list.js";

// ============================================================
const createLinkCheck = async (req, res, next) => {
	console.log("createLinkCheck: ", req.body); // access & path
	const { path } = req.body;
	const userId = req.session.user.id;
	const type = path.endsWith("/") ? "folder" : "file";
	const target = type === "folder" ? path.replace(/\/$/, "") : path;

	// const targetName = target.split("/").pop();
	const targetId =
		type === "folder"
			? await iterForParentId(userId, target.split("/"))
			: await findFileIdByPath(userId, target);
	console.log("targetId: ", targetId);
	if (targetId === -1) {
		return next(customError.badRequest("No such key"));
	}

	const shareStatus = await checkLinkByFFId(targetId);
	console.log("shareStatus: ", shareStatus);
	if (!shareStatus) {
		return next(customError.badRequest("No such key"));
	}

	req.type = type;
	req.targetId = targetId;
	req.shareStatus = shareStatus;

	next();
};

const publicLink = async (req, res, next) => {
	if (req.body.access.type === "private") {
		return next();
	}
	const { type, targetId, shareStatus } = req;
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
		type === "folder" ? `${HOST}/view/fo/${token}` : `${HOST}/view/fi/${token}`;

	return res.json({ share_link });
};

const privateLink = async (req, res, next) => {
	const { access } = req.body;
	const userList = await getMultipleUserId("email", access.user);
	console.log("userList: ", userList);
	if (userList.length === 0) {
		return next(
			customError.badRequest("Cannot find any user by provided mail")
		);
	}

	const { type, targetId, shareStatus } = req;
	let token;
	const now = DateTime.utc();
	const nowTime = now.toFormat("yyyy-MM-dd HH:mm:ss");
	if (!shareStatus.share_token) {
		// no link ->
		// link to user table find other users' id &
		// update ff table with share_token &
		// update share_link_perm table
		token = shareTokenGenerator();
		const createLinkRes = await createPrivateLink(
			targetId,
			token,
			nowTime,
			userList
		);
		console.log("createLinkRes: ", createLinkRes);
	} else if (shareStatus.is_public === 1) {
		// public link -> return existed link
		// link to user table find other users' id &
		// update ff table with is_public = 0 &
		// update share_link_perm table
		// return existed link
		const changeLinkRes = await changeLinkToPrivate(
			targetId,
			nowTime,
			userList
		);
		console.log("changeLinkRes: ", changeLinkRes);
		token = shareStatus.share_token;
	} else if (shareStatus.is_public === 0) {
		// private link
		// link to user table find other users' id =>
		// check if this user is in share_link_perm table &
		// update share_link_perm table
		const grantAccess = await addUserToAcessList(targetId, nowTime, userList);
		console.log("grantAccess: ", grantAccess);
		token = shareStatus.share_token;
	}

	const share_link =
		type === "folder" ? `${HOST}/view/fo/${token}` : `${HOST}/view/fi/${token}`;

	// emit notification
	const io = req.app.get("socketio");
	for (let i = 0; i < userList.length; i++) {
		emitShareNoti(io, userList[i]);
	}

	return res.json({ share_link });
};

const revokeLink = async (req, res, next) => {
	console.log("revokeLink: ", req.body);
	const { ff_id } = req.body;
	const userId = req.session.user.id;

	const revokeLinkInDB = await deleteLinkByFFId(userId, ff_id);
	console.log("revokeLinkInDB: ", revokeLinkInDB);
	if (!revokeLinkInDB) {
		return next(customError.badRequest("No such key"));
	}

	// emit new link list
	const io = req.app.get("socketio");
	emitLinksYouShared(io, userId);
	return res.send("ok");
};

const userSearch = async (req, res, next) => {
	const { q } = req.query;
	if (!q) {
		return next(customError.badRequest("Query string is missing"));
	}
	const possibleEmail = await getPossibleUser(q);
	return res.json({ list: possibleEmail });
};

export { createLinkCheck, publicLink, privateLink, revokeLink, userSearch };
