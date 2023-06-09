import { pool } from "../utils/db_connection.js";
// ==========================================
// not adding upd_status = "done" in below query - need to check the status of folder
const getFolderId = async (user_id, parent_id, folder_name) => {
	const [row] = await pool.query(
		`
    SELECT id, is_delete, files_upd_status FROM files 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "folder"
  `,
		[user_id, parent_id, folder_name]
	);
	return row;
};

const getFileId = async (user_id, parent_id, file_name) => {
	const [row] = await pool.query(
		`
    SELECT id, is_delete, files_upd_status FROM files 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "file"
  `,
		[user_id, parent_id, file_name]
	);
	return row;
};

// TODO: getNoDelFileId & getIsDelFileId -> files_upd_status = ?
const getNoDelFileId = async (user_id, parent_id, file_name) => {
	const [row] = await pool.query(
		`
    SELECT id FROM files 
    WHERE user_id = ? AND parent_id = ? AND name = ? 
      AND type = "file" AND is_delete = 0 AND files_upd_status IN ("done", "pre_restore")
  `,
		[user_id, parent_id, file_name]
	);
	return row;
};

const getIsDelFileId = async (user_id, parent_id, file_name) => {
	const [row] = await pool.query(
		`
    SELECT id FROM files 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = "file" AND is_delete = 1
  `,
		[user_id, parent_id, file_name]
	);
	return row;
};

// TODO: getOneLevelChildByParentId -> files_upd_status + NOT IN (..."del_restore") ???
const getOneLevelChildByParentId = async (user_id, parent_id, is_delete) => {
	const q_string = `
    SELECT 
      id, name, type,
      DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updated_at,
      CASE
        WHEN share_token IS NULL THEN 0
        ELSE 1
        END AS is_shared
    FROM files 
    WHERE user_id =? AND parent_id = ? AND is_delete = ? 
      AND files_upd_status NOT IN ("new_upload", "del_upload") 
  `;
	const [row] = await pool.query(q_string, [user_id, parent_id, is_delete]);
	return row;
};

const getCurrentSizeByFileId = async (file_id) => {
	const [row] = await pool.query(
		`
    SELECT id, size FROM file_ver 
    WHERE files_id = ? AND is_current = 1 AND ver_upd_status = "done"
  `,
		file_id
	);
	console.log("getCurrentSizeByFileId row: ", row);
	if (row.length !== 1) {
		return -1;
	}
	return row[0].size;
};

const getCurrentVersionByFileId = async (file_id) => {
	const [row] = await pool.query(
		`
    SELECT ver FROM file_ver 
    WHERE files_id = ? AND is_current = 1 AND ver_upd_status = "done"
  `,
		file_id
	);
	if (row.length !== 1) {
		return -1;
	}
	return row[0].ver;
};

const getSizeByFileIdAndVersion = async (file_id, ver) => {
	const [row] = await pool.query(
		`
    SELECT size FROM file_ver 
    WHERE files_id = ? AND ver = ? AND ver_upd_status = "done"
  `,
		[file_id, ver]
	);
	if (row.length !== 1) {
		return -1;
	}
	return row[0].size;
};

const getVersionsByFileId = async (user_id, file_id) => {
	const [row] = await pool.query(
		`
    SELECT 
      a.ver, a.size, a.is_current, 
      DATE_FORMAT(a.updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS operation_time, 
      a.operation
    FROM file_ver AS a INNER JOIN files AS b 
    ON a.files_id = b.id 
    WHERE b.user_id = ? AND a.files_id = ? AND a.ver_upd_status = "done"
    ORDER BY is_current DESC, operation_time DESC 
  `,
		[user_id, file_id]
	);

	return row;
};

const getDeleteRecordsByFileId = async (user_id, file_id) => {
	const [row] = await pool.query(
		`
    SELECT 
      DATE_FORMAT(a.deleted_at, '%Y-%m-%dT%H:%i:%s.000Z') AS operation_time,
      "deleted" AS operation 
    FROM files_delete AS a INNER JOIN files AS b 
    ON a.files_id = b.id 
    WHERE b.user_id = ? AND a.files_id = ?
  `,
		[user_id, file_id]
	);

	return row;
};

const getParentInfoByFilesId = async (files_id) => {
	const q_string = `
    SELECT a.parent_id, b.name AS parent_name
    FROM files AS a LEFT JOIN files AS b ON a.parent_id = b.id
    WHERE a.id = ?
  `;
	const [parent] = await pool.query(q_string, files_id);
	if (parent.length !== 1) {
		return null;
	}
	return { parent_id: parent[0].parent_id, parent_name: parent[0].parent_name };
};

const getDeletedList = async (user_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - getDeletedList");
		await conn.query("START TRANSACTION");

		const [all] = await conn.query(
			`
      SELECT 
        id, name, type, parent_id,
        DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS deleted_at
      FROM files WHERE is_delete = 1 AND user_id = ?
    `,
			user_id
		);

		const [folders] = await conn.query(
			`
      SELECT id 
      FROM files WHERE is_delete = 1 AND user_id = ? AND type = "folder" 
    `,
			user_id
		);

		await conn.commit();
		console.log("COMMIT");
		return { all, folders };
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return null;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const getFileDetail = async (files_id) => {
	const [row] = await pool.query(
		`
    SELECT 
      a.name, 
      b.size,
      DATE_FORMAT(a.created_at, '%Y-%m-%dT%H:%i:%s.000Z') AS created_at,
      DATE_FORMAT(a.updated_at, '%Y-%m-%dT%H:%i:%s.000Z') AS updated_at, 
      c.name as owner
    FROM files AS a 
    INNER JOIN file_ver AS b ON a.id = b.files_id
    INNER JOIN user AS c on a.user_id = c.id
    WHERE a.id = ? AND a.is_delete = 0 AND b.is_current = 1
  `,
		files_id
	);
	if (row.length !== 1) {
		return null;
	}
	return row[0];
};

const getDeletedFilesInfoById = async (files_id) => {
	const [row] = await pool.query(
		`
    SELECT id, name, type, user_id FROM files WHERE id = ? AND is_delete = 1
  `,
		files_id
	);
	if (row.length !== 1) {
		return null;
	}
	return row[0];
};

const checkPendingFileStatus = async (user_id, token) => {
	try {
		const [row] = await pool.query(
			`
      SELECT 
        a.id AS files_id,
        b.id AS file_ver_id,
        b.ver AS current_ver,
        b.operation
      FROM files AS a INNER JOIN file_ver AS b ON a.id = b.files_id
      WHERE a.user_id = ? AND a.upd_token = ? AND a.files_upd_status != "done" 
        AND b.is_current = 1 AND b.upd_token = ?
    `,
			[user_id, token, token]
		);
		console.log("checkPendingFileStatus: row: ", row);

		if (row.length !== 1) {
			throw new Error("checkPendingFileStatus: row.length !== 1");
		}
		return row[0];
	} catch (e) {
		console.error("checkPendingFileStatus: ", e);
		return null;
	}
};

const getFoldersInfoByPath = async (folders, user_id) => {
	// sprint 5
	try {
		const [row] = await pool.query(
			`
      SELECT id, parent_id, name 
      FROM files 
      WHERE name IN (?) AND user_id = ? 
        AND files_upd_status = "done" AND type = "folder"
    `,
			[folders, user_id]
		);

		return row;
	} catch (e) {
		console.error("getFoldersInfoByPath: ", e);
		return null;
	}
};

export {
	getFolderId,
	getFileId,
	getNoDelFileId,
	getIsDelFileId,
	getOneLevelChildByParentId,
	getCurrentSizeByFileId,
	getCurrentVersionByFileId,
	getSizeByFileIdAndVersion,
	getVersionsByFileId,
	getDeleteRecordsByFileId,
	getParentInfoByFilesId,
	getDeletedList,
	getFileDetail,
	getDeletedFilesInfoById,
	checkPendingFileStatus,
	getFoldersInfoByPath,
};
