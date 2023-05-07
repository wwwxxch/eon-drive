import { body, validationResult } from "express-validator";

import dotenv from "dotenv";
dotenv.config();
const SHARE_TOKEN_LENGTH = process.env.SHARE_TOKEN_LENGTH;
// ============================================================
const signupValid = [
	body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),

	body("email")
		.trim()
		.isEmail()
		.withMessage("Email is not valid")
		.normalizeEmail(),

	body("password")
		.isLength({ min: 8, max: 16 })
		.withMessage("Password should be 8-16 characters long")
		.custom((value) => {
			const pwdregex =
				/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;
			if (!value.match(pwdregex)) {
				throw new Error(
					"Password should have at least one digit, one lowercase letter or one uppercase letter, one of these characters: !@#$%^&*()_+"
				);
			}
			return true;
		}),
];

const signinValid = [
	body("email")
		.trim()
		.isEmail()
		.withMessage("Email is not valid.")
		.normalizeEmail(),

	// TODO: use this validation rule when production
	// body("password").custom((value) => {
	// 	const pwdregex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,16}$/;
	// 	if (!value.match(pwdregex)) {
	// 		throw new Error("Password is not valid");
	// 	}
	// 	return true;
	// })
];

// ////////////////////////////////////////////////////////////////////////////
// const regexForFFName = /^[a-zA-Z0-9_\-.@%$ ]+$/;
// const regexForFFName = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ ]+$/;
const regexForFFName = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.@$ \[\]\(\)\+]+$/;


const uploadValid = [
	body("fileName")
		.trim()
		.notEmpty()
		.withMessage("File name cannot be empty")
		.isLength({ max: 255 })
		.withMessage("File name length cannot exceed 255 characters")
		.matches(regexForFFName)
		.withMessage("File name is not valid"),

	body("fileWholePath")
		.trim()
		.notEmpty()
		.withMessage("File name cannot be empty")
		.custom((input) => {
			const arr = input.split("/");
			arr.forEach((item) => {
				if (!item.match(regexForFFName)) {
					throw new Error("Folder or File name is not valid");
				}
			});
			return true;
		}),

	body("fileSize").custom((input) => {
		const num = Number(input);
		if (!num || num < 0) {
			console.log("here");
			throw new Error("Size cannot be zero or negative value");
		}
		return true;
	}),
	body("fileSplit").custom((input) => {
		const num = Number(input);
		if (!num || num < 1 || !Number.isInteger(num)) {
			throw new Error("Split count should be 1 or more than 1");
		}
		return true;
	}),
];

const createFolderValid = [
	body("folderName")
		.trim()
		.notEmpty()
		.withMessage("Folder name cannot be empty")
		.isLength({ max: 255 })
		.withMessage("Folder name length cannot exceed 255 characters")
		.matches(regexForFFName)
		.withMessage("Folder name is not valid"),
];

const renameValid = [
  body("newName")
    .trim()
    .notEmpty()
		.withMessage("Name cannot be empty")
		.isLength({ max: 255 })
		.withMessage("Length cannot exceed 255 characters")
		.matches(regexForFFName)
		.withMessage("Name is not valid"),
];

const downloadValid = [
	body("parentPath")
		.trim()
		.notEmpty()
		.withMessage("parentPath cannot be empty"),

	body("downloadList").custom((arr) => {
		if (!arr || arr.length === 0) {
			throw new Error("Download list cannot be empty");
		}
		return true;
	}),
];

const deleteValid = [
	// body("parentPath")
	// 	.trim()
	// 	.notEmpty()
	// 	.withMessage("parentPath cannot be empty"),

	body("delList").custom((arr) => {
		if (!arr || arr.length === 0) {
			throw new Error("Delete list cannot be empty");
		}
		return true;
	}),
];

const permDeleteValid = [
	body("permDeleteList").custom((arr) => {
		if (!arr || arr.length === 0) {
			throw new Error("Permanently delete list cannot be empty");
		}
		return true;
	}),
];

const restoreHistoryValid = [
	body("version").custom((input) => {
		const num = Number(input);
		if (!num || num < 1 || !Number.isInteger(num)) {
			throw new Error("Version should be positive integer");
		}
		return true;
	}),
	body("fileWholePath")
		.trim()
		.notEmpty()
		.withMessage("File whole path cannot be empty"),
];

const restoreDeleteValid = [
	body("restoreList").custom((arr) => {
		if (!arr || arr.length === 0) {
			throw new Error("Restore List cannot be empty");
		}
		return true;
	}),
];

const createLinkValid = [
	body("access")
		.custom((obj) => {
      console.log(typeof obj);
      console.log(obj);
			if (!obj.type || !obj.user) {
				throw new Error("Format incorrect");
			}
			if (obj.type !== "public" && obj.type !== "private") {
				throw new Error("Access type incorrect");
			}
			return true;
		}),
  body("targetId")
    .isInt()
    .withMessage("id should be integer")
	// body("path").trim().notEmpty().withMessage("Path cannot be empty"),
];

const revokeLinkValid = [
  body("ff_id")
    .isInt()
    .withMessage("id should be integer")
];  

const viewFolderListValid = [
  body("shareToken")
    .matches(`[0-9a-zA-Z]{${SHARE_TOKEN_LENGTH}}`)
    .withMessage("Share token is not valid"),
];

const viewDLValid = [
  body("shareToken")
    .matches(`[0-9a-zA-Z]{${SHARE_TOKEN_LENGTH}}`)
    .withMessage("Share token is not valid"),
];

const ValidCB = async (req, res, next) => {
	const err = validationResult(req).formatWith(({ msg }) => msg);
	if (!err.isEmpty()) {
		// console.error("ValidCB: err: ", err);
		return res.status(400).json({ error: err.array() });
	} else {
		next();
	}
};

export {
	signupValid,
	signinValid,
	uploadValid,
	createFolderValid,
  renameValid,
	downloadValid,
	deleteValid,
	permDeleteValid,
	restoreHistoryValid,
	restoreDeleteValid,
  createLinkValid,
  revokeLinkValid,
  viewFolderListValid,
  viewDLValid,
	ValidCB,
};
