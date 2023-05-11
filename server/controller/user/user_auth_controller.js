import { generateCurrentTime, preventXSS } from "../../util/util.js";

import dotenv from "dotenv";
import { customError } from "../../error/custom_error.js";

import { chkmail, chkpair, createUser, getProfile, getUser } from "../../model/db_user.js";

import { s3clientGeneral } from "../../service/s3/s3_client.js";

import { createS3Folder } from "../../service/s3/s3_create.js";

dotenv.config();
const { S3_MAIN_BUCKET_NAME, S3_DOWNLOAD_BUCKET_NAME } = process.env;

// ====================================================================
const signUp = async (req, res, next) => {
	console.log("signUp");

	const { name, email, password } = req.body;

	const modifiedName = preventXSS(name);

	// check if the email has been registered
	const getmail = await chkmail(email);
	if (getmail) {
		// return res.status(400).json({ error: "Your email has been registered." });
		return next(customError.badRequest("Your email has been registered"));
	}

	// create user in DB
	const nowTime = generateCurrentTime();

	const createUserRes = await createUser(email, password, modifiedName, nowTime);

	// save user info to session
	const user = {
		id: createUserRes.id,
		name: createUserRes.name,
		email: createUserRes.email,
		allocated: createUserRes.allocated,
		used: createUserRes.used,
	};
	req.session.user = user;

	// create blank folder in S3
	const createMain = await createS3Folder(
		s3clientGeneral,
		S3_MAIN_BUCKET_NAME,
		`user_${createUserRes.id}`
	);
	const createDownload = await createS3Folder(
		s3clientGeneral,
		S3_DOWNLOAD_BUCKET_NAME,
		`user_${createUserRes.id}`
	);
	console.log("signUp: createMain: ", createMain);
	console.log("signUp: createDownload: ", createDownload);

	if (!createMain || !createDownload) {
		// return res.status(500).json({ msg: "Something Wrong" });
		return next(customError.internalServerError());
	}

	return res.json({ data: { user } });
};

const signIn = async (req, res, next) => {
	console.log("signIn");
	const { email, password } = req.body;

	// check if the email matches the password
	const getpair = await chkpair(email, password);
	if (!getpair) {
		// return res.status(401).json({ error: "Your email and password do not match." });
		return next(customError.unauthorized("Your email and password do not match"));
	}

	// save user info to session
	const getUserRes = await getUser("email", email);
	// console.log("getUserRes: ", getUserRes);
	const user = {
		id: getUserRes.id,
		name: getUserRes.name,
		email: getUserRes.email,
		allocated: getUserRes.allocated,
		used: getUserRes.used,
	};
	req.session.user = user;

	return res.json({ data: { user } });
};

const logOut = (req, res) => {
	console.log("logOut");
	req.session.destroy();
	return res.redirect("/");
};

const showProfile = async (req, res) => {
	console.log("showProfile");
	const userId = req.session.user.id;
	const profile = await getProfile(userId);
	const { email, name, plan, allocated, used, created_at } = profile;

	return res.json({ email, name, plan, allocated, used, created_at });
};

export { signUp, signIn, logOut, showProfile };
