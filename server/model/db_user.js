import argon2 from "argon2";
import { pool } from "./connection.js";

import dotenv from "dotenv";
dotenv.config();

// basic storage plan - X MB
const basic = parseInt(process.env.BASIC);
// ----------------------------------------------------------
const checkMail = async (mail) => {
	const [row] = await pool.query(
		`
    SELECT email FROM user WHERE email = ?`,
		mail
	);
	return row[0];
};

const checkPair = async (mail, pwd) => {
	const [row] = await pool.query(
		`
      SELECT id, email, name, password, confirm_status, 
      DATE_FORMAT(confirmed_at, '%Y-%m-%dT%H:%i:%s.000Z') AS confirmed_at 
      FROM user WHERE email = ?
    `,
		mail
	);
	if (row.length === 1) {
		// argon2.verify(<hashed value>, <plain text>)
		const validate = await argon2.verify(row[0].password, pwd);
		if (validate) {
			const userDetails = row[0];
			delete userDetails.password;
			return userDetails;
		}
		return null;
	}
	return null;
};

// get user info by specific column
const getUser = async (col, colVal) => {
	const [row] = await pool.query(
		`
    SELECT id, email, name, allocated, used FROM user WHERE ${col} = ?`,
		colVal
	);
	return row[0];
};

const createUser = async (mail, pwd, name, time, token) => {
	try {
		const hashed = await argon2.hash(pwd);
		const [row] = await pool.query(
			`
      INSERT INTO user 
        (email, password, name, plan, allocated, used, created_at, updated_at, 
          confirm_token, confirm_status, confirmed_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 
          ?, ?, ?)
    `,
			[mail, hashed, name, 1, basic * 1024 * 1024, 0, time, time, token, 0, time]
		);
		// const insertId = row.insertId;
		// return getUser("id", insertId);

		if (row.affectedRows !== 1) {
			throw new Error("createUser: row.affectedRows !== 1");
		}

		return true;
	} catch (e) {
		console.error("createUser: ", e);
		return false;
	}
};

const changeConfirmToken = async (id, time, token) => {
	try {
		const [row] = await pool.query(
			`
      UPDATE user SET confirm_token = ?, confirmed_at = ?, updated_at = ? 
      WHERE id = ?`,
			[token, time, time, id]
		);
		if (row.affectedRows !== 1) {
			throw new Error("changeConfirmToken: affectedRows !== 1");
		}
		return true;
	} catch (e) {
		console.error("changeConfirmToken: ", e);
		return false;
	}
};

const getMultipleUserId = async (col, vals, exclude) => {
	try {
		const vals_trim = vals.map((item) => item.trim());
		const [row] = await pool.query(
			`
      SELECT id FROM user WHERE ${col} IN (?) AND ${col} != ?`,
			[vals_trim, exclude]
		);
		console.log(
			"row: ",
			row.map((item) => item.id)
		);
		return row.map((item) => item.id);
	} catch (e) {
		console.error("getMultipleUserId: ", e);
		return null;
	}
};

const getProfile = async (user_id) => {
	try {
		const [row] = await pool.query(
			`
      SELECT 
        email, name, 
        plan, allocated, used, 
        DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS created_at
      FROM user WHERE id = ?`,
			user_id
		);
		if (row.length !== 1) {
			throw new Error("getProfile: row.length !== 1");
		}
		return row[0];
	} catch (e) {
		console.error("getProfile: ", e);
		return null;
	}
};

const getConfirmDetails = async (confirm_token) => {
	const [row] = await pool.query(
		`
    SELECT
      id, email, name,
      DATE_FORMAT(confirmed_at, '%Y-%m-%dT%H:%i:%s.000Z') AS confirmed_at 
    FROM user WHERE confirm_token = ? AND confirm_status = 0
  `,
		confirm_token
	);

	return row[0];
};

const changeConfirmStatus = async (time, id) => {
	try {
		const [row] = await pool.query(
			`
        UPDATE user 
        SET confirm_status = 1, updated_at = ?, confirmed_at = ?, confirm_token = NULL 
        WHERE id = ?
      `,
			[time, time, id]
		);

		if (row.affectedRows !== 1) {
			throw new Error("changeConfirmStatus: affectedRows !== 1");
		}

		return true;
	} catch (e) {
		console.error("changeConfirmStatus: ", e);
		return false;
	}
};

export {
	checkMail,
	checkPair,
	getUser,
	createUser,
	changeConfirmToken,
	getMultipleUserId,
	getProfile,
	getConfirmDetails,
	changeConfirmStatus,
};
