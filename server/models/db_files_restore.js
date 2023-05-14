import { pool } from "../utils/db_connection.js";
// ====================================================================================
const restoreFileToPrev = async (token, file_id, version, time, user_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - restoreFileToPrev");
		await conn.query("START TRANSACTION");

		// change upd_status, token, updated_at
		const [files] = await conn.query(
			`
      UPDATE files SET files_upd_status = "pre_restore", upd_token = ?, updated_at = ? 
      WHERE id = ? AND user_id = ?
    `,
			[token, time, file_id, user_id]
		);

		// find the largest version
		const [max_ver] = await conn.query(
			`
      SELECT max(ver) AS max_ver FROM file_ver WHERE files_id = ?
    `,
			file_id
		);

		// get the size of target version
		const [target] = await conn.query(
			`
      SELECT size FROM file_ver 
      WHERE files_id = ? AND ver = ? AND ver_upd_status = "done"
    `,
			[file_id, version]
		);

		// insert new record with the largest version + 1, operation = "restore", is_current = 1
		const [new_rec] = await conn.query(
			`
      INSERT INTO file_ver 
      (files_id, ver, ver_upd_status, upd_token, size, 
        updated_at, is_current, operation) 
      VALUES 
      (?, ?, "pre_restore", ?, ?, 
        ?, 1, "restored")
    `,
			[file_id, max_ver[0].max_ver + 1, token, target[0].size, time]
		);

		await conn.commit();
		console.log("COMMIT");
		return { new_ver: max_ver[0].max_ver + 1 };
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return null;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const restoreDeletedFile = async (token, file_id, time, user_id) => {
	// files: setup is_delete & token & updated_at
	// file_ver: find the largest version
	// file_ver: find the version & size with is_current = 1 -> this is the version to be restored
	// file_ver: set current version record is_current = 0
	// file_ver: create a record with new version, operation=restore, is_current = 1
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - restoreDeletedFile");
		await conn.query("START TRANSACTION");

		// change upd_status, token, updated_at
		const [files] = await conn.query(
			`
      UPDATE files 
      SET files_upd_status = "del_restore", upd_token = ?, updated_at = ?, is_delete = 0 
      WHERE id = ? AND user_id = ?
    `,
			[token, time, file_id, user_id]
		);

		if (files.affectedRows !== 1) {
			throw new Error("files.affectedRows !== 1");
		}

		// find the largest version
		const [max_ver] = await conn.query(
			`
      SELECT max(ver) AS max_ver FROM file_ver WHERE files_id = ?
    `,
			file_id
		);

		// file_ver: find the version & size with is_current = 1
		const [cur_ver] = await conn.query(
			`
      SELECT ver, size FROM file_ver 
      WHERE is_current = 1 AND files_id = ? AND ver_upd_status = "done"
    `,
			file_id
		);
		console.log("cur_ver: ", cur_ver);

		// file_ver: create a record with new version, operation=restore, is_current = 1
		const [new_rec] = await conn.query(
			`
      INSERT INTO file_ver 
      (files_id, ver, ver_upd_status, upd_token, size, 
        updated_at, is_current, operation) 
      VALUES 
      (?, ?, "del_restore", ?, ?, 
        ?, 1, "restored")
    `,
			[file_id, max_ver[0].max_ver + 1, token, cur_ver[0].size, time]
		);

		await conn.commit();
		console.log("COMMIT");
		return { cur_ver: cur_ver[0].ver, new_ver: max_ver[0].max_ver + 1 };
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return null;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const restoreDeletedFolder = async (token, folder_id, time, user_id) => {
	// only need to update files table, let is_delete = 0
	const q_string = `
    UPDATE files  
    SET files_upd_status = "del_restore", upd_token = ?, updated_at = ?, is_delete = 0 
    WHERE id = ? AND user_id = ?
  `;
	const [row] = await pool.query(q_string, [token, time, folder_id, user_id]);
	return row;
};

export { restoreFileToPrev, restoreDeletedFile, restoreDeletedFolder };
