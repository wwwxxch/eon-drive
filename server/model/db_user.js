import argon2  from "argon2";
import { pool } from "./connection.js";
// ----------------------------------------------------------
const chkmail = async (mail) => {
  const [row] = await pool.query(`
    SELECT email FROM user WHERE email = ?`, mail
  );
  return row[0];
};

const chkpair = async (mail, pwd) => {
  const [row] = await pool.query(`
    SELECT email, password FROM user WHERE email = ?`, mail
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
  const [row] = await pool.query(`
    SELECT id, email, name, allocated, used FROM user WHERE ${col} = ?`, colVal
  );
  return row[0];
};

const createUser = async (mail, pwd, name) => {
  const hashed = await argon2.hash(pwd);
  const [row] = await pool.query(`
    INSERT INTO user (email, password, name, plan, allocated, used) 
    VALUES (?, ?, ?, ?, ?, ?)`, [mail, hashed, name, 1,  400 * 1024 * 1024, 0]
  );
  const insertId = row.insertId;
  return getUser("id", insertId);
};

export { chkmail, chkpair, getUser, createUser };
