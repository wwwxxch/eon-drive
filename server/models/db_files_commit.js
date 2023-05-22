import { pool } from "../utils/db_connection.js";
// ================================================================================
const commitMetadata = async (upd_status, token, user_id, time) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - commitMetadata");
		await conn.query("START TRANSACTION");

		// 1. find the file_id and version of current version
		const [select] = await conn.query(
			`
      SELECT a.files_id, a.ver 
      FROM file_ver AS a INNER JOIN files AS b ON a.files_id = b.id 
      WHERE a.is_current = 1 AND a.ver_upd_status = "done" 
        AND b.upd_token = ? AND b.user_id = ?
    `,
			[token, user_id]
		);

		if (select.length > 0) {
			// 2. update file_ver to set is_current = 0 for previous version
			for (let i = 0; i < select.length; i++) {
				const [row_file_ver_to0] = await conn.query(
					`
          UPDATE file_ver SET is_current = 0 WHERE files_id = ? AND ver = ?
        `,
					[select[i].files_id, select[i].ver]
				);

				console.log("row_file_ver_to0: ", row_file_ver_to0);
				if (row_file_ver_to0.affectedRows !== 1) {
					throw new Error("commitMetadata: row_file_ver_to0.affectedRows !== 1");
				}
			}
		}

		// 3. update files table
		const [row_files] = await conn.query(
			`
      UPDATE files 
      SET files_upd_status = ?, upd_token = NULL, updated_at = ? 
      WHERE upd_token = ? AND user_id = ?
    `,
			[upd_status, time, token, user_id]
		);

		if (row_files.affectedRows < 1) {
			throw new Error("commitMetadata: row_files.affectedRows < 1");
		}

		// 4. update file_ver to show the current version
		// cannot filter user_id here, don't know how
		const [row_file_ver_to1] = await conn.query(
			`
      UPDATE file_ver 
      SET ver_upd_status = ?, upd_token = NULL, updated_at = ?
      WHERE upd_token = ?
    `,
			[upd_status, time, token]
		);
		console.log("row_file_ver_to1: ", row_file_ver_to1);

		await conn.commit();
		console.log("COMMIT");
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

export { commitMetadata };
