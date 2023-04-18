import { pool } from "./connection.js";
// ==========================================
const markDeleteById = async(time, id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - markDeleteById");
    await conn.query("START TRANSACTION");

    const ff = await conn.query(`
      UPDATE ff SET is_delete = 1, updated_at = ? WHERE id = ?
    `, [time, id]);
    
    const delete_rec = await conn.query(`
      INSERT INTO ff_delete (ff_id, deleted_at) VALUES (?, ?)
    `, [id, time]);

    await conn.commit();
    console.log("COMMIT");
    return 1;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
    
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const permDeleteByFileId = async (file_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - permDeleteByFileId");
    await conn.query("START TRANSACTION");

    // share_link_perm, file_ver, ff_delete, ff
    const delete_link = await conn.query(`
      DELETE FROM share_link_perm WHERE ff_id = ?
    `, file_id);

    const delete_file_ver = await conn.query(`
      DELETE FROM file_ver WHERE ff_id = ?
    `, file_id);

    const delete_ff_delete = await conn.query(`
      DELETE FROM ff_delete WHERE ff_id = ?
    `, file_id);

    const delete_ff = await conn.query(`
      DELETE FROM ff WHERE id = ?
    `, file_id);

    await conn.commit();
    console.log("COMMIT");
    return 1;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
    
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const permDeleteByFolderId = async (folder_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - permDeleteByFolderId");
    await conn.query("START TRANSACTION");

    // share_link_perm, ff_delete, ff
    const delete_link = await conn.query(`
      DELETE FROM share_link_perm WHERE ff_id = ?
    `, folder_id);

    const delete_ff_delete = await conn.query(`
      DELETE FROM ff_delete WHERE ff_id = ?
    `, folder_id);

    const delete_ff = await conn.query(`
      DELETE FROM ff WHERE id = ?
    `, folder_id);

    await conn.commit();
    console.log("COMMIT");
    return 1;

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
    
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

export { markDeleteById, permDeleteByFileId, permDeleteByFolderId };
