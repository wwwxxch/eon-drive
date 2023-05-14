import { pool } from "../utils/db_connection.js";

// ==================================================================
const getExpiredDeleted = async (expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT DISTINCT a.files_id 
    FROM files_delete AS a INNER JOIN files AS b ON a.files_id = b.id  
    WHERE a.deleted_at < ? AND b.is_delete = 1
  `,
		expiredDT
	);
	// const idList = row.map((item) => item.files_id);
	return row.map((item) => item.files_id);
};

const getFileIdWithVersionsExpired = async (expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT DISTINCT 
      a.id AS files_id, a.name, a.user_id
    FROM files AS a INNER JOIN file_ver AS b
    ON a.id = b.files_id
    WHERE a.is_delete = 0 AND b.is_current = 0 AND b.updated_at < ?
  `,
		expiredDT
	);

	return row;
};

const getExpiredVersionsById = async (files_id, expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT id AS file_ver_id, ver 
    FROM file_ver WHERE is_current = 0 AND files_id = ? AND updated_at < ?
  `,
		[files_id, expiredDT]
	);

	return row;
};

const getExpiredDeletedRec = async (expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT a.id 
    FROM files_delete AS a INNER JOIN files AS b
    ON a.files_id = b.id
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
