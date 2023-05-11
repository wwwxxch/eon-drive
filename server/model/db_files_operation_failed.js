import { pool } from "./connection.js";
// ================================================================================
const cleanUploadNewPending = async (token) => {
	try {
		console.log("cleanUploadNewPending");

		const [row] = await pool.query(
			`
      DELETE FROM ff WHERE upd_token = ?
    `,
			token
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

const cleanUploadDeletedPending = async (token, ff_id, file_ver_id, current_ver) => {
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

		// const [update_file_ver] = await conn.query(
		// 	`
		//   UPDATE file_ver SET is_current = 1 WHERE ff_id = ? AND ver = ?
		// `,
		// 	[ff_id, current_ver - 1]
		// );

		const [previous_time] = await conn.query(
			`
      SELECT MAX(deleted_at) AS deleted_at FROM ff_delete WHERE ff_id = ?
    `,
			ff_id
		);

		const [update_ff] = await conn.query(
			`
      UPDATE ff SET upd_token = null, ff_upd_status = "done", updated_at = ?, is_delete = 1 
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

const cleanUploadExistedPending = async (token, ff_id, file_ver_id, time, current_ver) => {
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
      WHERE ff_id = ? AND is_current = 1 AND ver_upd_status = "done"
    `,
			ff_id
		);

		if (previous_time.length === 0) {
			const [delete_ff] = await pool.query(
				`
        DELETE FROM ff WHERE upd_token = ?
      `,
				token
			);
		} else {
			const [update_ff] = await conn.query(
				`
        UPDATE ff SET upd_token = null, ff_upd_status = "done", updated_at = ? 
        WHERE upd_token = ?
      `,
				[previous_time[0].updated_at, token]
			);
		}

		// await conn.query(
		// 	`
		//   UPDATE file_ver SET is_current = 1 WHERE ff_id = ? AND ver = ?
		// `,
		// 	[ff_id, current_ver - 1]
		// );

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
