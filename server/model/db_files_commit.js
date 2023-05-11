import { pool } from "./connection.js";
// ================================================================================
const commitMetadata = async (upd_status, token, user_id, time, commitFolder = 0) => {
	const conn = await pool.getConnection();
	try {
		console.log("START TRANSACTION - commitMetadata");
		await conn.query("START TRANSACTION");

		// 1. find the file_id and version of current version
		const [select] = await conn.query(
			`
      SELECT a.ff_id, a.ver 
      FROM file_ver AS a INNER JOIN ff AS b ON a.ff_id = b.id 
      WHERE a.is_current = 1 AND a.ver_upd_status = "done" 
        AND b.upd_token = ? AND b.user_id = ?
    `,
			[token, user_id]
		);

		if (select.length > 0) {
			// 2. update file_ver to set is_current = 0 for previous version
			const [row_file_ver_to0] = await conn.query(
				`
        UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
      `,
				[select[0].ff_id, select[0].ver]
			);

			console.log("row_file_ver_to0: ", row_file_ver_to0);
			if (row_file_ver_to0.affectedRows !== 1) {
				throw new Error("commitMetadata: row_file_ver_to0.affectedRows !== 1");
			}
		}

		// 3. update ff table
		const [row_ff] = await conn.query(
			`
      UPDATE ff 
      SET ff_upd_status = ?, upd_token = NULL, updated_at = ? 
      WHERE upd_token = ? AND user_id = ?
    `,
			[upd_status, time, token, user_id]
		);

		if (row_ff.affectedRows < 1) {
			throw new Error("commitMetadata: row_ff.affectedRows < 1");
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

		if (commitFolder === 0 && row_file_ver_to1.affectedRows !== 1) {
			throw new Error("commitMetadata: row_file_ver_to1.affectedRows !== 1");
		}

		await conn.commit();
		console.log("COMMIT");
		// return { row_ff, row_file_ver_to0, row_file_ver_to1 };
		return true;
	} catch (e) {
		await conn.query("ROLLBACK");
		console.log("ROLLBACK - error: ", e);
		// return null;
		return false;
	} finally {
		await conn.release();
		console.log("RELEASE CONNECTION");
	}
};

export { commitMetadata };
