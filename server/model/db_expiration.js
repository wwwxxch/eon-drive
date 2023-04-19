import { pool } from "./connection.js";

import dotenv from "dotenv";
dotenv.config();
const { EXPIRATION_DAYS, EXPIRATION_MIN } = process.env;

const DUR = parseInt(EXPIRATION_MIN) * 60; // min to sec
// const DUR = parseInt(EXPIRATION_DAYS) * 24 * 60 * 60 // day to sec

const getExpiredDeleted = async (currentDT) => {
	const expiredDT = currentDT - DUR;
	const [row] = await pool.query(
		`
    SELECT ff_id FROM ff_delete WHERE deleted_at < ?
  `,
		expiredDT
	);
	const idList = row.map((item) => item.ff_id);
	return idList;
};

const getFileIdWithVersionsExpired = async (currentDT) => {
	const expiredDT = currentDT - DUR;
	const [row] = await pool.query(
		`
    SELECT DISTINCT 
      a.id AS ff_id, a.name, a.user_id
    FROM ff AS a INNER JOIN file_ver AS b
    ON a.id = b.ff_id
    WHERE a.is_current = 0 AND b.updated_at < ?
  `,
		expiredDT
	);

	return row;
};

const getExpiredVersionsById = async (ff_id, currentDT) => {
  const expiredDT = currentDT - DUR;
	const [row] = await pool.query(
		`
    SELECT id AS file_ver_id, ver 
    FROM file_ver WHERE id = ? AND updated_at < ?
  `,
		[ff_id, expiredDT]
	);

	return row;
};

const getExpiredDeletedRec = async (currentDT) => {
	const expiredDT = currentDT - DUR;
	const [row] = await pool.query(
		`
    SELECT a.id 
    FROM ff_delete AS a INNER JOIN ff AS b
    ON a.ff_id = b.id
    WHERE b.is_delete = 0 AND a.deleted_at < ?
  `,
		expiredDT
	);

	return row.map((item) => item.id);
};

export {
	getExpiredDeleted,
	getFileIdWithVersionsExpired,
	getExpiredVersionsById,
	getExpiredDeletedRec,
};
