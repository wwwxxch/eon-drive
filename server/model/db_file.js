import { pool } from "./connection.js";
// ----------------------------------------------------------
const getDirId = async (parentId, dirName) => {
  // console.log(`getDirId: parentId=${parentId} dirName=${dirName}`);
  const [row] = await pool.query(`
    SELECT id FROM file WHERE parent_id = ? AND name = ? AND type = 'folder'
  `, [parentId, dirName]);
  return row;
};

const saveMetadata = async(parentId, name, type, size) => {
  const [row] = await pool.query(`
    INSERT INTO file (parent_id, name, type, size) VALUES (?, ?, ?, ?) 
  `, [parentId, name, type, size]);
  return row;
};

const getFileList = async(parentId) => {
  const [row] = await pool.query(`
    SELECT id, name, type, size, updated_at FROM file WHERE parent_id = ?
  `, parentId);
  return row;
};

const deleteWholeFolder = async(parentId) => {
  const connection = await pool.getConnection();
 
  try { 
    // Start transaction
    console.log("START TRANSACTION...");
    await connection.query("START TRANSACTION");

    // Delete files
    await connection.query(`
      DELETE FROM file WHERE parent_id = ?
    `, parentId);

    // Delete folder
    await connection.query(`
      DELETE FROM file WHERE id = ?
    `, parentId);

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

const getFileId = async(parentId, fileName) => {
  const [row] = await pool.query(`
    SELECT id FROM file WHERE parent_id = ? AND name = ? AND type = 'file'
  `, [parentId, fileName]);
  return row;
}

const deleteById = async(id) => {
  const [row] = await pool.query(`
    DELETE FROM file WHERE id = ?
  `, id);
  console.log("file deleted");
  return row;
}

export {
  getDirId,
  saveMetadata,
  getFileList,
  deleteWholeFolder,
  getFileId,
  deleteById
};
