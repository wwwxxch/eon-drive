import { pool } from "./connection.js";

// ==================================================================
const getExpiredDeleted = async (expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT ff_id FROM ff_delete WHERE deleted_at < ?
  `,
		expiredDT
	);
	const idList = row.map((item) => item.ff_id);
	return idList;
};

const getFileIdWithVersionsExpired = async (expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT DISTINCT 
      a.id AS ff_id, a.name, a.user_id
    FROM ff AS a INNER JOIN file_ver AS b
    ON a.id = b.ff_id
    WHERE b.is_current = 0 AND b.updated_at < ?
  `,
		expiredDT
	);

	return row;
};

const getExpiredVersionsById = async (ff_id, expiredDT) => {
	const [row] = await pool.query(
		`
    SELECT id AS file_ver_id, ver 
    FROM file_ver WHERE is_current = 0 AND ff_id = ? AND updated_at < ?
  `,
		[ff_id, expiredDT]
	);

	return row;
};

const getExpiredDeletedRec = async (expiredDT) => {
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
