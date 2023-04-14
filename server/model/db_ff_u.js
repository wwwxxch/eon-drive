import { pool } from "./connection.js";
// ==========================================================================
const chgDirDelStatus = async(del_status, folder_id, time) => {
  const row = await pool.query(`
    UPDATE ff SET is_delete = ?, updated_at = ? WHERE id = ? 
  `, [del_status, time, folder_id]);
  return row;
};

const updFileAndChgDelStatus = async (del_status, token, file_id, file_size, time, user_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    // change is_delete, up_status, token
    const ff = await conn.query(`
      UPDATE ff 
      SET is_delete = ?, up_status = "pending", token = ?, updated_at = ? 
      WHERE id = ? 
    `, [del_status, token, time, file_id]);
    
    // find the largest version
    const [max_ver] = await conn.query(`
      SELECT max(ver) AS max_ver FROM file_ver WHERE ff_id = ?
    `, file_id);

    // get current version
    const [cur_ver] = await conn.query(`
      SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1
    `, file_id);
    
    // set ver = largest version + 1  
    const upd_ver = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, updated_at, is_current, user_id, operation) 
      VALUES (?, ?, ?, ?, 1, ?, "add")
    `, [file_id, max_ver[0].max_ver + 1, file_size, time, user_id]);

    // set is_current = 0 for current version
    const chg_is_cur = await conn.query(`
      UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
    `, [file_id, cur_ver[0].ver]);
    
    await conn.commit();
    console.log("COMMIT");
    return { new_ver: max_ver[0].max_ver + 1 };

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const updFile = async (token, file_id, file_size, time, user_id) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    // change up_status, token
    const ff = await conn.query(`
      UPDATE ff SET up_status = "pending", token = ?, updated_at = ? WHERE id = ? 
    `, [token, time, file_id]);

    // find the largest version
    const [max_ver] = await conn.query(`
      SELECT max(ver) AS max_ver FROM file_ver WHERE ff_id = ?
    `, file_id);

    // get current version
    const [cur_ver] = await conn.query(`
      SELECT ver FROM file_ver WHERE ff_id = ? AND is_current = 1
    `, file_id);

    // set ver = largest version + 1  
    const upd_ver = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, updated_at, is_current, user_id, operation) 
      VALUES (?, ?, ?, ?, 1, ?, "update")
    `, [file_id, max_ver[0].max_ver + 1, file_size, time, user_id]);

     // set is_current = 0 for current version
    const chg_is_cur = await conn.query(`
      UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND ver = ?
    `, [file_id, cur_ver[0].ver]);
    
    await conn.commit();
    console.log("COMMIT");
    return { new_ver: max_ver[0].max_ver + 1 };

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

const restoreFileTo = async(token, file_id, version, time, user_id) => {
  // ff: setup token & updated_at 
  // file_ver: find the largest version
  // file_ver: set current version record is_current = 0
  // file_ver: get the size of target version
  // file_ver: create a record with new version, operation=restore, is_current = 1
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    // change up_status, token, updated_at
    const ff = await conn.query(`
      UPDATE ff SET up_status = "pending", token = ?, updated_at = ? WHERE id = ? 
    `, [token, time, file_id]);

    // find the largest version
    const [max_ver] = await conn.query(`
      SELECT max(ver) AS max_ver FROM file_ver WHERE ff_id = ?
    `, file_id);

    // set is_current = 0 for current version
    const chg_is_cur = await conn.query(`
      UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND is_current = 1
    `, file_id);

    // get the size of target version
    const [target] = await conn.query(`
      SELECT size FROM file_ver WHERE ff_id = ? AND ver = ?
    `, [file_id, version]);
    console.log(target);

    // insert new record with largest version + 1, operation = "restore", is_current = 1
    const new_ver = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, updated_at, is_current, user_id, operation) 
      VALUES (?, ?, ?, ?, 1, ?, "restore")
    `, [file_id, max_ver[0].max_ver + 1, target[0].size, time, user_id]);

    await conn.commit();
    console.log("COMMIT");
    return { new_ver: max_ver[0].max_ver + 1 };

  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
    
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

export {
  chgDirDelStatus,
  updFileAndChgDelStatus,
  updFile,
  commitMetadata,
  restoreFileTo
};
