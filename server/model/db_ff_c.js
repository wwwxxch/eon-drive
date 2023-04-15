import { pool } from "./connection.js";
// =====================================================================
// const createDir = async(user_id, parent_id, folder_name, token, time) => {
//   const conn = await pool.getConnection();
//   try {
//     console.log("START TRANSACTION");
//     await conn.query("START TRANSACTION");
//     const [ff] = await conn.query(`
//       INSERT INTO ff (name, type, up_status, token, created_at, updated_at) 
//       VALUES (?,"folder","pending",?, ?, ?)
//     `, [folder_name, token, time, time]);
//     const ff_id = ff.insertId;
//     const perm = await conn.query(`
//       INSERT INTO perm (ff_id, user_id, auth) VALUES (?, ?, "owner")
//     `, [ff_id, user_id]);
//     const hier = await conn.query(`
//       INSERT INTO hier (ff_id, parent_id, user_id) VALUES (?, ?, ?)
//     `, [ff_id, parent_id, user_id]);
//     await conn.commit();
//     console.log("COMMIT");
//     return ff_id;
//   } catch (e) {
//     await conn.query("ROLLBACK");
//     console.log("ROLLBACK - error: ", e);
//     return -1;
//   } finally {
//     await conn.release();
//     console.log("RELEASE CONNECTION");
//   }
// };

const createFolder = async(parent_id, folder_name, user_id, token, time) => {
  const [ff] = await pool.query(`
    INSERT INTO ff 
    (parent_id, name, type, user_id, upd_status, upd_token, created_at, updated_at)
    VALUES (?, ?, "folder", ?, "pending", ?, ?, ?)
  `, [parent_id, folder_name, user_id, token, time, time]);
  
  return ff.insertId;
};

// const createFile = async(token, user_id, parent_id, file_name, file_size, time) => {
//   const conn = await pool.getConnection();
//   try {
//     console.log("START TRANSACTION");
//     await conn.query("START TRANSACTION");
//     const [ff] = await conn.query(`
//       INSERT INTO ff (name, type, up_status, token, created_at, updated_at) 
//       VALUES (?,"file","pending", ?, ?, ?)
//     `, [file_name, token, time, time]);
//     const ff_id = ff.insertId;
//     const perm = await conn.query(`
//       INSERT INTO perm (ff_id, user_id, auth) VALUES (?, ?, "owner")
//     `, [ff_id, user_id]);
//     const hier = await conn.query(`
//       INSERT INTO hier (ff_id, parent_id, user_id) VALUES (?, ?, ?)
//     `, [ff_id, parent_id, user_id]);
//     const file_ver = await conn.query(`
//       INSERT INTO file_ver (ff_id, ver, size, is_current, updated_at, user_id, operation) 
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `, [ff_id, 1, file_size, 1, time, user_id, "add"]);
    
//     await conn.commit();
//     console.log("COMMIT");
//     return {ff_id, new_ver: 1};

//   } catch (e) {
//     await conn.query("ROLLBACK");
//     console.log("ROLLBACK - error: ", e);
//     return -1;

//   } finally {
//     await conn.release();
//     console.log("RELEASE CONNECTION");
//   }
// };

const createFile = async(parent_id, file_name, file_size, user_id, token, time) => {
  const conn = await pool.getConnection();
  try {
    console.log("START TRANSACTION - createFile");
    await conn.query("START TRANSACTION");
    
    const [ff] = await conn.query(`
      INSERT INTO ff 
      (parent_id, name, type, user_id, upd_status, upd_token, created_at, updated_at)
      VALUES (?, ?, "file", ?, "pending", ?, ?, ?)
    `, [parent_id, file_name, user_id, token, time, time]);
    const ff_id = ff.insertId;

    const file_ver = await conn.query(`
      INSERT INTO file_ver 
      (ff_id, ver, size, is_current, updated_at, operation) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [ff_id, 1, file_size, 1, time, "added"]);
    
    await conn.commit();
    console.log("COMMIT");
    return { ff_id, new_ver: 1 };

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
  createFolder,
  createFile
};