import { pool } from "./connection.js";
// =====================================================================
const createDir = async(user_id, parent_id, folder_name, token) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");
    const [ff] = await conn.query(`
      INSERT INTO ff (name, type, up_status, token) VALUES (?,"folder","pending",?)
    `, [folder_name, token]);
    const ff_id = ff.insertId;
    const perm = await conn.query(`
      INSERT INTO perm (ff_id, user_id, auth) VALUES (?, ?, "owner")
    `, [ff_id, user_id]);
    const hier = await conn.query(`
      INSERT INTO hier (ff_id, parent_id, user_id) VALUES (?, ?, ?)
    `, [ff_id, parent_id, user_id]);
    await conn.commit();
    console.log("COMMIT");
    return ff_id;
  } catch (e) {
    await conn.query("ROLLBACK");
    console.log("ROLLBACK - error: ", e);
    return -1;
  } finally {
    await conn.release();
    console.log("RELEASE CONNECTION");
  }
};


const createFile = async(token, user_id, parent_id, file_name, file_size) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION");
    await conn.query("START TRANSACTION");
    const [ff] = await conn.query(`
      INSERT INTO ff (name, type, up_status, token) VALUES (?,"file","pending",?)
    `, [file_name, token]);
    const ff_id = ff.insertId;
    const perm = await conn.query(`
      INSERT INTO perm (ff_id, user_id, auth) VALUES (?, ?, "owner")
    `, [ff_id, user_id]);
    const hier = await conn.query(`
      INSERT INTO hier (ff_id, parent_id, user_id) VALUES (?, ?, ?)
    `, [ff_id, parent_id, user_id]);
    const file_ver = await conn.query(`
      INSERT INTO file_ver (ff_id, ver, size, is_current) VALUES (?, ?, ?, ?)
    `, [ff_id, 1, file_size, 1]);
    await conn.commit();
    console.log("COMMIT");
    return {ff_id, current_ver: 1};
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
  createDir,
  createFile
};