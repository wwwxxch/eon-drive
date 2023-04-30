import argon2 from "argon2";
import { pool } from "./connection.js";

import dotenv from "dotenv";
dotenv.config();

// basic storage plan - X MB
const basic = parseInt(process.env.BASIC);
// ----------------------------------------------------------
const chkmail = async (mail) => {
	const [row] = await pool.query(
		`
    SELECT email FROM user WHERE email = ?`,
		mail
	);
	return row[0];
};

const chkpair = async (mail, pwd) => {
	console.log("chkpair");
	const [row] = await pool.query(
		`
    SELECT email, password FROM user WHERE email = ?`,
		mail
	);
	if (row.length > 0) {
		// argon2.verify(<hashed value>, <plain text>)
		const validate = await argon2.verify(row[0].password, pwd);
		return validate; // possible value: true, false
	}
	return false;
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

const createUser = async (mail, pwd, name, time) => {
	const hashed = await argon2.hash(pwd);
	const [row] = await pool.query(
		`
    INSERT INTO user (email, password, name, plan, allocated, used, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[mail, hashed, name, 1, basic * 1024 * 1024, 0, time, time]
	);
	const insertId = row.insertId;
	return getUser("id", insertId);
};

const getMultipleUserId = async (col, vals, exclude) => {
  try {
    const vals_trim = vals.map((item) => item.trim());
    const [row] = await pool.query(
      `
      SELECT id FROM user WHERE ${col} IN (?) AND ${col} != ?`,
      [vals_trim, exclude]
    );
    console.log("row: ", row.map((item) => item.id));
    return row.map((item) => item.id);
  } catch (e) {
    console.error("getMultipleUserId: ", e);
    return null;
  }
};

const getPossibleUser = async (str, self_email) => {
	const strPlusWlidcard = str + "%";
	const [row] = await pool.query(
		`
    SELECT email FROM user WHERE email LIKE ? AND email != ?
  `,
		[strPlusWlidcard, self_email]
	);

	return row.map((item) => item.email);
};

const getProfile = async (user_id) => {
	const [row] = await pool.query(`
    SELECT 
      email, name, 
      plan, allocated, used, 
      DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS created_at
    FROM user WHERE id = ?`, user_id);
	return row[0];
};

export {
	chkmail,
	chkpair,
	getUser,
	createUser,
	getMultipleUserId,
	getPossibleUser,
  getProfile
};
