import { pool } from "./connection.js";
// ==========================================================================
const chgDirDelStatus = async(del_status, folder_id) => {
  const row = await pool.query(`
    UPDATE ff SET is_delete = ? WHERE id = ? 
  `, [del_status, folder_id]);
  return row;
};

const updFileAndChgDelStatus = async (del_status, token, file_id, file_size) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    const ff = await conn.query(`
      UPDATE ff SET is_delete = ?, up_status = "pending", token = ? WHERE id = ? 
    `, [del_status, token, file_id]);
    // get current version
    const [cur_ver] = await conn.query(`
      SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1
    `, file_id);
    // TODO: new version should be the largest version + 1 ! 
    const upd_ver = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, is_current) VALUES (?, ?, ?, 1)
    `, [file_id, cur_ver[0].ver + 1, file_size]);
    const chg_is_cur = await conn.query(`
      UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
    `, [file_id, cur_ver[0].ver]);
    
    await conn.commit();
    console.log("COMMIT");
    return { current_ver: cur_ver[0].ver + 1 };
  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const updFile = async (token, file_id, file_size) => {
  console.log("updFile: ", file_id, file_size);
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    const ff = await conn.query(`
      UPDATE ff SET up_status = "pending", token = ? WHERE id = ? 
    `, [token, file_id]);
    const [cur_ver] = await conn.query(`
      SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1
    `, file_id);
    console.log(cur_ver);
    // TODO: new version should be the largest version + 1 ! 
    const upd_ver = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, is_current) VALUES (?, ?, ?, 1)
    `, [file_id, cur_ver[0].ver + 1, file_size]);
    const chg_is_cur = await conn.query(`
      UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
    `, [file_id, cur_ver[0].ver]); // TODO: 舊版本的updated_at也會變
    
    await conn.commit();
    console.log("COMMIT");
    return { current_ver: cur_ver[0].ver + 1 };
  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const commitMetadata = async(up_status, token) => {
  const [row] = await pool.query(`
    UPDATE ff SET up_status = ?, token = NULL WHERE token = ?
  `, [up_status, token]);
  return row;
};

export {
  chgDirDelStatus,
  updFileAndChgDelStatus,
  updFile,
  commitMetadata
};
