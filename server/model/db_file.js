import { pool } from "./connection.js";
// ----------------------------------------------------------
const getDirId = async (userId, parentId, dirName) => {
  // console.log(`getDirId: parentId=${parentId} dirName=${dirName}`);
  const [row] = await pool.query(`
    SELECT id FROM file WHERE user_id = ? AND parent_id = ? AND name = ? AND type = 'folder'
  `, [userId, parentId, dirName]);
  return row;
};

const saveMetadata = async(userId, parentId, name, type, size) => {
  const [row] = await pool.query(`
    INSERT INTO file (parent_id, name, type, size, user_id) VALUES (?, ?, ?, ?, ?) 
  `, [parentId, name, type, size, userId]);
  return row;
};

const updMetadata = async(userId, parentId, name, type, size) => {
  const [row] = await pool.query(`
    UPDATE file SET size = ? 
    WHERE user_id = ? AND parent_id = ? AND name = ? AND type = 'file'
  `, [userId, size, parentId, name, type]);
  return row;
};

const getFileList = async(userId, parentId) => {
  const [row] = await pool.query(`
    SELECT id, name, type, size, updated_at FROM file WHERE user_id = ? AND parent_id = ?
  `, [userId, parentId]);
  return row;
};

const deleteWholeFolder = async(userId, parentId) => {
  const connection = await pool.getConnection();
 
  try { 
    // Start transaction
    console.log("START TRANSACTION...");
    await connection.query("START TRANSACTION");

    // Delete files
    await connection.query(`
      DELETE FROM file WHERE user_id = ? AND parent_id = ?
    `, [userId, parentId]);

    // Delete folder
    await connection.query(`
      DELETE FROM file WHERE user_id = ? AND id = ?
    `, [userId, parentId]);

    // Complete transaction - Commit
    await connection.commit();
    console.log(`...COMMIT 
      - folder and files inside are deleted`);
    
    return true;
  } catch (err) {
    // Failed - Rollback
    await connection.query("ROLLBACK");
    console.log("...ROLLBACK - ", err, + "...");
    return false;
  } finally {
    // Release connection
    await connection.release();
    console.log("...RELEASE CONNECTON");
  }
};

const getFileId = async(userId, parentId, fileName) => {
  const [row] = await pool.query(`
    SELECT id FROM file WHERE user_id = ? AND parent_id = ? AND name = ? AND type = 'file'
  `, [userId, parentId, fileName]);
  return row;
};

const deleteById = async(userId, id) => {
  const [row] = await pool.query(`
    DELETE FROM file WHERE user_id = ? AND id = ?
  `, [userId, id]);
  console.log("file deleted");
  return row;
};

export {
  getDirId,
  saveMetadata,
  updMetadata,
  getFileList,
  deleteWholeFolder,
  getFileId,
  deleteById
};
