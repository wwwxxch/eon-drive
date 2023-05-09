import { pool } from "./connection.js";
// =====================================================================
const createFolder = async(parent_id, folder_name, user_id, token, time) => {
  try {
    const [ff] = await pool.query(`
      INSERT INTO ff 
      (parent_id, name, type, user_id, ff_upd_status, upd_token, created_at, updated_at)
      VALUES (?, ?, "folder", ?, "new_upload", ?, ?, ?)
    `, [parent_id, folder_name, user_id, token, time, time]);
    
    return ff.insertId;
  } catch (e) {
    console.error("createFolder: ", e);
    return -1;
  }
};

const createFile = async(parent_id, file_name, file_size, user_id, token, time) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - createFile");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(`
      INSERT INTO ff 
      (parent_id, name, type, user_id, ff_upd_status, upd_token, created_at, updated_at)
      VALUES (?, ?, "file", ?, "new_upload", ?, ?, ?)
    `, [parent_id, file_name, user_id, token, time, time]);
    const ff_id = ff.insertId;

    const file_ver = await conn.query(`
      INSERT INTO file_ver 
      (ff_id, ver_upd_status, upd_token, ver, size, is_current, updated_at, operation) 
      VALUES (?, "new_upload", ?, ?, ?, ?, ?, ?)
    `, [ff_id, token, 1, file_size, 1, time, "added"]);
    
    await conn.commit();
    console.log("COMMIT");
    return { ff_id, new_ver: 1 };

  } catch (e) {
    await conn.query("ROLLBACK");
    console.error("ROLLBACK - error: ", e);
    return null;
  
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};

export {
  createFolder,
  createFile
};