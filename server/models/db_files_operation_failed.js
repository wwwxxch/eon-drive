import { pool } from "../utils/db_connection.js";
// ================================================================================
const cleanUploadNewPending = async (token, files_id) => {
	try {
		console.log("cleanUploadNewPending");

		const [row] = await pool.query(
			`
      DELETE FROM files WHERE upd_token = ? AND files_id = ?
    `,
			[token, files_id]
		);
		console.log("cleanUploadNewPending - row: ", row);
		// what will be returned when query = delete?
		/*
      cleanUploadNewPending - row:  ResultSetHeader {
        fieldCount: 0,
        affectedRows: 1,
        insertId: 0,
        info: '',
        serverStatus: 34,
        warningStatus: 0
      }
    */
		return true;
	} catch (e) {
		console.log("cleanPending - error: ", e);
		return false;
	}
};

const cleanUploadDeletedPending = async (token, files_id, file_ver_id) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - cleanUploadDeletedPending");
		await conn.query("START TRANSACTION");

		const [delete_file_ver] = await conn.query(
			`
      DELETE FROM file_ver WHERE id = ? AND upd_token = ?
    `,
			[file_ver_id, token]
		);

		const [previous_time] = await conn.query(
			`
      SELECT MAX(deleted_at) AS deleted_at FROM files_delete WHERE files_id = ?
    `,
			files_id
		);

		const [update_files] = await conn.query(
			`
      UPDATE files 
      SET upd_token = null, files_upd_status = "done", updated_at = ?, is_delete = 1 
      WHERE upd_token = ?
    `,
			[previous_time[0].deleted_at, token]
		);

		await conn.commit();
		console.log("COMMIT");
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.error("ROLLBACK - error: ", e);
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

const cleanUploadExistedPending = async (token, files_id, file_ver_id, time) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - cleanUploadExistedPending");
		await conn.query("START TRANSACTION");

		const [delete_file_ver] = await conn.query(
			`
      DELETE FROM file_ver WHERE id = ? AND upd_token = ?
    `,
			[file_ver_id, token]
		);

		const [previous_time] = await conn.query(
			`
      SELECT updated_at FROM file_ver 
      WHERE files_id = ? AND is_current = 1 AND ver_upd_status = "done"
    `,
			files_id
		);

		if (previous_time.length === 0) {
			const [delete_files] = await pool.query(
				`
        DELETE FROM files WHERE upd_token = ?
      `,
				token
			);
		} else {
			const [update_files] = await conn.query(
				`
        UPDATE files SET upd_token = null, files_upd_status = "done", updated_at = ? 
        WHERE upd_token = ?
      `,
				[previous_time[0].updated_at, token]
			);
		}

		await conn.commit();
		console.log("COMMIT");
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.error("ROLLBACK - error: ", e);
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

export { cleanUploadNewPending, cleanUploadDeletedPending, cleanUploadExistedPending };
