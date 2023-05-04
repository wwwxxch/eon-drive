import { pool } from "./connection.js";
// ==========================================================================
const changeFolderDeleteStatus = async(del_status, folder_id, time) => {
  try {
    const row = await pool.query(`
      UPDATE ff SET is_delete = ?, updated_at = ? WHERE id = ? 
    `, [del_status, time, folder_id]);
    return row;
  } catch (e) {
    console.error("changeFolderDeleteStatus: ", e);
    return null;
  }
};

const updateDeletedFile = async (del_status, token, file_id, file_size, time) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - updateDeletedFile");
    await conn.query("START TRANSACTION");

    // change is_delete, upd_status, token
    const ff = await conn.query(`
      UPDATE ff 
      SET is_delete = ?, upd_status = "pending", upd_token = ?, updated_at = ? 
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
    const new_rec = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, updated_at, is_current,  operation) 
      VALUES (?, ?, ?, ?, 1, "added")
    `, [file_id, max_ver[0].max_ver + 1, file_size, time]);

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
    return null;

  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const updateExistedFile = async (token, file_id, file_size, time) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");

    // change upd_status, token
    const ff = await conn.query(`
      UPDATE ff SET upd_status = "pending", upd_token = ?, updated_at = ? WHERE id = ? 
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
    const new_rec = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, updated_at, is_current, operation) 
      VALUES (?, ?, ?, ?, 1, "updated")
    `, [file_id, max_ver[0].max_ver + 1, file_size, time]);

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
    return null;
    
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

const commitMetadata = async(upd_status, token) => {
  try {
    const [row] = await pool.query(`
      UPDATE ff SET upd_status = ?, upd_token = NULL WHERE upd_token = ?
    `, [upd_status, token]);
    return row;
  } catch (e) {
    console.error("commitMetadata: ", e);
    return null;
  }
};

const restoreFileToPrev = async(token, file_id, version, time, user_id) => {
  // ff: setup token & updated_at 
  // file_ver: find the largest version
  // file_ver: set current version record is_current = 0
  // file_ver: get the size of target version
  // file_ver: create a record with new version, operation=restore, is_current = 1
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - restoreFileToPrev");
    await conn.query("START TRANSACTION");

    // change upd_status, token, updated_at
    const ff = await conn.query(`
      UPDATE ff SET upd_status = "pending", upd_token = ?, updated_at = ? WHERE id = ? 
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

    // insert new record with largest version + 1, operation = "restore", is_current = 1
    const new_rec = await conn.query(`
      INSERT INTO file_ver 
      (ff_id, ver, size, updated_at, is_current, operation) 
      VALUES (?, ?, ?, ?, 1, "restored")
    `, [file_id, max_ver[0].max_ver + 1, target[0].size, time]);

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

const restoreDeletedFile = async(token, file_id, time, user_id) => {
  // ff: setup is_delete & token & updated_at 
  // file_ver: find the largest version
  // file_ver: find the version & size with is_current = 1 -> this is the version to be restored
  // file_ver: set current version record is_current = 0
  // file_ver: create a record with new version, operation=restore, is_current = 1
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - restoreDeletedFile");
    await conn.query("START TRANSACTION");

    // change upd_status, token, updated_at
    const [ff] = await conn.query(`
      UPDATE ff 
      SET upd_status = "pending", upd_token = ?, updated_at = ?, is_delete = 0 
      WHERE id = ? AND user_id = ?
    `, [token, time, file_id, user_id]);

    if (ff.affectedRows !== 1) {
      throw new Error("ff.affectedRows !== 1");
    }

    // find the largest version
    const [max_ver] = await conn.query(`
      SELECT max(ver) AS max_ver FROM file_ver WHERE ff_id = ?
    `, file_id);

    // file_ver: find the version & size with is_current = 1
    const [cur_ver] = await conn.query(`
      SELECT ver, size FROM file_ver WHERE is_current = 1 AND ff_id = ?
    `, file_id);
    console.log("cur_ver: ", cur_ver);
    
    // file_ver: set current version record is_current = 0
    const chg_is_cur = await conn.query(`
      UPDATE file_ver SET is_current = 0 WHERE ff_id = ? AND is_current = 1
    `, file_id);

    // file_ver: create a record with new version, operation=restore, is_current = 1
    const new_rec = await conn.query(`
      INSERT INTO file_ver 
      (ff_id, ver, size, updated_at, is_current, operation) 
      VALUES (?, ?, ?, ?, 1, "restored")
    `, [file_id, max_ver[0].max_ver + 1, cur_ver[0].size, time]);

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

const restoreDeletedFolder = async(token, folder_id, time ) => {
  // only need to update ff table, let is_delete = 0
  const q_string = `
    UPDATE ff  
    SET upd_status = "pending", upd_token = ?, updated_at = ?, is_delete = 0 
    WHERE id = ?
  `;
  const [row] = await pool.query(q_string, [token, time, folder_id]);
  return row;
};

export {
  changeFolderDeleteStatus,
  updateDeletedFile,
  updateExistedFile,
  commitMetadata,
  restoreFileToPrev,
  restoreDeletedFile,
  restoreDeletedFolder
};
